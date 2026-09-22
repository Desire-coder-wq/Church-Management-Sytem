import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import helmet from "helmet";

import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Security headers
  app.use(helmet());

  // API prefix
  app.setGlobalPrefix("api");

  // Allow the deployed Cloudflare site, the configured site, and local Vite development.
  const allowedOrigins = Array.from(new Set([
    "https://church-management-sytem.pages.dev",
    "http://localhost:5173",
    process.env.FRONTEND_URL?.trim().replace(/\/+$/, ""),
  ].filter((origin): origin is string => Boolean(origin))));
  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
  });

  // Global validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Swagger configuration
  const swaggerConfig = new DocumentBuilder()
    .setTitle("Church Pledge Management API")
    .setDescription(
      "REST API documentation for the Church Pledge Management System",
    )
    .setVersion("1.0")
    .addBearerAuth(
      {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        name: "Authorization",
        in: "header",
      },
      "access-token",
    )
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);

  SwaggerModule.setup("api/docs", app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  const port = Number(process.env.PORT) || 3000;

  await app.listen(port);

  console.log(`API running on http://localhost:${port}/api`);
  console.log(`Swagger docs: http://localhost:${port}/api/docs`);
}

bootstrap();
