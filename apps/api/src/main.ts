import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() {
  const isProduction = process.env['NODE_ENV'] === 'production';

  // Nest já loga cada rota mapeada no boot (RouterExplorer) — em vez de
  // reimplementar isso lendo o router interno do Express na mão (como o
  // legado fazia em `logRoutes(app)`), só ligamos/desligamos esse nível de
  // log por NODE_ENV, que é o requisito real (debug tool, não em prod).
  const app = await NestFactory.create(AppModule, {
    logger: isProduction
      ? ['error', 'warn']
      : ['log', 'error', 'warn', 'debug', 'verbose'],
  });
  const configService = app.get(ConfigService);

  app.setGlobalPrefix('api');

  // Sem `class-validator`/ValidationPipe no legado — nenhum payload de
  // entrada era validado (ver AS-IS-api.md, seção 1.5). Aqui é global e
  // rejeita campos fora do DTO desde o primeiro commit.
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));

  // CORS restrito às origens conhecidas — nunca `origin: "*"` (ver
  // AS-IS-api.md, seção 0/3).
  const allowedOrigins = configService
    .getOrThrow<string>('ALLOWED_ORIGINS')
    .split(',')
    .map((origin) => origin.trim());
  app.enableCors({ origin: allowedOrigins, credentials: true });

  const port = configService.get<number>('PORT') ?? 3000;
  await app.listen(port);
}

void bootstrap();
