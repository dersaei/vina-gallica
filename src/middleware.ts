import { defineMiddleware } from "astro:middleware";
import { getValidAccessToken } from "./lib/auth";

export const onRequest = defineMiddleware(
  async ({ url, cookies, redirect }, next) => {
    const { pathname } = url;

    if (pathname.startsWith("/fr/dashboard")) {
      if (!(await getValidAccessToken(cookies))) {
        return redirect(`/fr/connexion?next=${encodeURIComponent(pathname)}`);
      }
    } else if (pathname.startsWith("/dashboard")) {
      if (!(await getValidAccessToken(cookies))) {
        return redirect(`/login?next=${encodeURIComponent(pathname)}`);
      }
    }

    return next();
  },
);
