import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { ClientError } from "../errors/client-error";
import { defaultResponses } from "../models/default-responses";

export async function updateActivity(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().put(
    "/trips/:tripId/activity/:activityId",
    {
      schema: {
        summary: "Update acitivity",
        description: "When need update activity",
        tags: ["Activities"],
        params: z.object({
          tripId: z.string().uuid(),
          activityId: z.string().uuid(),
        }),
        body: z.object({
          title: z.string().min(4),
          occurs_at: z.coerce.date(),
        }),
        response: {
          ...defaultResponses,
          200: z
            .object({
              activityId: z.string().uuid(),
            })
            .describe("OK"),
        },
      },
    },
    async (request, reply) => {
      const { tripId, activityId } = request.params;
      const { title, occurs_at } = request.body;

      const trip = await prisma.trip.findUnique({
        where: {
          id: tripId,
        },
        include: {
          activities: true,
        },
      });

      if (!trip) throw new ClientError("Trip not found.");

      if (!trip.activities.some((activity) => activity.id === activityId))
        throw new ClientError("Activity not found.");

      await prisma.activity.update({
        where: {
          id: activityId,
        },
        data: {
          title,
          occurs_at,
        },
      });

      return reply.send({ activityId: activityId });
    }
  );
}
