import { Module } from '@nestjs/common';
import { ExternalBookingsService } from './external-bookings.service';
import { ExternalBookingsController } from './external-bookings.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ExternalBookingsController],
  providers: [ExternalBookingsService],
  exports: [ExternalBookingsService],
})
export class ExternalBookingsModule {}
