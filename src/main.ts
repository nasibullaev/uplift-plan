import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import { AppModule } from "./app.module";
import { NestExpressApplication } from "@nestjs/platform-express";
import { join } from "path";

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Serve static files
  app.useStaticAssets(join(__dirname, "..", "uploads"), {
    prefix: "/uploads/",
  });

  app.enableCors({
    origin: [
      "http://localhost:3000",
      "http://localhost:4000",
      "http://localhost:5173",
      "http://localhost:5774",
      "http://127.0.0.1:3000",
      "http://127.0.0.1:4000",
      "http://127.0.0.1:5173",
      "https://428aae5155d5.ngrok-free.app",
      "https://uplift-front-admin.vercel.app",
      "https://improvely.ai",
      process.env.FRONTEND_URL || "http://localhost:5173",
      "https://dead.uz",
    ],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Accept"],
    credentials: true,
  });

  // ✅ DON'T use global prefix - let nginx handle the routing
  // This way your routes are /auth/register, /docs etc.
  // Nginx adds /api2 prefix externally

  const config = new DocumentBuilder()
    .setTitle("Uplift Plan API")
    .setDescription(
      "The Uplift Plan Management System API with IELTS Writing Assessment"
    )
    .setVersion("1.0")
    .addBearerAuth(
      { type: "http", scheme: "bearer", bearerFormat: "JWT" },
      "JWT-auth"
    )
    .build();

  const document = SwaggerModule.createDocument(app, config, {
    deepScanRoutes: true,
  });
  // ✅ Manually set the servers array to tell Swagger the correct base URL
  document.servers = [
    {
      url: "/api2",
      description: "API base path",
    },
    {
      url: "/",
      description: "API dev path",
    },
  ];

  // ✅ Setup Swagger at /docs
  SwaggerModule.setup("docs", app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  console.log(`🚀 Server running on http://localhost:4000`);

  await app.listen(4000);
}
bootstrap();
