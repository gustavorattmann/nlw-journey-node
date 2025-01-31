import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import nodemailer from "nodemailer";
import { prisma } from "../lib/prisma";
import { dayjs } from "../lib/dayjs";
import { ClientError } from "../errors/client-error";
import { env } from "../env";
import { defaultResponses } from "../models/default-responses";
import { fromOptions, transportOptions } from "../lib/mail";

export async function confirmTrip(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().get(
    "/trips/:tripId/confirm",
    {
      schema: {
        summary: "Confirm trip",
        description: "Confirm trip by email link",
        tags: ["Trips"],
        params: z.object({
          tripId: z.string().uuid(),
        }),
        response: {
          ...defaultResponses,
        },
      },
    },
    async (request, reply) => {
      const { tripId } = request.params;

      const trip = await prisma.trip.findUnique({
        where: {
          id: tripId,
        },
        include: {
          participants: {
            where: {
              is_owner: false,
            },
          },
        },
      });

      if (!trip) throw new ClientError("Trip not found.");
      if (trip.is_confirmed)
        return reply.redirect(`${env.WEB_BASE_URL}/trips/${tripId}`);

      await prisma.trip.update({
        where: {
          id: tripId,
        },
        data: {
          is_confirmed: true,
        },
      });

      const formattedStartDate = dayjs(trip.starts_at).format("LL");
      const formattedEndDate = dayjs(trip.ends_at).format("LL");

      const transporter = nodemailer.createTransport(transportOptions);

      await Promise.all(
        trip.participants.map(async (participant) => {
          const confirmationLink = `${
            env?.RENDER_EXTERNAL_URL || env.API_BASE_URL
          }/participants/${participant.id}/confirm`;

          const mailOptions = {
            from: fromOptions,
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
          };

          transporter.sendMail(mailOptions);
        })
      );

      return reply.redirect(`${env.WEB_BASE_URL}/trips/${tripId}`);
    }
  );
}
