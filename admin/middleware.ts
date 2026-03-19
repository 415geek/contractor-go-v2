import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Clerk 内部路由会被重写到 `/clerk_<...>`，如果也被 protect，会导致内部页面无法渲染（最终变成 Next 404）
const isPublicRoute = createRouteMatcher([
  "/login(.*)",
  "/sso-callback(.*)",
  "/clerk_(.*)",
]);

// 管理后台需校验管理员：ADMIN_USER_IDS 环境变量（逗号分隔的 Clerk user id）
const getAdminIds = (): string[] => {
  const ids = process.env.ADMIN_USER_IDS;
  if (!ids?.trim()) return [];
  return ids.split(",").map((s) => s.trim()).filter(Boolean);
};

export default clerkMiddleware(async (auth, request) => {
  if (request.nextUrl.pathname.startsWith("/clerk_")) return;

  if (!isPublicRoute(request)) {
    await auth.protect();
    const adminIds = getAdminIds();
    if (adminIds.length > 0) {
      const { userId } = await auth();
      if (!userId || !adminIds.includes(userId)) {
        return NextResponse.redirect(new URL("/login", request.url));
      }
    }
  }
});

export const config = {
  matcher: [
    "/((?!_next|clerk_|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
