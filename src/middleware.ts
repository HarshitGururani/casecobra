import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Define public routes
const isPublicRoute = createRouteMatcher([
  "/",
  "/configure(.*)",
  "/api/uploadthing",
]);

export default clerkMiddleware(async (auth, req) => {
  // If the route is public, do not require authentication
  if (isPublicRoute(req) || req.nextUrl.pathname.includes(".")) return;

  // For all other routes, require authentication
  await auth().protect();
});

export const config = {
  matcher: ["/((?!_next).*)"],
};
