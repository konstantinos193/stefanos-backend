import express, { Router } from 'express';
import { prisma } from '../lib/db';
import { validateSchema, createKnowledgeArticleSchema, updateKnowledgeArticleSchema, paginationSchema } from '../lib/validations';
import { createError, getPagination } from '../lib/utils';

const router: Router = express.Router();

// Get all knowledge articles
router.get('/', async (req, res, next) => {
  try {
    const { page, limit, sortBy, sortOrder, category, tags, published } = req.query;
    const pagination = validateSchema(paginationSchema, { page, limit, sortBy, sortOrder });
    const skip = (pagination.page - 1) * pagination.limit;
    
    const orderBy: any = {};
    if (pagination.sortBy) {
      orderBy[pagination.sortBy] = pagination.sortOrder;
    } else {
      orderBy.publishedAt = 'desc';
    }
    
    const where: any = {};
    if (category) {
      where.category = category;
    }
    if (tags) {
      const tagList = (tags as string).split(',');
      where.tags = {
        hasSome: tagList
      };
    }
    if (published === 'true') {
      where.publishedAt = {
        not: null
      };
    }
    
    const [articles, total] = await Promise.all([
      prisma.knowledgeArticle.findMany({
        where,
        orderBy,
        skip,
        take: pagination.limit
      }),
      prisma.knowledgeArticle.count({ where })
    ]);
    
    const paginationData = getPagination(pagination.page, pagination.limit, total);
    
    res.json({
      success: true,
      data: {
        articles,
        pagination: paginationData
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get single knowledge article
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const article = await prisma.knowledgeArticle.findUnique({
      where: { id }
    });
    
    if (!article) {
      throw createError('Knowledge article not found', 404);
    }
    
    res.json({
      success: true,
      data: article
    });
  } catch (error) {
    next(error);
  }
});

// Create knowledge article
router.post('/', async (req, res, next) => {
  try {
    const data = validateSchema(createKnowledgeArticleSchema, req.body);
    
    const article = await prisma.knowledgeArticle.create({
      data: {
        ...data,
        publishedAt: data.publishedAt ? new Date(data.publishedAt) : null
      }
    });
    
    res.status(201).json({
      success: true,
      message: 'Knowledge article created successfully',
      data: article
    });
  } catch (error) {
    next(error);
  }
});

// Update knowledge article
router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = validateSchema(updateKnowledgeArticleSchema, req.body);
    
    const existingArticle = await prisma.knowledgeArticle.findUnique({
      where: { id }
    });
    
    if (!existingArticle) {
      throw createError('Knowledge article not found', 404);
    }
    
    const article = await prisma.knowledgeArticle.update({
      where: { id },
      data: {
        ...data,
        publishedAt: data.publishedAt ? new Date(data.publishedAt) : existingArticle.publishedAt
      }
    });
    
    res.json({
      success: true,
      message: 'Knowledge article updated successfully',
      data: article
    });
  } catch (error) {
    next(error);
  }
});

// Delete knowledge article
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const existingArticle = await prisma.knowledgeArticle.findUnique({
      where: { id }
    });
    
    if (!existingArticle) {
      throw createError('Knowledge article not found', 404);
    }
    
    await prisma.knowledgeArticle.delete({
      where: { id }
    });
    
    res.json({
      success: true,
      message: 'Knowledge article deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

// Publish article
router.post('/:id/publish', async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const article = await prisma.knowledgeArticle.findUnique({
      where: { id }
    });
    
    if (!article) {
      throw createError('Knowledge article not found', 404);
    }
    
    const updatedArticle = await prisma.knowledgeArticle.update({
      where: { id },
      data: {
        publishedAt: new Date()
      }
    });
    
    res.json({
      success: true,
      message: 'Article published successfully',
      data: updatedArticle
    });
  } catch (error) {
    next(error);
  }
});

// Get articles by category
router.get('/category/:category', async (req, res, next) => {
  try {
    const { category } = req.params;
    const { page, limit } = validateSchema(paginationSchema, req.query);
    const skip = (page - 1) * limit;
    
    const [articles, total] = await Promise.all([
      prisma.knowledgeArticle.findMany({
        where: {
          category,
          publishedAt: {
            not: null
          }
        },
        orderBy: {
          publishedAt: 'desc'
        },
        skip,
        take: limit
      }),
      prisma.knowledgeArticle.count({
        where: {
          category,
          publishedAt: {
            not: null
          }
        }
      })
    ]);
    
    const pagination = getPagination(page, limit, total);
    
    res.json({
      success: true,
      data: {
        articles,
        pagination
      }
    });
  } catch (error) {
    next(error);
  }
});

// Search articles
router.get('/search/:query', async (req, res, next) => {
  try {
    const { query } = req.params;
    const { page, limit } = validateSchema(paginationSchema, req.query);
    const skip = (page - 1) * limit;
    
    const [articles, total] = await Promise.all([
      prisma.knowledgeArticle.findMany({
        where: {
          OR: [
            { titleGr: { contains: query } },
            { titleEn: { contains: query } },
            { contentGr: { contains: query } },
            { contentEn: { contains: query } }
          ],
          publishedAt: {
            not: null
          }
        },
        orderBy: {
          publishedAt: 'desc'
        },
        skip,
        take: limit
      }),
      prisma.knowledgeArticle.count({
        where: {
          OR: [
            { titleGr: { contains: query } },
            { titleEn: { contains: query } },
            { contentGr: { contains: query } },
            { contentEn: { contains: query } }
          ],
          publishedAt: {
            not: null
          }
        }
      })
    ]);
    
    // Filter articles with matching tags in memory since SQLite JSON filtering is limited
    const filteredArticles = articles.filter(article => {
      if (!article.tags) return false;
      const tags = article.tags as string[];
      return tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()));
    });
    
    const pagination = getPagination(page, limit, total);
    
    res.json({
      success: true,
      data: {
        articles: filteredArticles,
        pagination
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;
