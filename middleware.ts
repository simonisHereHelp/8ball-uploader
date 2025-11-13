// middleware.ts
import { auth } from "./auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { pathname, origin } = req.nextUrl;
  const email = req.auth?.user?.email;
  const isAllowed = email === "99.cent.bagel@gmail.com";

  // Shared sign-in URL
  const signInUrl = new URL("/api/auth/signin", origin);
  signInUrl.searchParams.set("callbackUrl", "/uploader");

  // 1) Protect /uploader and its subpaths
  const isUploaderPath =
    pathname === "/uploader" || pathname.startsWith("/uploader/");

  if (isUploaderPath && !isAllowed) {
    return NextResponse.redirect(signInUrl);
  }

  // 2) Everything else continues
  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next|api|.*\\..*).*)"],
};
