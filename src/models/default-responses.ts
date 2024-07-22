import { z } from "zod";

export const defaultResponses = {
  500: z
    .object({
      message: z.string(),
    })
    .describe("Internal Server Error"),
  400: z
    .object({
      message: z.string(),
    })
    .describe("Bad Request"),
};
