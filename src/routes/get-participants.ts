import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { ClientError } from "../errors/client-error";
import { defaultResponses } from "../models/default-responses";

export async function getParticipants(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().get(
    "/trips/:tripId/participants",
    {
      schema: {
        summary: "Get participants",
        description: "Get list all participants",
        tags: ["Participants"],
        params: z.object({
          tripId: z.string().uuid(),
        }),
        response: {
          ...defaultResponses,
          200: z
            .object({
              participants: z.array(
                z.object({
                  id: z.string().uuid(),
                  name: z.string().nullable(),
                  email: z.string().email(),
                  is_confirmed: z.boolean(),
                  is_owner: z.boolean(),
                })
              ),
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
              name: true,
              email: true,
              is_confirmed: true,
              is_owner: true,
            },
          },
        },
      });

      if (!trip) throw new ClientError("Trip not found.");

      return reply.send({ participants: trip.participants });
    }
  );
}
