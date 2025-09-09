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
      "https://dead.uz",
    ],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Accept"],
    credentials: true,
  });

  // ✅ DON'T use global prefix - let nginx handle the routing
  // const globalPrefix = "api2";
  // app.setGlobalPrefix(globalPrefix, {
  //   exclude: ["/"],
  // });

  const config = new DocumentBuilder()
    .setTitle("Uplift Plan API")
    .setDescription(
      "The Uplift Plan Management System API with IELTS Writing Assessment"
    )
    .setVersion("1.0")
    .addServer("https://dead.uz/api2", "Production server")
    .addServer("http://localhost:4000", "Development server")
    .addBearerAuth(
      { type: "http", scheme: "bearer", bearerFormat: "JWT" },
      "JWT-auth"
    )
    .build();

  const document = SwaggerModule.createDocument(app, config, {
    deepScanRoutes: true,
  });

  // ✅ Setup Swagger at /docs (nginx will add /api2 prefix)
  SwaggerModule.setup("docs", app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  console.log(`🚀 Server running on http://localhost:4000`);
  console.log(`📚 Local Swagger docs: http://localhost:4000/docs`);
  console.log(`📚 Production Swagger: https://dead.uz/api2/docs`);

  await app.listen(4000);
}
bootstrap();
