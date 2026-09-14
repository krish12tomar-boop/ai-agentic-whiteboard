import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isProtectedRoute = createRouteMatcher([
  "/dashboard/:path*",
  "/dashboard",
])

export default clerkMiddleware(async (auth, req) => {
   if (isProtectedRoute (req)) await auth.protect()
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for Clerk's auto-proxy path
    '/__clerk/:path*',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};



//import { NextResponse } from "next/server";
//import type { NextRequest } from "next/server";

//export function proxy(request: NextRequest) {
 // return NextResponse.next();
//}

//export const config = {
  //matcher: ["/((?!_next|[^?]*\\.(?:html|css|js|gif|svg|jpg|jpeg|png|woff|woff2|ico|csv|docx|xlsx|zip|webmanifest)).*)"],
//};
