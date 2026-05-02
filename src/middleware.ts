import { defineMiddleware } from "astro:middleware";

export const onRequest = defineMiddleware(({ url, cookies, redirect }, next) => {
  const { pathname } = url;

  if (pathname.startsWith("/dashboard")) {
    if (!cookies.get("directus_access_token")) {
      return redirect(`/login?next=${encodeURIComponent(pathname)}`);
    }
  }

  if (pathname.startsWith("/fr/dashboard")) {
    if (!cookies.get("directus_access_token")) {
      return redirect(`/fr/connexion?next=${encodeURIComponent(pathname)}`);
    }
  }

  return next();
});
