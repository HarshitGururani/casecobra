import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Define public routes
const isPublicRoute = createRouteMatcher(["/", "/api/uploadthing"]);

export default clerkMiddleware((auth, req) => {
  // If the route is public, do not require authentication
  if (isPublicRoute(req)) return;

  // For all other routes, require authentication
  auth().protect();
});

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
