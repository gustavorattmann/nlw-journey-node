import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  WEB_BASE_URL: z.string().url(),
  API_BASE_URL: z.string().url(),
  RENDER_EXTERNAL_URL: z.string().url().nullish(),
  VERCEL_PROJECT_PRODUCTION_URL: z.string().url().nullish(),
  VERCEL_BRANCH_URL: z.string().url().nullish(),
  PLATFORM: z.enum(["vercel", "render", "local"]).default("local"),
  PORT: z.coerce.number().default(3333),
  NODE_ENV: z.enum(["prod", "dev"]).default("dev"),
  DEBUG: z
    .enum(["true", "false"])
    .transform((val) => val === "true")
    .default("false"),
});

export const env = envSchema.parse(process.env);
