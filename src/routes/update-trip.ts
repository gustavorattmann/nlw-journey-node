import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { dayjs } from "../lib/dayjs";
import { ClientError } from "../errors/client-error";
import { defaultResponses } from "../models/default-responses";

export async function updateTrip(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().put(
    "/trips/:tripId",
    {
      schema: {
        summary: "Update trip",
        description: "When owner need update trip",
        tags: ["Trips"],
        params: z.object({
          tripId: z.string().uuid(),
        }),
        body: z.object({
          destination: z.string().min(4),
          starts_at: z.coerce.date(),
          ends_at: z.coerce.date(),
        }),
        response: {
          ...defaultResponses,
          200: z
            .object({
              tripId: z.string().uuid(),
            })
            .describe("OK"),
        },
      },
    },
    async (request, reply) => {
      const { tripId } = request.params;
      const { destination, starts_at, ends_at } = request.body;

      const trip = await prisma.trip.findUnique({
        where: {
          id: tripId,
        },
      });

      if (!trip) throw new ClientError("Trip not found.");

      if (dayjs(starts_at).isBefore(new Date()))
        throw new ClientError("Invalid trip start date.");

      if (dayjs(ends_at).isBefore(starts_at))
        throw new ClientError("Invalid trip end date.");

      await prisma.trip.update({
        where: {
          id: tripId,
        },
        data: {
          destination,
          starts_at,
          ends_at,
        },
      });

      return reply.send({ tripId: trip.id });
    }
  );
}
