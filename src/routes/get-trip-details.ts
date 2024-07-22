import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { ClientError } from "../errors/client-error";
import { defaultResponses } from "../models/default-responses";

export async function getTripDetails(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().get(
    "/trips/:tripId",
    {
      schema: {
        summary: "Trip informartion",
        description: "Get trip details",
        tags: ["Trips"],
        params: z.object({
          tripId: z.string().uuid(),
        }),
        response: {
          ...defaultResponses,
          200: z
            .object({
              trip: z.object({
                id: z.string().uuid(),
                is_confirmed: z.boolean(),
                destination: z.string(),
                starts_at: z.date(),
                ends_at: z.date(),
              }),
            })
            .describe("OK"),
        },
      },
    },
    async (request, reply) => {
      const { tripId } = request.params;

      const trip = await prisma.trip.findUnique({
        select: {
          id: true,
          destination: true,
          starts_at: true,
          ends_at: true,
          is_confirmed: true,
        },
        where: {
          id: tripId,
        },
      });

      if (!trip) throw new ClientError("Trip not found.");

      return reply.send({ trip });
    }
  );
}
