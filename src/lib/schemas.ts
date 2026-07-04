import { z } from "zod";

/**
 * Accepts both absolute URLs (Supabase Storage in production) and
 * site-relative paths (the local-disk storage fallback used when
 * Supabase isn't configured — see src/lib/storage.ts).
 */
export const imageUrlSchema = z
  .string()
  .refine((v) => v.startsWith("/") || /^https?:\/\//.test(v), { message: "Invalid image URL" });
