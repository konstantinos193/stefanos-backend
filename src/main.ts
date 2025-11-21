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
    const originalUrl = process.env.DATABASE_URL;
    const normalizedUrl = getNormalizedConnectionString();
    process.env.DATABASE_URL = normalizedUrl;
    
    // Log normalized connection string (masked for security)
    const maskedOriginal = originalUrl?.replace(/:([^:@]+)@/, ':****@') || 'not set';
    const maskedNormalized = normalizedUrl.replace(/:([^:@]+)@/, ':****@');
    
    console.log('🔧 MongoDB connection string validated and normalized');
    console.log(`   Original: ${maskedOriginal.substring(0, 100)}${maskedOriginal.length > 100 ? '...' : ''}`);
    console.log(`   Normalized: ${maskedNormalized.substring(0, 100)}${maskedNormalized.length > 100 ? '...' : ''}`);
    
    if (originalUrl !== normalizedUrl) {
      console.log('   ✅ Connection string was modified (database name/parameters added)');
    }
  } catch (error: any) {
    console.error('❌ Failed to validate/normalize DATABASE_URL:', error.message);
    console.error('\n💡 Please check your .env file and ensure DATABASE_URL has the format:');
    console.error('   mongodb+srv://username:password@cluster.mongodb.net/database_name');
    console.error('   Example: mongodb+srv://user:pass@cluster.mongodb.net/real_estate_db');
    process.exit(1);
  }

  const app = await NestFactory.create(AppModule);

  // CORS - Must be configured BEFORE helmet to avoid conflicts
  const envOrigins = process.env.FRONTEND_URL 
    ? process.env.FRONTEND_URL.split(',').map(url => url.trim())
    : [];
  
  // Always include localhost:3000 and localhost:3002 for development
  const defaultOrigins = ['http://localhost:3000', 'http://localhost:3002'];
  const allowedOrigins = [...new Set([...defaultOrigins, ...envOrigins])];
  
  console.log(`🌐 CORS enabled for origins: ${allowedOrigins.join(', ')}`);
  
  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.warn(`⚠️  CORS blocked request from origin: ${origin}`);
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With'],
    exposedHeaders: ['Content-Range', 'X-Content-Range'],
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });

  // Security - Configure helmet to work with CORS
  app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    crossOriginEmbedderPolicy: false,
  }));

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

