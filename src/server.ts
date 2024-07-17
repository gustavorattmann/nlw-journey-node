import fastify from "fastify";
import cors from "@fastify/cors";
import fastifySwagger from "@fastify/swagger";
import fastifySwaggerUi from "@fastify/swagger-ui";
import { env } from "./env";
import {
  jsonSchemaTransform,
  serializerCompiler,
  validatorCompiler,
} from "fastify-type-provider-zod";
import { errorHandler } from "./error-handler";
import { createTrip } from "./routes/create-trip";
import { createActivity } from "./routes/create-activity";
import { createLink } from "./routes/create-link";
import { confirmTrip } from "./routes/confirm-trip";
import { confirmParticipant } from "./routes/confirm-participant";
import { getActivities } from "./routes/get-activities";
import { getLinks } from "./routes/get-links";
import { getParticipants } from "./routes/get-participants";
import { createInvite } from "./routes/create-invite";
import { updateTrip } from "./routes/update-trip";
import { getTripDetails } from "./routes/get-trip-details";
import { getParticipant } from "./routes/get-participant";
import { cancelParticipant } from "./routes/cancel-participant";
import { updateLink } from "./routes/update-link";
import { updateActivity } from "./routes/update-activity";
import { rejectParticipant } from "./routes/reject-participant";
import { cancelTrip } from "./routes/cancel-trip";

const app = fastify();

app.register(cors, {
  origin: "*",
});

app.register(fastifySwagger, {
  swagger: {
    consumes: ["application/json"],
    produces: ["application/json"],
    info: {
      title: "plann.er",
      description:
        "Especificações da API para o back-end da aplicação plann.er construída durante o NLW Journey da Rocketseat.",
      version: "1.0.0",
    },
    tags: [
      {
        name: "Activities",
        description: "End-points relacionados as atividades.",
      },
      {
        name: "Links",
        description: "End-points relacionados aos links.",
      },
      {
        name: "Participants",
        description: "End-points relacionados aos participantes.",
      },
      { name: "Trips", description: "End-points relacionados as viagens." },
    ],
  },
  transform: jsonSchemaTransform,
});

app.register(fastifySwaggerUi, {
  routePrefix: "/docs",
});

app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);

app.setErrorHandler(errorHandler);

app.register(createTrip);
app.register(confirmTrip);
app.register(cancelTrip);
app.register(confirmParticipant);
app.register(createActivity);
app.register(getActivities);
app.register(updateActivity);
app.register(createLink);
app.register(updateLink);
app.register(getLinks);
app.register(createInvite);
app.register(getParticipants);
app.register(getParticipant);
app.register(cancelParticipant);
app.register(rejectParticipant);
app.register(updateTrip);
app.register(getTripDetails);

app.listen({ port: env.PORT }).then(() => {
  console.log("Server running");
});
