import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { ClientError } from "../errors/client-error";
import { env } from "../env";
import { defaultResponses } from "../models/default-responses";

export async function confirmParticipant(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().get(
    "/participants/:participantId/confirm",
    {
      schema: {
        summary: "Participant confirm trip",
        description: "When participant confirm trip",
        tags: ["Participants"],
        params: z.object({
          participantId: z.string().uuid(),
        }),
        response: {
          ...defaultResponses,
        },
      },
    },
    async (request, reply) => {
      const { participantId } = request.params;

      const participant = await prisma.participant.findUnique({
        where: {
          id: participantId,
        },
      });

      if (!participant) throw new ClientError("Participant not found.");

      if (participant.is_confirmed)
        return reply.redirect(
          `${env.WEB_BASE_URL}/trips/${participant.trip_id}`
        );

      await prisma.participant.update({
        where: {
          id: participantId,
        },
        data: {
          is_confirmed: true,
        },
      });

      return reply.redirect(`${env.WEB_BASE_URL}/trips/${participant.trip_id}`);
    }
  );
}
