import { Module } from '@nestjs/common';
import { CleaningService } from './cleaning.service';
import { CleaningController } from './cleaning.controller';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [CleaningController],
  providers: [CleaningService],
  exports: [CleaningService],
})
export class CleaningModule {}

