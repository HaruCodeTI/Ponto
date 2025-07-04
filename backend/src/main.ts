import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import helmet from 'helmet';
import * as compression from 'compression';
import * as morgan from 'morgan';
import rateLimit from 'express-rate-limit';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Segurança HTTP
  app.use(helmet());

  // Compressão gzip
  app.use(compression());

  // Logging de requisições
  app.use(morgan('dev'));

  // Rate limiting básico
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutos
      max: 100, // Limite por IP
      standardHeaders: true,
      legacyHeaders: false,
    })
  );

  // Configuração global de validação
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  // CORS robusto
  app.enableCors({
    origin: [process.env.FRONTEND_URL || 'http://localhost:3000'],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  // Prefixo global da API
  app.setGlobalPrefix('api');

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`🚀 Backend rodando na porta ${port}`);
}
bootstrap();
