import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PropertiesModule } from './properties/properties.module';
import { BookingsModule } from './bookings/bookings.module';
import { EditionsModule } from './editions/editions.module';
import { ServicesModule } from './services/services.module';
import { KnowledgeModule } from './knowledge/knowledge.module';
import { AppController } from './app.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    PropertiesModule,
    BookingsModule,
    EditionsModule,
    ServicesModule,
    KnowledgeModule,
  ],
  controllers: [AppController],
})
export class AppModule {}

