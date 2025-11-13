import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MongoClient, Db, Collection, ObjectId } from 'mongodb';
import { getNormalizedConnectionString } from '../lib/mongodb-connection';

@Injectable()
export class MongoDBService implements OnModuleInit, OnModuleDestroy {
  private client: MongoClient;
  private db: Db;
  private readonly logger = new Logger(MongoDBService.name);
  private isConnected = false;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    await this.connect();
  }

  async onModuleDestroy() {
    await this.disconnect();
  }

  private async connect() {
    try {
      const connectionString = getNormalizedConnectionString();
      this.client = new MongoClient(connectionString, {
        serverSelectionTimeoutMS: 30000,
        connectTimeoutMS: 30000,
        socketTimeoutMS: 30000,
        maxPoolSize: 10,
      });

      await this.client.connect();
      const dbName = this.extractDatabaseName(connectionString);
      this.db = this.client.db(dbName);
      this.isConnected = true;
      this.logger.log('Successfully connected to MongoDB');
      
      await this.db.admin().ping();
      this.logger.log('Database ping successful');
    } catch (error: any) {
      this.logger.error('Failed to connect to MongoDB:', error.message);
      this.logger.error('Please check:');
      this.logger.error('1. DATABASE_URL in .env file');
      this.logger.error('2. MongoDB Atlas IP whitelist (add 0.0.0.0/0 for testing or your IP)');
      this.logger.error('3. Network connectivity and firewall settings');
      this.logger.error('4. MongoDB Atlas cluster is running and accessible (not paused)');
      throw error;
    }
  }

  private async disconnect() {
    if (this.client) {
      await this.client.close();
      this.isConnected = false;
      this.logger.log('Disconnected from MongoDB');
    }
  }

  private extractDatabaseName(connectionString: string): string {
    try {
      const url = new URL(connectionString);
      const pathname = url.pathname;
      const dbName = pathname.split('/')[1]?.split('?')[0];
      return dbName || 'real_estate_db';
    } catch {
      return 'real_estate_db';
    }
  }

  getDatabase(): Db {
    if (!this.isConnected || !this.db) {
      throw new Error('Database not connected. Call connect() first.');
    }
    return this.db;
  }

  getCollection<T = any>(collectionName: string): Collection<T> {
    return this.getDatabase().collection<T>(collectionName);
  }

  toObjectId(id: string | ObjectId): ObjectId {
    if (id instanceof ObjectId) {
      return id;
    }
    if (!ObjectId.isValid(id)) {
      throw new Error(`Invalid ObjectId: ${id}`);
    }
    return new ObjectId(id);
  }

  fromObjectId(id: ObjectId | string): string {
    if (id instanceof ObjectId) {
      return id.toString();
    }
    return id;
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.db.admin().ping();
      return true;
    } catch {
      return false;
    }
  }
}

