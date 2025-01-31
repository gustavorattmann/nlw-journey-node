import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { ClientError } from "../errors/client-error";
import { env } from "../env";
import { defaultResponses } from "../models/default-responses";

export async function ParticipantRejects(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().delete(
    "/participants/:participantId/rejects",
    {
      schema: {
        summary: "Participant rejects",
        description: "When participant rejects trip",
        tags: ["Participants"],
        params: z.object({
          participantId: z.string().uuid(),
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
      const { participantId } = request.params;

      const participant = await prisma.participant.findUnique({
        where: {
          id: participantId,
        },
        include: {
          trip: true,
        },
      });

      if (!participant) throw new ClientError("Participant not found.");
      if (participant.is_owner)
        return reply.redirect(
          `${env.WEB_BASE_URL}/trips/${participant.trip_id}`
        );

      await prisma.participant.delete({
        where: {
          id: participant.id,
        },
      });

      return reply.send({ message: "Invite rejected." });
    }
  );
}
