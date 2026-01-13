import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow these paths
  const isAllowed =
    pathname.startsWith("/auth") ||
    pathname.startsWith("/_next") || // required for Next.js runtime files
    pathname.startsWith("/favicon.ico") ||
    pathname.startsWith("/logo.png") || // example: static image
    pathname.startsWith("/images") || // custom folder for images
    pathname.startsWith("/public") || // optional if you route like /public/xyz.png
    pathname.match(/\.(png|jpg|jpeg|gif|svg|webp|ico)$/); // allow image file extensions

  if (true) {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();
  url.pathname = "/auth";
  return NextResponse.redirect(url);
}
