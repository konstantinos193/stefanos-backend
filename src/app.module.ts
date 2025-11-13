import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PropertiesModule } from './properties/properties.module';
import { BookingsModule } from './bookings/bookings.module';
import { EditionsModule } from './editions/editions.module';
import { ServicesModule } from './services/services.module';
import { KnowledgeModule } from './knowledge/knowledge.module';
import { PaymentsModule } from './payments/payments.module';
import { RoomsModule } from './rooms/rooms.module';
import { PropertyGroupsModule } from './property-groups/property-groups.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { CleaningModule } from './cleaning/cleaning.module';
import { ReviewsModule } from './reviews/reviews.module';
import { AdminModule } from './admin/admin.module';
import { AppController } from './app.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    DatabaseModule,
    AuthModule,
    UsersModule,
    PropertiesModule,
    BookingsModule,
    EditionsModule,
    ServicesModule,
    KnowledgeModule,
    PaymentsModule,
    RoomsModule,
    PropertyGroupsModule,
    AnalyticsModule,
    CleaningModule,
    ReviewsModule,
    AdminModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}

