import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { ClientError } from "../errors/client-error";
import { defaultResponses } from "../models/default-responses";

export async function deleteLink(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().delete(
    "/trips/:tripId/links/:linkId",
    {
      schema: {
        summary: "Delete link",
        description: "When owner need delete link",
        tags: ["Links"],
        params: z.object({
          tripId: z.string().uuid(),
          linkId: z.string().uuid(),
        }),
        response: {
          ...defaultResponses,
          200: z
            .object({
              message: z.string(),
            })
            .describe("OK"),
        },
      },
    },
    async (request, reply) => {
      const { tripId, linkId } = request.params;

      const trip = await prisma.trip.findUnique({
        where: {
          id: tripId,
        },
        include: {
          links: true,
        },
      });

      if (!trip) throw new ClientError("Trip not found.");

      if (!trip.links.some((link) => link.id === linkId))
        throw new ClientError("Link not found.");

      await prisma.link.delete({
        where: {
          id: linkId,
        },
      });

      return reply.send({ message: "Link deleted." });
    }
  );
}
