import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  API_BASE_URL: z.string().url(),
  WEB_BASE_URL: z.string().url(),
  PORT: z.coerce.number().default(3333),
  ENV: z.string().toLowerCase().default("dev"),
  DEBUG: z.coerce.boolean().default(false),
});

export const env = envSchema.parse(process.env);
