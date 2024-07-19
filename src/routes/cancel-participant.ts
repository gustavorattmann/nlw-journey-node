import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import nodemailer from "nodemailer";
import { prisma } from "../lib/prisma";
import { ClientError } from "../errors/client-error";
import { dayjs } from "../lib/dayjs";
import { getMailClient } from "../lib/mail";
import { env } from "../env";

export async function cancelParticipant(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().delete(
    "/participants/:participantId/cancel",
    {
      schema: {
        summary: "Cancel participant of trip",
        description: "When owner need cancel participant of trip",
        tags: ["Participants"],
        params: z.object({
          participantId: z.string().uuid(),
        }),
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

      const formattedStartDate = dayjs(participant.trip.starts_at).format("LL");
      const formattedEndDate = dayjs(participant.trip.ends_at).format("LL");

      const mail = await getMailClient();

      const message = await mail.sendMail({
        from: {
          name: "Equipe plann.er",
          address: "oi@plann.er",
        },
        to: participant.email,
        subject: `Houve um cancelamento na sua viagem para ${participant.trip.destination} em ${formattedStartDate}`,
        html: `
            <div style="font-family: sans-serif; font-size: 16px; line-height: 1.6">
                <p>
                    Lamentamos informar que seu convite referente a viagem para
                    <strong>${participant.trip.destination}</strong> nas datas de
                    <strong>${formattedStartDate}</strong> até
                    <strong>${formattedEndDate}</strong> foi cancelado.
                </p>
                <p>
                    Pedimos a gentileza de entrar em contato com o responsável pela viagem para
                    obter maiores informações.
                </p>
                <p>Agradecemos a compreensão!</p>
            </div>
            `.trim(),
      });

      console.log(nodemailer.getTestMessageUrl(message));

      return reply.send({ message: "Invite canceled." });
    }
  );
}
