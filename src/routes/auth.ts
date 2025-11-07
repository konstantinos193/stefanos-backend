import express from 'express';
import { prisma } from '../lib/db';
import { validateSchema, createUserSchema, loginSchema } from '../lib/validations';
import { hashPassword, verifyPassword, generateToken, verifyToken, createError } from '../lib/utils';

const router = express.Router();

// Register
router.post('/register', async (req, res, next) => {
  try {
    const data = validateSchema(createUserSchema, req.body);
    
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email }
    });
    
    if (existingUser) {
      throw createError('User already exists with this email', 400, 'validation');
    }
    
    // Hash password
    const hashedPassword = await hashPassword(data.password);
    
    // Create user
    const user = await prisma.user.create({
      data: {
        email: data.email,
        name: data.name,
        phone: data.phone,
        role: data.role || 'USER'
      }
    });
    
    // Generate token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role
    });
    
    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role
        },
        token
      }
    });
  } catch (error) {
    next(error);
  }
});

// Login
router.post('/login', async (req, res, next) => {
  try {
    const data = validateSchema(loginSchema, req.body);
    
    // Find user
    const user = await prisma.user.findUnique({
      where: { email: data.email }
    }) as any;
    
    if (!user) {
      throw createError('Invalid credentials', 401, 'auth');
    }
    
    // Verify password
    const userPassword = user.password || '';
    const isValidPassword = await verifyPassword(data.password, userPassword);
    
    if (!isValidPassword) {
      throw createError('Invalid credentials', 401, 'auth');
    }
    
    if (!user.isActive) {
      throw createError('Account is deactivated', 401, 'auth');
    }
    
    // Generate token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role
    });
    
    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role
        },
        token
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get current user
router.get('/me', async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      throw createError('No token provided', 401, 'auth');
    }
    
    const decoded = verifyToken(token);
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
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
    
    if (!user) {
      throw createError('User not found', 404, 'auth');
    }
    
    res.json({
      success: true,
      data: { user }
    });
  } catch (error) {
    next(error);
  }
});

export default router;
