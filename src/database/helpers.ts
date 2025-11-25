import { Collection, ObjectId, Filter, UpdateFilter, WithId } from 'mongodb';
import { MongoDBService } from './mongodb.service';

export interface PaginationOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginationResult<T> {
  data: WithId<T>[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class DatabaseHelpers {
  static async paginate<T>(
    collection: Collection<T>,
    filter: Filter<T> = {},
    options: PaginationOptions = {}
  ): Promise<PaginationResult<T>> {
    const page = options.page || 1;
    const limit = options.limit || 10;
    const skip = (page - 1) * limit;

    const sort: any = {};
    if (options.sortBy) {
      sort[options.sortBy] = options.sortOrder === 'asc' ? 1 : -1;
    } else {
      sort.createdAt = -1;
    }

    const [data, total] = await Promise.all([
      collection.find(filter).sort(sort).skip(skip).limit(limit).toArray(),
      collection.countDocuments(filter),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  static async findOneById<T>(
    collection: Collection<T>,
    id: string | ObjectId,
    mongo: MongoDBService
  ): Promise<WithId<T> | null> {
    const objectId = mongo.toObjectId(id);
    return collection.findOne({ _id: objectId } as Filter<T>);
  }

  static async updateOneById<T>(
    collection: Collection<T>,
    id: string | ObjectId,
    update: Partial<T>,
    mongo: MongoDBService
  ): Promise<boolean> {
    const objectId = mongo.toObjectId(id);
    const result = await collection.updateOne(
      { _id: objectId } as Filter<T>,
      { $set: { ...update, updatedAt: new Date() } as any }
    );
    return result.modifiedCount > 0;
  }

  static async deleteOneById<T>(
    collection: Collection<T>,
    id: string | ObjectId,
    mongo: MongoDBService
  ): Promise<boolean> {
    const objectId = mongo.toObjectId(id);
    const result = await collection.deleteOne({ _id: objectId } as Filter<T>);
    return result.deletedCount > 0;
  }

  static transformId<T extends { _id: ObjectId }>(
    doc: T | null,
    mongo: MongoDBService
  ): (Omit<T, '_id'> & { id: string }) | null {
    if (!doc) return null;
    const { _id, ...rest } = doc;
    return {
      ...rest,
      id: mongo.fromObjectId(_id),
    } as Omit<T, '_id'> & { id: string };
  }

  static transformIds<T extends { _id: ObjectId }>(
    docs: T[],
    mongo: MongoDBService
  ): (Omit<T, '_id'> & { id: string })[] {
    return docs.map((doc) => this.transformId(doc, mongo)!);
  }
}

