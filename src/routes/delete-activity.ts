import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { ClientError } from "../errors/client-error";
import { defaultResponses } from "../models/default-responses";

export async function deleteActivity(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().delete(
    "/trips/:tripId/activity/:activityId",
    {
      schema: {
        summary: "Delete activity",
        description: "When owner need delete activity",
        tags: ["Activities"],
        params: z.object({
          tripId: z.string().uuid(),
          activityId: z.string().uuid(),
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
      const { tripId, activityId } = request.params;

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

      await prisma.activity.delete({
        where: {
          id: activityId,
        },
      });

      return reply.send({ message: "Activity deleted." });
    }
  );
}
