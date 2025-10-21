import type { User } from "@supabase/supabase-js";

declare module "express-serve-static-core" {
  interface Request {
    user?: User & { source: "custom-jwt" | "supabase" };
  }
}
