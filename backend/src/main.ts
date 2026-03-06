// src/main.ts
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Configuramos validaciones de DTO globales
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
    forbidNonWhitelisted: true,
  }));

  // Configuramos CORS (Vital para entorno web externo Next.js en el mismo dispositivo o distinto localhost port)
  app.enableCors({
    origin: true, // Automáticamente permite el origen de la petición (soluciona problemas de Vercel/Render)
    credentials: true,
  });

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`Backend de CocoRapado corriendo en el puerto ${port}`);
}

bootstrap();
