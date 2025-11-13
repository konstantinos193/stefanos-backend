import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import morgan from 'morgan';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { getNormalizedConnectionString } from './lib/mongodb-connection';

async function bootstrap() {
  // Normalize MongoDB connection string before app initialization
  // This ensures proper SSL/TLS configuration and validates database name
  try {
    const normalizedUrl = getNormalizedConnectionString();
    process.env.DATABASE_URL = normalizedUrl;
    console.log('🔧 MongoDB connection string validated and normalized');
  } catch (error: any) {
    console.error('❌ Failed to validate/normalize DATABASE_URL:', error.message);
    console.error('\n💡 Please check your .env file and ensure DATABASE_URL has the format:');
    console.error('   mongodb+srv://username:password@cluster.mongodb.net/database_name');
    console.error('   Example: mongodb+srv://user:pass@cluster.mongodb.net/real_estate_db');
    process.exit(1);
  }

  const app = await NestFactory.create(AppModule);

  // Security
  app.use(helmet());

  // CORS
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  });

  // Logging
  app.use(morgan('combined'));

  // Global prefix
  app.setGlobalPrefix('api');

  // Global exception filter
  app.useGlobalFilters(new AllExceptionsFilter());

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('Real Estate Platform API')
    .setDescription('Backend API for Real Estate Platform')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3001;
  await app.listen(port);

  console.log(`🚀 Backend server running on port ${port}`);
  console.log(`📊 Health check: http://localhost:${port}/api/health`);
  console.log(`📚 Swagger docs: http://localhost:${port}/api/docs`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
}

bootstrap();

