import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  app.enableCors({ origin: true, credentials: true });
  app.enableShutdownHooks(); // lets PrismaService.$disconnect run on SIGTERM/SIGINT
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('hat-trick API')
    .setDescription(
      'TxLINE-powered live data + fantasy/betting backend. See docs/txline-provider.md.',
    )
    .setVersion('0.1.0')
    .addTag('Users', 'Profile & balance CRUD')
    .addTag('TxLINE snapshots')
    .build();
  SwaggerModule.setup(
    'docs',
    app,
    SwaggerModule.createDocument(app, swaggerConfig),
  );

  const port = process.env.PORT ? Number(process.env.PORT) : 3001;
  await app.listen(port);

  Logger.log(
    `hat-trick/api on http://localhost:${port} · Swagger at /docs`,
    'Bootstrap',
  );
}

void bootstrap();
