// middleware.js
export { updateSession as middleware } from "@/utils/supabase/middleware";

// Only guard authenticated areas; leave "/" (landing) public.
export const config = {
  matcher: ["/dashboard/:path*"],
};
