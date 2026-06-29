import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  app.enableCors({ origin: true, credentials: true });
  app.enableShutdownHooks(); // lets PrismaService.$disconnect run on SIGTERM/SIGINT

  const port = process.env.PORT ? Number(process.env.PORT) : 3001;
  await app.listen(port);

  Logger.log(`hat-trick/api listening on http://localhost:${port}`, 'Bootstrap');
}

void bootstrap();
