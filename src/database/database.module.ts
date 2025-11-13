import { Global, Module } from '@nestjs/common';
import { MongoDBService } from './mongodb.service';

@Global()
@Module({
  providers: [MongoDBService],
  exports: [MongoDBService],
})
export class DatabaseModule {}

