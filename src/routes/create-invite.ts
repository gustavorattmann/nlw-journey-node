import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import nodemailer from "nodemailer";
import { prisma } from "../lib/prisma";
import { dayjs } from "../lib/dayjs";
import { getMailClient } from "../lib/mail";
import { ClientError } from "../errors/client-error";
import { env } from "../env";
import { defaultResponses } from "../models/default-responses";

export async function createInvite(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().post(
    "/trips/:tripId/invites",
    {
      schema: {
        summary: "Create invite",
        description: "To invite a new participant",
        tags: ["Trips"],
        params: z.object({
          tripId: z.string().uuid(),
        }),
        body: z.object({
          email: z.string().email(),
        }),
        response: {
          ...defaultResponses,
          201: z
            .object({
              participantId: z.string().uuid(),
            })
            .describe("Created"),
        },
      },
    },
    async (request, reply) => {
      const { tripId } = request.params;
      const { email } = request.body;

      const trip = await prisma.trip.findUnique({
        where: {
          id: tripId,
        },
      });

      if (!trip) throw new ClientError("Trip not found.");

      const participant = await prisma.participant.create({
        data: {
          email,
          trip_id: tripId,
        },
      });

      const formattedStartDate = dayjs(trip.starts_at).format("LL");
      const formattedEndDate = dayjs(trip.ends_at).format("LL");

      const mail = await getMailClient();

      const confirmationLink = `${env.API_BASE_URL}/participants/${participant.id}/confirm`;

      const message = await mail.sendMail({
        from: {
          name: "Equipe plann.er",
          address: "oi@plann.er",
        },
        to: participant.email,
        subject: `Confirme sua presença na viagem para ${trip.destination} em ${formattedStartDate}`,
        html: `
            <div style="font-family: sans-serif; font-size: 16px; line-height: 1.6;">
              <p>
                Você foi convidado(a) para participar de uma viagem para
                <strong>${trip.destination}</strong> nas datas de
                <strong>${formattedStartDate}</strong> até
                <strong>${formattedEndDate}</strong>.
              </p>
              <p></p>
              <p>Para confirmar sua presença na viagem, clique no link abaixo:</p>
              <p></p>
              <a href="${confirmationLink}">Confirmar viagem</a>
              <p></p>
              <p>
                Caso você não saiba do que se trata esse e-mail ou não poderá estar
                presente, apenas
                <span style="text-decoration: underline">ignore esse e-mail</span>.
              </p>
            </div>
            `.trim(),
      });

      console.log(nodemailer.getTestMessageUrl(message));

      return reply.status(201).send({ participantId: participant.id });
    }
  );
}
