import express from 'express';
import { prisma } from '../lib/db';
import { validateSchema, createBookingSchema, updateBookingSchema, paginationSchema } from '../lib/validations';
import { createError, getPagination, calculateTotalPrice } from '../lib/utils';

const router = express.Router();

// Get all bookings
router.get('/', async (req, res, next) => {
  try {
    const { page, limit, sortBy, sortOrder } = validateSchema(paginationSchema, req.query);
    const skip = (page - 1) * limit;
    
    const orderBy: any = {};
    if (sortBy) {
      orderBy[sortBy] = sortOrder;
    } else {
      orderBy.createdAt = 'desc';
    }
    
    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        include: {
          property: {
            select: {
              id: true,
              titleGr: true,
              titleEn: true,
              images: true,
              address: true,
              city: true
            }
          },
          guest: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true
            }
          }
        },
        orderBy,
        skip,
        take: limit
      }),
      prisma.booking.count()
    ]);
    
    const pagination = getPagination(page, limit, total);
    
    res.json({
      success: true,
      data: {
        bookings,
        pagination
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get single booking
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        property: {
          include: {
            owner: {
              select: {
                id: true,
                name: true,
                phone: true
              }
            }
          }
        },
        guest: true,
        reviews: true,
        messages: {
          orderBy: {
            createdAt: 'asc'
          }
        }
      }
    });
    
    if (!booking) {
      throw createError('Booking not found', 404);
    }
    
    res.json({
      success: true,
      data: booking
    });
  } catch (error) {
    next(error);
  }
});

// Create booking
router.post('/', async (req, res, next) => {
  try {
    const data = validateSchema(createBookingSchema, req.body);
    
    // Check if property exists and is available
    const property = await prisma.property.findUnique({
      where: { id: data.propertyId },
      select: {
        id: true,
        status: true,
        basePrice: true,
        cleaningFee: true,
        serviceFeePercentage: true,
        taxes: true,
      },
    });
    
    if (!property) {
      throw createError('Property not found', 404);
    }
    
    if (property.status !== 'ACTIVE') {
      throw createError('Property is not available for booking', 400);
    }
    
    // Check availability
    const checkIn = new Date(data.checkIn);
    const checkOut = new Date(data.checkOut);
    
    const conflictingBookings = await prisma.booking.findMany({
      where: {
        propertyId: data.propertyId,
        status: {
          in: ['CONFIRMED', 'CHECKED_IN']
        },
        OR: [
          {
            checkIn: {
              lte: checkOut
            },
            checkOut: {
              gte: checkIn
            }
          }
        ]
      }
    });
    
    if (conflictingBookings.length > 0) {
      throw createError('Property is not available for the selected dates', 400);
    }
    
    // Calculate pricing
    const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
    const serviceFeeAmount = property.basePrice * nights * (property.serviceFeePercentage || 10) / 100;
    const totalPrice = calculateTotalPrice(
      property.basePrice,
      property.cleaningFee || 0,
      serviceFeeAmount,
      property.taxes || 0,
      nights
    );
    
    // TODO: Add authentication middleware to get guestId
    const guestId = 'temp-guest-id';
    
    const booking = await prisma.booking.create({
      data: {
        propertyId: data.propertyId,
        guestId,
        checkIn,
        checkOut,
        guests: data.guests,
        totalPrice,
        basePrice: property.basePrice * nights,
        cleaningFee: property.cleaningFee || 0,
        serviceFee: serviceFeeAmount,
        taxes: property.taxes || 0,
        source: 'DIRECT',
        guestName: data.guestName,
        guestEmail: data.guestEmail,
        guestPhone: data.guestPhone,
        specialRequests: data.specialRequests
      },
      include: {
        property: {
          select: {
            id: true,
            titleGr: true,
            titleEn: true,
            images: true,
            address: true,
            city: true
          }
        },
        guest: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });
    
    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      data: booking
    });
  } catch (error) {
    next(error);
  }
});

// Update booking
router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = validateSchema(updateBookingSchema, req.body);
    
    const existingBooking = await prisma.booking.findUnique({
      where: { id }
    });
    
    if (!existingBooking) {
      throw createError('Booking not found', 404);
    }
    
    const booking = await prisma.booking.update({
      where: { id },
      data,
      include: {
        property: {
          select: {
            id: true,
            titleGr: true,
            titleEn: true,
            images: true,
            address: true,
            city: true
          }
        },
        guest: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });
    
    res.json({
      success: true,
      message: 'Booking updated successfully',
      data: booking
    });
  } catch (error) {
    next(error);
  }
});

// Cancel booking
router.post('/:id/cancel', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    
    const booking = await prisma.booking.findUnique({
      where: { id }
    });
    
    if (!booking) {
      throw createError('Booking not found', 404);
    }
    
    if (booking.status === 'CANCELLED') {
      throw createError('Booking is already cancelled', 400);
    }
    
    if (booking.status === 'COMPLETED') {
      throw createError('Cannot cancel completed booking', 400);
    }
    
    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: {
        status: 'CANCELLED'
      }
    });
    
    res.json({
      success: true,
      message: 'Booking cancelled successfully',
      data: updatedBooking
    });
  } catch (error) {
    next(error);
  }
});

export default router;
