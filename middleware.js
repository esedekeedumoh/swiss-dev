import { NextResponse } from "next/server";

const adminPath = process.env.ADMIN_URL_PATH;

export function middleware(request) {
    const pathname = request.nextUrl.pathname;

    if (adminPath && pathname === `/${adminPath}`) {
        const rewriteUrl = request.nextUrl.clone();
        rewriteUrl.pathname = "/admin";
        return NextResponse.rewrite(rewriteUrl);
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/admin/:path*", "/((?!api|_next|favicon.ico).*)"],
};