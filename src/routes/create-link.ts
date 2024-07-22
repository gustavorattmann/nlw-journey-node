import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { ClientError } from "../errors/client-error";
import { defaultResponses } from "../models/default-responses";

export async function createLink(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().post(
    "/trips/:tripId/links",
    {
      schema: {
        summary: "Create link",
        description: "To save a new link",
        tags: ["Links"],
        params: z.object({
          tripId: z.string().uuid(),
        }),
        body: z.object({
          title: z.string().min(4),
          url: z.string().url(),
        }),
        response: {
          ...defaultResponses,
          201: z
            .object({
              linkId: z.string().uuid(),
            })
            .describe("Created"),
        },
      },
    },
    async (request, reply) => {
      const { tripId } = request.params;
      const { title, url } = request.body;

      const trip = await prisma.trip.findUnique({
        where: {
          id: tripId,
        },
      });

      if (!trip) throw new ClientError("Trip not found.");

      const link = await prisma.link.create({
        data: {
          title,
          url,
          trip_id: tripId,
        },
      });

      return reply.status(201).send({ linkId: link.id });
    }
  );
}
