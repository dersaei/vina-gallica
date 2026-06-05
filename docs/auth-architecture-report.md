# System rejestracji i logowania użytkowników — raport architektury

> Przewodnik wdrożeniowy na podstawie implementacji w Vina Gallica.
> Cel dokumentu: umożliwić zbudowanie analogicznego systemu kont w innych projektach
> opartych o **Astro (SSR) + Directus** na **Cloudflare Workers**.

---

## 1. Decyzja architektoniczna

Uwierzytelnianie oparte jest o **wbudowany system auth Directusa** — bez Clerk, Supabase Auth
ani żadnego zewnętrznego IdP.

**Dlaczego tak:**

- Directus i tak jest backendem/CMS-em projektu — ma gotowe role i uprawnienia.
- Wspiera tokeny JWT (access + refresh) działające bezstanowo, co pasuje do Cloudflare Workers.
- Zero dodatkowych kosztów i zależności zewnętrznych.

**Model sesji:** tokeny trzymane są w **httpOnly cookies**, a nie w `localStorage`.
Cała logika sesji żyje po stronie serwera (Astro SSR / API routes). Frontend nigdy
nie dotyka tokenu — to klucz do bezpieczeństwa tego podejścia.

**Tryb komunikacji z Directus:** używamy `mode: "json"` przy logowaniu/refreshu, czyli
Directus zwraca tokeny w body odpowiedzi, a my **sami** zapisujemy je do własnych cookies.
Nie pozwalamy Directusowi ustawiać własnych cookies (`mode: "cookie"`), bo wtedy nie mielibyśmy
kontroli nad flagami `httpOnly`/`secure`/`sameSite` ani nad domeną.

---

## 2. Model tokenów i cookies

Dwa cookies, oba **httpOnly**, **secure** (tylko w produkcji), **SameSite=Lax**, `path=/`:

| Cookie                    | Zawartość           | Czas życia | Rola |
| ------------------------- | ------------------- | ---------- | ---- |
| `directus_access_token`   | krótki JWT access   | 15 min     | autoryzacja każdego żądania do Directus |
| `directus_refresh_token`  | długi refresh token | 7 dni      | odnowienie access tokenu bez ponownego logowania |

Zasada: **access token wygasa szybko** (ogranicza okno ataku), ale użytkownik nie jest
co 15 minut wylogowywany, bo refresh token cicho odnawia sesję przez tydzień.

```ts
// lib/auth.ts — ustawianie cookies
const ACCESS_MAX_AGE  = 60 * 15;            // 15 min
const REFRESH_MAX_AGE = 60 * 60 * 24 * 7;   // 7 dni

cookies.set("directus_access_token", accessToken, {
  httpOnly: true,
  secure: isProd,        // import.meta.env.PROD — lokalnie http działa
  sameSite: "lax",
  path: "/",
  maxAge: ACCESS_MAX_AGE,
});
// analogicznie directus_refresh_token z REFRESH_MAX_AGE
```

---

## 3. Serce systemu: `getValidAccessToken()`

Jedna funkcja, której używają **wszystkie** chronione strony i endpointy. Realizuje
„transparentny refresh”:

1. Jest access cookie → zwróć je od razu.
2. Brak access, ale jest refresh → uderz w `POST /auth/refresh`, zapisz nowe oba tokeny
   do cookies, zwróć nowy access.
3. Brak refresh / refresh wygasł → wyczyść cookies i zwróć `null` (= niezalogowany).

```ts
export async function getValidAccessToken(cookies): Promise<string | null> {
  const accessToken = cookies.get("directus_access_token")?.value;
  if (accessToken) return accessToken;

  const refreshToken = cookies.get("directus_refresh_token")?.value;
  if (!refreshToken) return null;

  const res = await fetch(`${DIRECTUS_URL}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: refreshToken, mode: "json" }),
  });
  if (!res.ok) { clearAuthCookies(cookies); return null; }

  const { data } = await res.json();
  setAuthCookies(cookies, data.access_token, data.refresh_token);
  return data.access_token;
}
```

**To jest wzorzec do skopiowania 1:1.** Reszta systemu to tylko cienkie warstwy wokół niego.
`null` zawsze i wszędzie traktujemy jako „niezalogowany”.

---

## 4. Middleware — strażnik tras

`src/middleware.ts` chroni całe gałęzie URL. Jeśli `getValidAccessToken` zwróci `null`,
przekierowuje na login z parametrem `next` (powrót po zalogowaniu):

```ts
export const onRequest = defineMiddleware(async ({ url, cookies, redirect }, next) => {
  const { pathname } = url;

  if (pathname.startsWith("/fr/dashboard")) {
    if (!(await getValidAccessToken(cookies)))
      return redirect(`/fr/connexion?next=${encodeURIComponent(pathname)}`);
  } else if (pathname.startsWith("/dashboard")) {
    if (!(await getValidAccessToken(cookies)))
      return redirect(`/login?next=${encodeURIComponent(pathname)}`);
  }

  return next();
});
```

Uwaga na **kolejność prefiksów**: bardziej szczegółowy (`/fr/dashboard`) musi być sprawdzany
przed ogólniejszym (`/dashboard`), bo `/dashboard` byłby też prefiksem `/fr/...`? — nie, ale
różne języki = różne strony logowania, więc rozgałęzienie jest świadome.

---

## 5. Przepływy (endpointy API)

Wszystkie endpointy: `export const prerender = false`, przyjmują `FormData`, zwracają JSON.
Frontend wysyła `fetch` z formularza i reaguje na `{ ok: true }` lub `{ error }`.

### 5.1 Rejestracja — `POST /api/auth/register`

Dwuetapowa, bo publiczny endpoint Directusa nie przyjmuje pól custom:

1. **Walidacja + anty-bot:** sprawdzenie pól, zgodności haseł, **siły hasła** (regex:
   min. 16 znaków, mała + wielka litera + cyfra + znak specjalny) oraz **Cloudflare Turnstile**
   (weryfikacja tokenu po stronie serwera w `challenges.cloudflare.com/turnstile/v0/siteverify`).
2. **Utworzenie konta:** `POST /users/register` (publiczny) — tworzy użytkownika i **wysyła
   maila weryfikacyjnego** z `verification_url` wskazującym na naszą stronę (`/verify-email`
   lub `/fr/verification-email`).
3. **Uzupełnienie pól custom:** osobnym `DIRECTUS_SERVICE_TOKEN` (techniczny user) szukamy
   świeżo utworzonego usera po emailu i `updateUser` ustawiamy `company_name`, `tax_id`,
   `company_address`, `plan: "free"`. Ten krok jest **non-fatal** — jeśli padnie, konto i tak
   istnieje, a pola da się uzupełnić później.

Kody błędów: duplikat emaila (`RECORD_NOT_UNIQUE`) → `409`, inne → `500`/`400`.

> **Ewolucja względem pierwszej wersji:** początkowo rejestracja szła wyłącznie przez
> `createUser` z service tokenem. Przejście na `/users/register` + patch service tokenem
> dało nam darmową weryfikację emaila Directusa, zachowując pola custom.

### 5.2 Logowanie — `POST /api/auth/login`

```
email + password  →  POST /auth/login (mode: json)  →  setAuthCookies(access, refresh)  →  { ok: true }
```

Błędne dane → `401` z komunikatem z Directusa (lub generyczny „Invalid email or password”).

### 5.3 Wylogowanie — `POST /api/auth/logout`

Unieważnia refresh token po stronie Directusa (`POST /auth/logout`) **oraz** kasuje oba
cookies lokalnie. Inwalidacja serwerowa jest ważna — samo skasowanie cookie nie unieważnia tokenu.

### 5.4 Reset hasła (niezalogowany) — 2 endpointy

- `POST /api/auth/request-password-reset` → `POST /auth/password/request` z `reset_url`
  na naszą stronę → Directus wysyła maila.
- `POST /api/auth/reset-password` → walidacja siły hasła → `POST /auth/password/reset`
  z `token` (z maila) + nowym hasłem.

### 5.5 Edycja profilu / zmiana hasła (zalogowany) — 2 endpointy

Oba zaczynają od `getValidAccessToken` (brak → `401`), potem `PATCH /users/me`
z `Authorization: Bearer <token>`:

- `update-profile` — **whitelist pól** (`first_name`, `last_name`, `email`, `company_name`,
  `tax_id`, `company_address`). Pole spoza listy → `400`. To zapobiega podniesieniu uprawnień
  przez wysłanie np. `role` albo `plan`.
- `update-password` — walidacja zgodności i siły, potem `PATCH /users/me { password }`.

---

## 6. Strony chronione — odczyt użytkownika

Strona dashboardu (już przepuszczona przez middleware) sama pobiera profil w SSR:

```ts
const accessToken = await getValidAccessToken(Astro.cookies);
let user = null;
if (accessToken) {
  const res = await fetch(`${DIRECTUS_URL}/users/me?fields=id,first_name,...,plan`,
    { headers: { Authorization: `Bearer ${accessToken}` } });
  if (res.ok) user = (await res.json()).data;
}
```

Strony „dla niezalogowanych” (login) robią odwrotnie — jeśli access cookie istnieje,
od razu `redirect("/dashboard")`.

---

## 7. Weryfikacja emaila

Strona `/verify-email` czyta `?token=...` z URL (z maila), uderza w
`GET /users/register/verify-email?token=...` i renderuje jeden z trzech stanów:
`success` / `error` / `missing` (brak tokenu). Linki ważne 7 dni.

---

## 8. Konfiguracja Directus (po stronie CMS)

- **Role:** `Business User VG` (użytkownik biznesowy, domyślna rola publicznej rejestracji),
  `Service Worker VG` (techniczny user do patcha pól).
- **Polityki:**
  - `Business User VG — Own Profile` — Read+Update na `directus_users` gdzie `id = $CURRENT_USER`
    (użytkownik widzi/edytuje tylko siebie).
  - `Can Read and Update Users` — Create+Read+Update na `directus_users` (dla service usera).
- **Public Registration:** ON, domyślna rola `Business User VG`.
- **Pola custom w `directus_users`:** `company_name`, `tax_id`, `company_address`,
  `company_location` (Geometry/Point, opcjonalne), `plan` (free/premium, default free).
- **SMTP:** maile (weryfikacja, reset) idą przez Fastmail (`smtp.fastmail.com:465`, SSL).
- **Allow-listy URL:** `USER_REGISTER_URL_ALLOW_LIST` i `PASSWORD_RESET_URL_ALLOW_LIST`
  muszą zawierać domeny naszych stron weryfikacji/resetu — inaczej Directus odrzuci `verification_url`/`reset_url`.

---

## 9. Sekrety (Doppler)

| Zmienna                   | Zakres   | Do czego |
| ------------------------- | -------- | -------- |
| `DIRECTUS_URL`            | server   | adres instancji Directus |
| `DIRECTUS_SERVICE_TOKEN`  | server   | techniczny token do patcha pól przy rejestracji |
| `TURNSTILE_SECRET_KEY`    | server   | weryfikacja Cloudflare Turnstile |

Wszystko serwerowe — **nic z auth nie trafia do bundla klienta**. Brak `.env` w repo.

---

## 10. Checklista wdrożenia w nowym projekcie

1. Directus: role + polityki (own-profile dla usera, read/update dla service usera),
   pola custom, Public Registration ON, SMTP, allow-listy URL.
2. Doppler/env: `DIRECTUS_URL`, `DIRECTUS_SERVICE_TOKEN`, ewentualnie `TURNSTILE_SECRET_KEY`.
3. `lib/auth.ts`: `setAuthCookies`, `clearAuthCookies`, **`getValidAccessToken`** (rdzeń).
4. `middleware.ts`: ochrona prefiksów + redirect z `?next=`.
5. Endpointy `/api/auth/*`: register, login, logout, request-password-reset,
   reset-password, update-profile (whitelist!), update-password.
6. Strony: login, verify-email, reset/update-password, dashboard (SSR `users/me`).
7. Wszystkie endpointy SSR: `export const prerender = false`.

---

## 11. Zasady bezpieczeństwa — czego się trzymać

- **Tokeny tylko w httpOnly cookies.** Nigdy w `localStorage`/JS. Frontend nie zna tokenu.
- **Krótki access + długi refresh** z cichym odnawianiem — bezpieczeństwo bez UX-owego bólu.
- **Logout = inwalidacja serwerowa + skasowanie cookies.** Samo cookie to za mało.
- **Whitelist pól** przy edycji profilu — zero zaufania do tego, co przyśle klient.
- **Walidacja siły hasła po stronie serwera** (nie tylko w przeglądarce). Ten sam regex
  w register / reset / update.
- **Anty-bot na rejestracji** (Turnstile), weryfikowany serwerowo.
- **Service token** o minimalnym potrzebnym zakresie, używany tylko tam, gdzie konieczne
  (patch pól custom), nigdy nie wystawiony klientowi.
- **`secure` zależne od środowiska** (`import.meta.env.PROD`) — żeby lokalny http działał,
  a produkcja wymuszała https.
