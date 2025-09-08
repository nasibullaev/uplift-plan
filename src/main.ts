import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: [
      "http://localhost:3000",
      "http://localhost:4000",
      "http://localhost:5173",
      "http://127.0.0.1:3000",
      "http://127.0.0.1:4000",
      "http://127.0.0.1:5173",
      process.env.FRONTEND_URL || "http://localhost:5173",
    ],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Accept"],
    credentials: true,
  });

  // ✅ Set global prefix
  const globalPrefix = "api2";
  app.setGlobalPrefix(globalPrefix, {
    exclude: ["/"], // optional: keep root open
  });

  const config = new DocumentBuilder()
    .setTitle("Uplift Plan API")
    .setDescription(
      "The Uplift Plan Management System API with IELTS Writing Assessment"
    )
    .setVersion("1.0")
    .addServer(`/${globalPrefix}`, "Base API path")
    .addBearerAuth(
      { type: "http", scheme: "bearer", bearerFormat: "JWT" },
      "JWT-auth"
    )
    .build();

  let document = SwaggerModule.createDocument(app, config, {
    deepScanRoutes: true,
  });

  // 👇 Manually prefix all paths in Swagger with /api2
  document.paths = Object.fromEntries(
    Object.entries(document.paths).map(([path, pathObj]) => [
      `/${globalPrefix}${path}`,
      pathObj,
    ])
  );

  SwaggerModule.setup(`${globalPrefix}/docs`, app, document, {
    swaggerOptions: { persistAuthorization: true },
  });

  await app.listen(4000);
}
bootstrap();
