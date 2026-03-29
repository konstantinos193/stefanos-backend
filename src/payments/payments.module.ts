import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { DatabaseModule } from '../database/database.module';
import { BookingsModule } from '../bookings/bookings.module';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [DatabaseModule, BookingsModule, EmailModule],
  controllers: [PaymentsController],
  providers: [PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}

