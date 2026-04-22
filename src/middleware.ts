import { defineMiddleware } from "astro:middleware";

const PROTECTED = ["/dashboard"];

export const onRequest = defineMiddleware(({ url, cookies, redirect }, next) => {
  const isProtected = PROTECTED.some((path) => url.pathname.startsWith(path));
  if (!isProtected) return next();

  const token = cookies.get("directus_access_token");
  if (!token) {
    return redirect(`/login?next=${encodeURIComponent(url.pathname)}`);
  }

  return next();
});
