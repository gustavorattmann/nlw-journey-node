import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import nodemailer from "nodemailer";
import { prisma } from "../lib/prisma";
import { ClientError } from "../errors/client-error";
import { dayjs } from "../lib/dayjs";
import { fromOptions, transportOptions } from "../lib/mail";
import { defaultResponses } from "../models/default-responses";

export async function cancelTrip(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().delete(
    "/trips/:tripId/cancel",
    {
      schema: {
        summary: "Cancel trip",
        description: "When owner need cancel trip",
        tags: ["Trips"],
        params: z.object({
          tripId: z.string().uuid(),
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
      const { tripId } = request.params;

      const trip = await prisma.trip.findUnique({
        where: {
          id: tripId,
        },
        include: {
          participants: true,
        },
      });

      if (!trip) throw new ClientError("Trip not found.");

      await prisma.trip.delete({
        where: {
          id: trip.id,
        },
      });

      const formattedStartDate = dayjs(trip.starts_at).format("LL");
      const formattedEndDate = dayjs(trip.ends_at).format("LL");

      const transporter = nodemailer.createTransport(transportOptions);

      await Promise.all(
        trip.participants.map(async (participant) => {
          const mailOptions = {
            from: fromOptions,
            to: participant.email,
            subject: `Houve um cancelamento na sua viagem para ${trip.destination} em ${formattedStartDate}`,
            html: `
              <div style="font-family: sans-serif; font-size: 16px; line-height: 1.6">
                <p>
                  Lamentamos informar que seu convite referente a viagem para
                  <strong>${trip.destination}</strong> nas datas de
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
          };

          transporter.sendMail(mailOptions);
        })
      );

      return reply.send({ message: "Trip canceled." });
    }
  );
}
