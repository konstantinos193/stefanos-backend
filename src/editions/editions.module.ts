import { Module } from '@nestjs/common';
import { EditionsService } from './editions.service';
import { EditionsController } from './editions.controller';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [EditionsController],
  providers: [EditionsService],
  exports: [EditionsService],
})
export class EditionsModule {}

