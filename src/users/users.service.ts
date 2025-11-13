import { Injectable, NotFoundException } from '@nestjs/common';
import { MongoDBService } from '../database/mongodb.service';
import { DatabaseHelpers } from '../database/helpers';
import { UpdateUserDto } from './dto/update-user.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { getPagination } from '../common/utils/pagination.util';

@Injectable()
export class UsersService {
  constructor(private mongo: MongoDBService) {}

  async findAll(query: PaginationDto) {
    const { page = 1, limit = 10, sortBy, sortOrder = 'desc' } = query;
    const usersCollection = this.mongo.getCollection('users');
    const propertiesCollection = this.mongo.getCollection('properties');
    const bookingsCollection = this.mongo.getCollection('bookings');

    const sort: any = {};
    if (sortBy) {
      sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
    } else {
      sort.createdAt = -1;
    }

    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      usersCollection
        .find({}, {
          projection: {
            _id: 1,
            email: 1,
            name: 1,
            phone: 1,
            role: 1,
            avatar: 1,
            isActive: 1,
            createdAt: 1,
          },
        })
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .toArray(),
      usersCollection.countDocuments(),
    ]);

    // Get counts for each user
    const usersWithCounts = await Promise.all(
      users.map(async (user) => {
        const [propertiesCount, bookingsCount] = await Promise.all([
          propertiesCollection.countDocuments({ ownerId: user._id }),
          bookingsCollection.countDocuments({ guestId: user._id }),
        ]);

        return {
          id: this.mongo.fromObjectId(user._id),
          email: user.email,
          name: user.name,
          phone: user.phone,
          role: user.role,
          avatar: user.avatar,
          isActive: user.isActive,
          createdAt: user.createdAt,
          _count: {
            properties: propertiesCount,
            bookings: bookingsCount,
          },
        };
      })
    );

    const pagination = getPagination(page, limit, total);

    return {
      success: true,
      data: {
        users: usersWithCounts,
        pagination,
      },
    };
  }

  async findOne(id: string) {
    const usersCollection = this.mongo.getCollection('users');
    const propertiesCollection = this.mongo.getCollection('properties');
    const bookingsCollection = this.mongo.getCollection('bookings');
    const reviewsCollection = this.mongo.getCollection('reviews');
    
    const userObjectId = this.mongo.toObjectId(id);
    const user = await usersCollection.findOne({ _id: userObjectId });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Get related data
    const [properties, bookings, counts] = await Promise.all([
      propertiesCollection
        .find(
          { ownerId: userObjectId },
          {
            projection: {
              _id: 1,
              titleGr: 1,
              titleEn: 1,
              type: 1,
              status: 1,
              basePrice: 1,
              images: 1,
              city: 1,
            },
          }
        )
        .toArray(),
      bookingsCollection
        .aggregate([
          { $match: { guestId: userObjectId } },
          {
            $lookup: {
              from: 'properties',
              localField: 'propertyId',
              foreignField: '_id',
              as: 'property',
            },
          },
          { $unwind: { path: '$property', preserveNullAndEmptyArrays: true } },
          {
            $project: {
              _id: 1,
              status: 1,
              checkIn: 1,
              checkOut: 1,
              totalPrice: 1,
              property: {
                _id: '$property._id',
                titleGr: '$property.titleGr',
                titleEn: '$property.titleEn',
                images: '$property.images',
                city: '$property.city',
              },
            },
          },
          { $sort: { createdAt: -1 } },
          { $limit: 10 },
        ])
        .toArray(),
      Promise.all([
        propertiesCollection.countDocuments({ ownerId: userObjectId }),
        bookingsCollection.countDocuments({ guestId: userObjectId }),
        reviewsCollection.countDocuments({ guestId: userObjectId }),
      ]),
    ]);

    return {
      success: true,
      data: {
        id: this.mongo.fromObjectId(user._id),
        email: user.email,
        name: user.name,
        phone: user.phone,
        role: user.role,
        avatar: user.avatar,
        isActive: user.isActive,
        createdAt: user.createdAt,
        properties: properties.map((p) => ({
          id: this.mongo.fromObjectId(p._id),
          ...p,
          _id: undefined,
        })),
        bookings: bookings.map((b) => ({
          id: this.mongo.fromObjectId(b._id),
          status: b.status,
          checkIn: b.checkIn,
          checkOut: b.checkOut,
          totalPrice: b.totalPrice,
          property: b.property
            ? {
                id: this.mongo.fromObjectId(b.property._id),
                titleGr: b.property.titleGr,
                titleEn: b.property.titleEn,
                images: b.property.images,
                city: b.property.city,
              }
            : null,
        })),
        _count: {
          properties: counts[0],
          bookings: counts[1],
          reviews: counts[2],
        },
      },
    };
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const usersCollection = this.mongo.getCollection('users');
    const userObjectId = this.mongo.toObjectId(id);
    
    const existingUser = await usersCollection.findOne({ _id: userObjectId });

    if (!existingUser) {
      throw new NotFoundException('User not found');
    }

    await usersCollection.updateOne(
      { _id: userObjectId },
      {
        $set: {
          ...updateUserDto,
          updatedAt: new Date(),
        },
      }
    );

    const user = await usersCollection.findOne(
      { _id: userObjectId },
      {
        projection: {
          _id: 1,
          email: 1,
          name: 1,
          phone: 1,
          role: 1,
          avatar: 1,
          isActive: 1,
          createdAt: 1,
        },
      }
    );

    return {
      success: true,
      message: 'User updated successfully',
      data: {
        id: this.mongo.fromObjectId(user!._id),
        email: user!.email,
        name: user!.name,
        phone: user!.phone,
        role: user!.role,
        avatar: user!.avatar,
        isActive: user!.isActive,
        createdAt: user!.createdAt,
      },
    };
  }

  async activate(id: string) {
    const usersCollection = this.mongo.getCollection('users');
    const userObjectId = this.mongo.toObjectId(id);
    
    const user = await usersCollection.findOne({ _id: userObjectId });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    await usersCollection.updateOne(
      { _id: userObjectId },
      {
        $set: {
          isActive: true,
          updatedAt: new Date(),
        },
      }
    );

    const updatedUser = await usersCollection.findOne({ _id: userObjectId });

    return {
      success: true,
      message: 'User activated successfully',
      data: DatabaseHelpers.transformId(updatedUser, this.mongo),
    };
  }

  async deactivate(id: string) {
    const usersCollection = this.mongo.getCollection('users');
    const userObjectId = this.mongo.toObjectId(id);
    
    const user = await usersCollection.findOne({ _id: userObjectId });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    await usersCollection.updateOne(
      { _id: userObjectId },
      {
        $set: {
          isActive: false,
          updatedAt: new Date(),
        },
      }
    );

    const updatedUser = await usersCollection.findOne({ _id: userObjectId });

    return {
      success: true,
      message: 'User deactivated successfully',
      data: DatabaseHelpers.transformId(updatedUser, this.mongo),
    };
  }
}
