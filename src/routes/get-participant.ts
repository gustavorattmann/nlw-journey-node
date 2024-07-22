import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { ClientError } from "../errors/client-error";
import { defaultResponses } from "../models/default-responses";

export async function getParticipant(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().get(
    "/participants/:participantId",
    {
      schema: {
        summary: "Get participant",
        description: "Get specific participant",
        tags: ["Participants"],
        params: z.object({
          participantId: z.string().uuid(),
        }),
        response: {
          ...defaultResponses,
          200: z
            .object({
              participant: z.object({
                id: z.string().uuid(),
                name: z.string().nullable(),
                email: z.string().email(),
                is_confirmed: z.boolean(),
              }),
            })
            .describe("OK"),
        },
      },
    },
    async (request, reply) => {
      const { participantId } = request.params;

      const participant = await prisma.participant.findUnique({
        select: {
          id: true,
          name: true,
          email: true,
          is_confirmed: true,
        },
        where: {
          id: participantId,
        },
      });

      if (!participant) throw new ClientError("Participant not found.");

      return reply.send({ participant });
    }
  );
}
