import { NextRequest, NextResponse } from "next/server"

const PUBLIC_ROUTES = [
    "/",
    "/signin",
]

export function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl

    if (
        pathname.startsWith("/_next") ||
        pathname.startsWith("/static") ||
        pathname === "/favicon.ico"
    ) {
        return NextResponse.next()
    }

    if (PUBLIC_ROUTES.includes(pathname)) {
        return NextResponse.next()
    }

    const hasSession = req.cookies
        .getAll()
        .some((cookie) => cookie.name.includes("auth-token"))
    if (!hasSession) {
        return NextResponse.redirect(new URL("/signin", req.url))
    }

    return NextResponse.next()
}

export const config = {
    matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
