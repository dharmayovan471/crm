import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { GlobalExceptionFilter } from './modules/common/exceptions/global-exception.filter';
import helmet from 'helmet';
import * as express from 'express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Serve static profile photos
  app.use('/uploads', express.static(join(process.cwd(), 'uploads')));

  // Apply Security Headers using Helmet
  app.use(helmet());

  // Enable CORS
  app.enableCors({
    origin: '*', // For production, limit this to allowed domains
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // Apply Global Exception Handler Filter
  app.useGlobalFilters(new GlobalExceptionFilter());

  // Configure Swagger Documentation
  const config = new DocumentBuilder()
    .setTitle('Tenant Service API')
    .setDescription('Production-ready Tenant Service for Multi-Tenant Manufacturing ERP')
    .setVersion('1.0')
    .addTag('Tenant Management')
    .addBearerAuth()
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`\n=============================================================`);
  console.log(`🚀 Tenant Service is running on: http://localhost:${port}`);
  console.log(`📖 Swagger API documentation is available at: http://localhost:${port}/api`);
  console.log(`=============================================================\n`);
}
bootstrap();
