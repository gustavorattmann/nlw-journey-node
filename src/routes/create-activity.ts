import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { dayjs } from "../lib/dayjs";
import { ClientError } from "../errors/client-error";
import { defaultResponses } from "../models/default-responses";

export async function createActivity(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().post(
    "/trips/:tripId/activities",
    {
      schema: {
        summary: "Create activity",
        description: "To save a new activity",
        tags: ["Activities"],
        params: z.object({
          tripId: z.string().uuid(),
        }),
        body: z.object({
          title: z.string().min(4),
          occurs_at: z.coerce.date(),
        }),
        response: {
          ...defaultResponses,
          201: z
            .object({
              activityId: z.string().uuid(),
            })
            .describe("Created"),
        },
      },
    },
    async (request, reply) => {
      const { tripId } = request.params;
      const { title, occurs_at } = request.body;

      const trip = await prisma.trip.findUnique({
        where: {
          id: tripId,
        },
      });

      if (!trip) throw new ClientError("Trip not found.");
      if (dayjs(occurs_at).isBefore(trip.starts_at))
        throw new ClientError("Invalid activity date.");
      if (dayjs(occurs_at).isAfter(trip.ends_at))
        throw new ClientError("Invalid activity date.");

      const activity = await prisma.activity.create({
        data: {
          title,
          occurs_at,
          trip_id: tripId,
        },
      });

      return reply.status(201).send({ activityId: activity.id });
    }
  );
}
