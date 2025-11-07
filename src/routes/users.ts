import express from 'express';
import { prisma } from '../lib/db';
import { validateSchema, updateUserSchema, paginationSchema } from '../lib/validations';
import { createError, getPagination } from '../lib/utils';

const router = express.Router();

// Get all users
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
    
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          role: true,
          avatar: true,
          isActive: true,
          createdAt: true,
          _count: {
            select: {
              properties: true,
              bookings: true
            }
          }
        },
        orderBy,
        skip,
        take: limit
      }),
      prisma.user.count()
    ]);
    
    const pagination = getPagination(page, limit, total);
    
    res.json({
      success: true,
      data: {
        users,
        pagination
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get single user
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        avatar: true,
        isActive: true,
        createdAt: true,
        properties: {
          select: {
            id: true,
            titleGr: true,
            titleEn: true,
            type: true,
            status: true,
            basePrice: true,
            images: true,
            city: true
          }
        },
        bookings: {
          select: {
            id: true,
            status: true,
            checkIn: true,
            checkOut: true,
            totalPrice: true,
            property: {
              select: {
                id: true,
                titleGr: true,
                titleEn: true,
                images: true,
                city: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 10
        },
        _count: {
          select: {
            properties: true,
            bookings: true,
            reviews: true
          }
        }
      }
    });
    
    if (!user) {
      throw createError('User not found', 404);
    }
    
    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
});

// Update user
router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = validateSchema(updateUserSchema, req.body);
    
    const existingUser = await prisma.user.findUnique({
      where: { id }
    });
    
    if (!existingUser) {
      throw createError('User not found', 404);
    }
    
    const user = await prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        avatar: true,
        isActive: true,
        createdAt: true
      }
    });
    
    res.json({
      success: true,
      message: 'User updated successfully',
      data: user
    });
  } catch (error) {
    next(error);
  }
});

// Deactivate user
router.post('/:id/deactivate', async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const user = await prisma.user.findUnique({
      where: { id }
    });
    
    if (!user) {
      throw createError('User not found', 404);
    }
    
    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        isActive: false
      }
    });
    
    res.json({
      success: true,
      message: 'User deactivated successfully',
      data: updatedUser
    });
  } catch (error) {
    next(error);
  }
});

// Activate user
router.post('/:id/activate', async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const user = await prisma.user.findUnique({
      where: { id }
    });
    
    if (!user) {
      throw createError('User not found', 404);
    }
    
    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        isActive: true
      }
    });
    
    res.json({
      success: true,
      message: 'User activated successfully',
      data: updatedUser
    });
  } catch (error) {
    next(error);
  }
});

export default router;
