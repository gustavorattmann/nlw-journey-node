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
                owner_id: z.string().uuid(),
              }),
            })
            .describe("OK"),
        },
      },
    },
    async (request, reply) => {
      const { tripId } = request.params;

      const trip = await prisma.trip.findUnique({
        where: {
          id: tripId,
        },
        include: {
          participants: {
            select: {
              id: true,
            },
            where: {
              is_owner: true,
            },
          },
        },
      });

      if (!trip) throw new ClientError("Trip not found.");

      console.log(trip);

      return reply.send({
        trip: {
          id: trip.id,
          is_confirmed: trip.is_confirmed,
          destination: trip.destination,
          starts_at: trip.starts_at,
          ends_at: trip.ends_at,
          owner_id: trip.participants[0].id,
        },
      });
    }
  );
}
