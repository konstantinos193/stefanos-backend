import express from 'express';
import { prisma } from '../lib/db';
import { validateSchema, createPropertySchema, updatePropertySchema, propertySearchSchema, paginationSchema } from '../lib/validations';
import { createError, getPagination } from '../lib/utils';

const router = express.Router();

// Get all properties with search and filters
router.get('/', async (req, res, next) => {
  try {
    const searchParams = validateSchema(propertySearchSchema, req.query);
    const { page, limit, sortBy, sortOrder } = validateSchema(paginationSchema, {
      page: searchParams.page,
      limit: searchParams.limit,
      sortBy: searchParams.sortBy,
      sortOrder: searchParams.sortOrder
    });
    
    const skip = (page - 1) * limit;
    
    // Build where clause
    const where: any = {
      status: 'ACTIVE'
    };
    
    if (searchParams.location) {
      where.OR = [
        { city: { contains: searchParams.location, mode: 'insensitive' } },
        { address: { contains: searchParams.location, mode: 'insensitive' } }
      ];
    }
    
    if (searchParams.type) {
      where.type = searchParams.type;
    }
    
    if (searchParams.guests) {
      where.maxGuests = { gte: searchParams.guests };
    }
    
    if (searchParams.minPrice || searchParams.maxPrice) {
      where.basePrice = {};
      if (searchParams.minPrice) where.basePrice.gte = searchParams.minPrice;
      if (searchParams.maxPrice) where.basePrice.lte = searchParams.maxPrice;
    }
    
    if (searchParams.amenities) {
      const amenityList = searchParams.amenities.split(',');
      where.amenities = {
        some: {
          amenity: {
            nameEn: { in: amenityList }
          }
        }
      };
    }
    
    // Build orderBy clause
    const orderBy: any = {};
    if (sortBy) {
      orderBy[sortBy] = sortOrder;
    } else {
      orderBy.createdAt = 'desc';
    }
    
    // Get properties
    const [properties, total] = await Promise.all([
      prisma.property.findMany({
        where,
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              avatar: true
            }
          },
          amenities: {
            include: {
              amenity: true
            }
          },
          reviews: {
            select: {
              rating: true
            }
          },
          _count: {
            select: {
              reviews: true
            }
          }
        },
        orderBy,
        skip,
        take: limit
      }),
      prisma.property.count({ where })
    ]);
    
    // Calculate average ratings
    const propertiesWithRatings = properties.map(property => {
      const avgRating = property.reviews.length > 0
        ? property.reviews.reduce((sum, review) => sum + review.rating, 0) / property.reviews.length
        : 0;
      
      return {
        ...property,
        averageRating: Math.round(avgRating * 10) / 10,
        reviewCount: property._count.reviews
      };
    });
    
    const pagination = getPagination(page, limit, total);
    
    res.json({
      success: true,
      data: {
        properties: propertiesWithRatings,
        pagination
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get unique cities/locations for autocomplete (must be before /:id route)
router.get('/locations/cities', async (req, res, next) => {
  try {
    const { query } = req.query;
    
    const where: any = {
      status: 'ACTIVE'
    };
    
    if (query && typeof query === 'string' && query.length > 0) {
      where.OR = [
        { city: { contains: query, mode: 'insensitive' } },
        { address: { contains: query, mode: 'insensitive' } }
      ];
    }
    
    const properties = await prisma.property.findMany({
      where,
      select: {
        city: true,
        country: true
      },
      take: 100,
      orderBy: {
        city: 'asc'
      }
    });
    
    const cityMap = new Map<string, { city: string; country: string }>();
    
    properties.forEach(p => {
      const key = `${p.city.toLowerCase()}-${p.country.toLowerCase()}`;
      if (!cityMap.has(key)) {
        cityMap.set(key, {
          city: p.city,
          country: p.country
        });
      }
    });
    
    const cities = Array.from(cityMap.values())
      .map(p => ({
        city: p.city,
        country: p.country,
        display: `${p.city}, ${p.country}`
      }))
      .slice(0, 20);
    
    res.json({
      success: true,
      data: cities
    });
  } catch (error) {
    next(error);
  }
});

// Get single property
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const property = await prisma.property.findUnique({
      where: { id },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            avatar: true,
            phone: true
          }
        },
        amenities: {
          include: {
            amenity: true
          }
        },
        reviews: {
          include: {
            guest: {
              select: {
                id: true,
                name: true,
                avatar: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        },
        availability: {
          where: {
            available: true,
            date: {
              gte: new Date()
            }
          },
          orderBy: {
            date: 'asc'
          },
          take: 30
        },
        _count: {
          select: {
            reviews: true,
            bookings: true
          }
        }
      }
    });
    
    if (!property) {
      throw createError('Property not found', 404);
    }
    
    // Calculate average rating
    const avgRating = property.reviews.length > 0
      ? property.reviews.reduce((sum, review) => sum + review.rating, 0) / property.reviews.length
      : 0;
    
    res.json({
      success: true,
      data: {
        ...property,
        averageRating: Math.round(avgRating * 10) / 10
      }
    });
  } catch (error) {
    next(error);
  }
});

// Create property
router.post('/', async (req, res, next) => {
  try {
    const data = validateSchema(createPropertySchema, req.body);
    
    // TODO: Add authentication middleware to get userId
    const ownerId = 'temp-user-id'; // This should come from auth middleware
    
    const { amenities, cancellationPolicy, ...propertyData } = data;
    const property = await prisma.property.create({
      data: {
        ...propertyData,
        ownerId,
        cancellationPolicy: cancellationPolicy as any,
        amenities: {
          create: amenities.map(amenityId => ({
            amenityId,
          })),
        },
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        },
        amenities: {
          include: {
            amenity: true
          }
        }
      }
    });
    
    res.status(201).json({
      success: true,
      message: 'Property created successfully',
      data: property
    });
  } catch (error) {
    next(error);
  }
});

// Update property
router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = validateSchema(updatePropertySchema, req.body);
    
    // Check if property exists
    const existingProperty = await prisma.property.findUnique({
      where: { id }
    });
    
    if (!existingProperty) {
      throw createError('Property not found', 404);
    }
    
    // TODO: Add authorization check
    
    // Extract amenities from data if present
    const { amenities, ...updateData } = data;
    
    // Prepare update data
    const propertyUpdateData: any = { ...updateData };
    
    // Handle amenities separately if provided
    if (amenities !== undefined) {
      // Delete existing amenities and create new ones
      propertyUpdateData.amenities = {
        deleteMany: {},
        create: amenities.map((amenityId: string) => ({
          amenityId,
        })),
      };
    }
    
    const property = await prisma.property.update({
      where: { id },
      data: propertyUpdateData,
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        },
        amenities: {
          include: {
            amenity: true
          }
        }
      }
    });
    
    res.json({
      success: true,
      message: 'Property updated successfully',
      data: property
    });
  } catch (error) {
    next(error);
  }
});

// Delete property
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Check if property exists
    const existingProperty = await prisma.property.findUnique({
      where: { id }
    });
    
    if (!existingProperty) {
      throw createError('Property not found', 404);
    }
    
    // TODO: Add authorization check
    
    await prisma.property.delete({
      where: { id }
    });
    
    res.json({
      success: true,
      message: 'Property deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

// Get property availability
router.get('/:id/availability', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { startDate, endDate } = req.query;
    
    const where: any = {
      propertyId: id,
      available: true
    };
    
    if (startDate) {
      where.date = { gte: new Date(startDate as string) };
    }
    
    if (endDate) {
      where.date = {
        ...where.date,
        lte: new Date(endDate as string)
      };
    }
    
    const availability = await prisma.propertyAvailability.findMany({
      where,
      orderBy: {
        date: 'asc'
      }
    });
    
    res.json({
      success: true,
      data: availability
    });
  } catch (error) {
    next(error);
  }
});

export default router;
