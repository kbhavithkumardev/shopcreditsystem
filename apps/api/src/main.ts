import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('CreditShopAPI');
  const app = await NestFactory.create(AppModule);

  // Enable CORS
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // Global Validation Pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Global API Prefix
  app.setGlobalPrefix('api');

  // OpenAPI / Swagger Documentation
  const config = new DocumentBuilder()
    .setTitle('CreditShop Management & Business Intelligence API')
    .setDescription(
      'Authoritative financial ledger, village-first credit tracking, and customer portal APIs.',
    )
    .setVersion('1.0.0')
    .addBearerAuth()
    .addTag('Authentication')
    .addTag('Villages')
    .addTag('Customers')
    .addTag('Products')
    .addTag('Orders')
    .addTag('Payments')
    .addTag('Financial Ledger')
    .addTag('Collection Cycles & Village Sheets')
    .addTag('Customer Self-Service Portal')
    .addTag('Owner Dashboard')
    .addTag('AI & Intelligence Tools')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 4000;
  await app.listen(port);
  logger.log(`🚀 CreditShop Backend API is running on http://localhost:${port}/api`);
  logger.log(`📚 OpenAPI / Swagger documentation live at http://localhost:${port}/api/docs`);
}

bootstrap();
