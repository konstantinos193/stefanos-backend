import { Module } from '@nestjs/common';
import { PropertyGroupsService } from './property-groups.service';
import { PropertyGroupsController } from './property-groups.controller';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [PropertyGroupsController],
  providers: [PropertyGroupsService],
  exports: [PropertyGroupsService],
})
export class PropertyGroupsModule {}

