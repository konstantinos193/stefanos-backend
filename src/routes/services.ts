import express, { Router } from 'express';
import { prisma } from '../lib/db';
import { validateSchema, createServiceSchema, updateServiceSchema, paginationSchema } from '../lib/validations';
import { createError, getPagination } from '../lib/utils';

const router: Router = express.Router();

// Get all services
router.get('/', async (req, res, next) => {
  try {
    const { page, limit, sortBy, sortOrder, isActive } = req.query;
    const pagination = validateSchema(paginationSchema, { page, limit, sortBy, sortOrder });
    const skip = (pagination.page - 1) * pagination.limit;
    
    const orderBy: any = {};
    if (pagination.sortBy) {
      orderBy[pagination.sortBy] = pagination.sortOrder;
    } else {
      orderBy.createdAt = 'desc';
    }
    
    const where: any = {};
    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }
    
    const [services, total] = await Promise.all([
      prisma.service.findMany({
        where,
        orderBy,
        skip,
        take: pagination.limit
      }),
      prisma.service.count({ where })
    ]);
    
    const paginationData = getPagination(pagination.page, pagination.limit, total);
    
    res.json({
      success: true,
      data: {
        services,
        pagination: paginationData
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get single service
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const service = await prisma.service.findUnique({
      where: { id }
    });
    
    if (!service) {
      throw createError('Service not found', 404);
    }
    
    res.json({
      success: true,
      data: service
    });
  } catch (error) {
    next(error);
  }
});

// Create service
router.post('/', async (req, res, next) => {
  try {
    const data = validateSchema(createServiceSchema, req.body);
    
    const service = await prisma.service.create({
      data
    });
    
    res.status(201).json({
      success: true,
      message: 'Service created successfully',
      data: service
    });
  } catch (error) {
    next(error);
  }
});

// Update service
router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = validateSchema(updateServiceSchema, req.body);
    
    const existingService = await prisma.service.findUnique({
      where: { id }
    });
    
    if (!existingService) {
      throw createError('Service not found', 404);
    }
    
    const service = await prisma.service.update({
      where: { id },
      data
    });
    
    res.json({
      success: true,
      message: 'Service updated successfully',
      data: service
    });
  } catch (error) {
    next(error);
  }
});

// Delete service
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const existingService = await prisma.service.findUnique({
      where: { id }
    });
    
    if (!existingService) {
      throw createError('Service not found', 404);
    }
    
    await prisma.service.delete({
      where: { id }
    });
    
    res.json({
      success: true,
      message: 'Service deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

// Toggle service status
router.post('/:id/toggle', async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const service = await prisma.service.findUnique({
      where: { id }
    });
    
    if (!service) {
      throw createError('Service not found', 404);
    }
    
    const updatedService = await prisma.service.update({
      where: { id },
      data: {
        isActive: !service.isActive
      }
    });
    
    res.json({
      success: true,
      message: `Service ${updatedService.isActive ? 'activated' : 'deactivated'} successfully`,
      data: updatedService
    });
  } catch (error) {
    next(error);
  }
});

export default router;
