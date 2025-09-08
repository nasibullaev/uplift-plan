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
  app.setGlobalPrefix(globalPrefix);

  const config = new DocumentBuilder()
    .setTitle("Uplift Plan API")
    .setDescription(
      "The Uplift Plan Management System API with IELTS Writing Assessment"
    )
    .setVersion("1.0")
    .addServer(`https://dead.uz/${globalPrefix}`) // 👈 full URL for deployed API
    .addBearerAuth(
      { type: "http", scheme: "bearer", bearerFormat: "JWT" },
      "JWT-auth"
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);

  // 👇 mount Swagger UI at a DIFFERENT path
  SwaggerModule.setup(`${globalPrefix}/docs`, app, document, {
    swaggerOptions: { persistAuthorization: true },
  });

  await app.listen(4000);
}
bootstrap();
