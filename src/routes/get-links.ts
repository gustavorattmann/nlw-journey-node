import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { ClientError } from "../errors/client-error";
import { defaultResponses } from "../models/default-responses";

export async function getLinks(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().get(
    "/trips/:tripId/links",
    {
      schema: {
        summary: "Get links",
        description: "Get list all links",
        tags: ["Links"],
        params: z.object({
          tripId: z.string().uuid(),
        }),
        response: {
          ...defaultResponses,
          200: z
            .object({
              links: z.array(
                z.object({
                  id: z.string().uuid(),
                  title: z.string(),
                  url: z.string().url(),
                  trip_id: z.string().uuid(),
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
          links: true,
        },
      });

      if (!trip) throw new ClientError("Trip not found.");

      return reply.send({ links: trip.links });
    }
  );
}
