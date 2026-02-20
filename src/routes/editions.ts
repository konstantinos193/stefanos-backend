import express, { Router } from 'express';
import { prisma } from '../lib/db';
import { validateSchema, createEditionSchema, updateEditionSchema, paginationSchema } from '../lib/validations';
import { createError, getPagination } from '../lib/utils';

const router: Router = express.Router();

// Get all editions
router.get('/', async (req, res, next) => {
  try {
    const { page, limit, sortBy, sortOrder, category, status } = req.query;
    const pagination = validateSchema(paginationSchema, { page, limit, sortBy, sortOrder });
    const skip = (pagination.page - 1) * pagination.limit;
    
    const orderBy: any = {};
    if (pagination.sortBy) {
      orderBy[pagination.sortBy] = pagination.sortOrder;
    } else {
      orderBy.order = 'asc';
    }
    
    const where: any = {};
    if (category) {
      where.category = category;
    }
    if (status) {
      where.status = status;
    }
    
    const [editions, total] = await Promise.all([
      prisma.edition.findMany({
        where,
        orderBy,
        skip,
        take: pagination.limit
      }),
      prisma.edition.count({ where })
    ]);
    
    const paginationData = getPagination(pagination.page, pagination.limit, total);
    
    res.json({
      success: true,
      data: {
        editions,
        pagination: paginationData
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get single edition
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const edition = await prisma.edition.findUnique({
      where: { id }
    });
    
    if (!edition) {
      throw createError('Edition not found', 404);
    }
    
    res.json({
      success: true,
      data: edition
    });
  } catch (error) {
    next(error);
  }
});

// Create edition
router.post('/', async (req, res, next) => {
  try {
    const data = validateSchema(createEditionSchema, req.body);
    
    const edition = await prisma.edition.create({
      data
    });
    
    res.status(201).json({
      success: true,
      message: 'Edition created successfully',
      data: edition
    });
  } catch (error) {
    next(error);
  }
});

// Update edition
router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = validateSchema(updateEditionSchema, req.body);
    
    const existingEdition = await prisma.edition.findUnique({
      where: { id }
    });
    
    if (!existingEdition) {
      throw createError('Edition not found', 404);
    }
    
    const edition = await prisma.edition.update({
      where: { id },
      data
    });
    
    res.json({
      success: true,
      message: 'Edition updated successfully',
      data: edition
    });
  } catch (error) {
    next(error);
  }
});

// Delete edition
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const existingEdition = await prisma.edition.findUnique({
      where: { id }
    });
    
    if (!existingEdition) {
      throw createError('Edition not found', 404);
    }
    
    await prisma.edition.delete({
      where: { id }
    });
    
    res.json({
      success: true,
      message: 'Edition deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

// Get editions by category
router.get('/category/:category', async (req, res, next) => {
  try {
    const { category } = req.params;
    const { page, limit } = validateSchema(paginationSchema, req.query);
    const skip = (page - 1) * limit;
    
    const [editions, total] = await Promise.all([
      prisma.edition.findMany({
        where: {
          category,
          status: 'PUBLISHED'
        },
        orderBy: {
          order: 'asc'
        },
        skip,
        take: limit
      }),
      prisma.edition.count({
        where: {
          category,
          status: 'PUBLISHED'
        }
      })
    ]);
    
    const pagination = getPagination(page, limit, total);
    
    res.json({
      success: true,
      data: {
        editions,
        pagination
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;
