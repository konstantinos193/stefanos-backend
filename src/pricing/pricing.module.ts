import { Module } from '@nestjs/common';
import { PricingController } from './pricing.controller';
import { BookingsModule } from '../bookings/bookings.module';

@Module({
  imports: [BookingsModule],
  controllers: [PricingController],
})
export class PricingModule {}
