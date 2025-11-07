import { Module } from '@nestjs/common';
import { EditionsService } from './editions.service';
import { EditionsController } from './editions.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [EditionsController],
  providers: [EditionsService],
  exports: [EditionsService],
})
export class EditionsModule {}

