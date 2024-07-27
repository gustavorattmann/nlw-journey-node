import fastify from "fastify";
import cors from "@fastify/cors";
import fastifySwagger from "@fastify/swagger";
import fastifySwaggerUi from "@fastify/swagger-ui";
import fastifyApiReference from "@scalar/fastify-api-reference";
import {
  jsonSchemaTransform,
  serializerCompiler,
  validatorCompiler,
} from "fastify-type-provider-zod";
import { env } from "./env";
import { errorHandler } from "./error-handler";
import { createTrip } from "./routes/create-trip";
import { confirmTrip } from "./routes/confirm-trip";
import { cancelTrip } from "./routes/cancel-trip";
import { cancelParticipant } from "./routes/cancel-participant";
import { confirmParticipant } from "./routes/confirm-participant";
import { createActivity } from "./routes/create-activity";
import { createInvite } from "./routes/create-invite";
import { createLink } from "./routes/create-link";
import { getActivities } from "./routes/get-activities";
import { getLinks } from "./routes/get-links";
import { getParticipant } from "./routes/get-participant";
import { getParticipants } from "./routes/get-participants";
import { getTripDetails } from "./routes/get-trip-details";
import { rejectParticipant } from "./routes/reject-participant";
import { updateActivity } from "./routes/update-activity";
import { updateLink } from "./routes/update-link";
import { updateTrip } from "./routes/update-trip";

const serverOpenApi = () => {
  let url = env.API_BASE_URL;

  if (env.PLATFORM == "render") url = env.RENDER_EXTERNAL_URL || url;

  return {
    url,
    description:
      env.NODE_ENV === "prod" ? "Production server" : "Development server",
  };
};

const app = fastify({ logger: env.DEBUG || false });

app.register(cors, {
  origin: env.WEB_BASE_URL,
});

app.register(fastifySwagger, {
  openapi: {
    openapi: "3.1.0",
    info: {
      title: "plann.er",
      description:
        "Especificações da API para o back-end da aplicação plann.er construída durante o NLW Journey da Rocketseat.",
      version: "1.0.0",
    },
    servers: [serverOpenApi()],
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

app.get("/openapi.json", () => {
  return app.swagger();
});

app.register(fastifyApiReference, {
  routePrefix: "/reference",
  configuration: {
    title: "Teste",
    spec: {
      url: "/openapi.json",
    },
    showSidebar: true,
    hideDownloadButton: true,
    theme: "default",
    metaData: {
      title: "plann.er",
      description:
        "Especificações da API para o back-end da aplicação plann.er construída durante o NLW Journey da Rocketseat.",
      ogDescription:
        "Especificações da API para o back-end da aplicação plann.er construída durante o NLW Journey da Rocketseat.",
      ogTitle: "plann.er",
      ogImage: "https://example.com/image.png",
      twitterCard: "summary_large_image",
    },
  },
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

app.ready();

app
  .listen({
    port: env.PORT,
    host: env.NODE_ENV == "prod" ? "0.0.0.0" : "localhost",
  })
  .then((address) => {
    console.log(`Server running on address: ${address}`);
  })
  .catch((err) => {
    app.log.error(err);
    process.exit(1);
  });
