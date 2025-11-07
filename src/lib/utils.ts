import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';

// Password utilities
export const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
};

export const verifyPassword = async (password: string, hashedPassword: string): Promise<boolean> => {
  return bcrypt.compare(password, hashedPassword);
};

// JWT utilities
export const generateToken = (payload: { userId: string; email: string; role: string }): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not defined');
  }
  
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
  return jwt.sign(payload, secret, {
    expiresIn: expiresIn as any
  });
};

export const verifyToken = (token: string): { userId: string; email: string; role: string } => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not defined');
  }
  
  return jwt.verify(token, secret) as { userId: string; email: string; role: string };
};

// Validation utilities
export const validateSchema = <T>(schema: z.ZodSchema<T>, data: unknown): T => {
  const result = schema.safeParse(data);
  if (!result.success) {
    const error = new Error('Validation failed');
    (error as any).type = 'validation';
    (error as any).details = result.error.issues;
    throw error;
  }
  return result.data;
};

// Date utilities
export const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

export const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

export const isDateInRange = (date: Date, startDate: Date, endDate: Date): boolean => {
  return date >= startDate && date <= endDate;
};

// String utilities
export const slugify = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

export const generateRandomString = (length: number): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Price utilities
export const formatPrice = (price: number, currency: string = 'EUR'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency
  }).format(price);
};

export const calculateTotalPrice = (
  basePrice: number,
  cleaningFee: number = 0,
  serviceFee: number = 0,
  taxes: number = 0,
  nights: number = 1
): number => {
  return (basePrice * nights) + cleaningFee + serviceFee + taxes;
};

// Array utilities
export const chunk = <T>(array: T[], size: number): T[][] => {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
};

export const unique = <T>(array: T[]): T[] => {
  return [...new Set(array)];
};

// Error utilities
export class AppError extends Error {
  public statusCode: number;
  public type: string;

  constructor(message: string, statusCode: number = 500, type: string = 'error') {
    super(message);
    this.statusCode = statusCode;
    this.type = type;
  }
}

export const createError = (message: string, statusCode: number = 500, type: string = 'error'): AppError => {
  return new AppError(message, statusCode, type);
};

// Response utilities
export const successResponse = <T>(data: T, message: string = 'Success') => {
  return {
    success: true,
    message,
    data
  };
};

export const errorResponse = (message: string, statusCode: number = 500) => {
  return {
    success: false,
    message,
    statusCode
  };
};

// Pagination utilities
export const getPagination = (page: number, limit: number, total: number) => {
  const totalPages = Math.ceil(total / limit);
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage,
    hasPrevPage,
    nextPage: hasNextPage ? page + 1 : null,
    prevPage: hasPrevPage ? page - 1 : null
  };
};
