import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS with specific origins
  app.enableCors({
    origin: [
      "http://localhost:3000",
      "http://localhost:4000",
      "http://localhost:5173",
      "http://127.0.0.1:3000",
      "http://127.0.0.1:4000",
      "http://127.0.0.1:5173",
      // Add your production domain here
      // "https://yourdomain.com",
    ],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Accept"],
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    })
  );

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle("Uplift Plan API")
    .setDescription(
      "The Uplift Plan Management System API with IELTS Writing Assessment"
    )
    .setVersion("1.0")
    .addTag("plans")
    .addTag("user-plans")
    .addTag("ielts-writing")
    .addTag("ielts-writing-submission")
    .addTag("ielts-ai")
    .addTag("users")
    .addTag("auth")
    .addBearerAuth(
      {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        name: "JWT",
        description: "Enter JWT token",
        in: "header",
      },
      "JWT-auth"
    )
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api", app, document);

  const port = 4000;
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
  console.log(`Swagger documentation: http://localhost:${port}/api`);
}
bootstrap();
