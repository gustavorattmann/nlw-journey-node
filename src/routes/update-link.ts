import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { ClientError } from "../errors/client-error";

export async function updateLink(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().put(
    "/trips/:tripId/links/:linkId",
    {
      schema: {
        tags: ["Links"],
        params: z.object({
          tripId: z.string().uuid(),
          linkId: z.string().uuid(),
        }),
        body: z.object({
          title: z.string().min(4),
          url: z.string().url(),
        }),
      },
    },
    async (request) => {
      const { tripId, linkId } = request.params;
      const { title, url } = request.body;

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

      await prisma.link.update({
        where: {
          id: linkId,
        },
        data: {
          title,
          url,
        },
      });

      return { linkId: linkId };
    }
  );
}
