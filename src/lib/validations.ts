import { z } from 'zod';
import { validateSchema as validateSchemaUtil } from './utils';

// Re-export validateSchema for convenience
export const validateSchema = validateSchemaUtil;

// User validations
export const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2).max(100),
  phone: z.string().optional(),
  password: z.string().min(8),
  role: z.enum(['USER', 'ADMIN', 'PROPERTY_OWNER', 'MANAGER']).optional()
});

export const updateUserSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  phone: z.string().optional(),
  avatar: z.string().url().optional()
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

// Property validations
export const createPropertySchema = z.object({
  titleGr: z.string().min(1).max(255),
  titleEn: z.string().min(1).max(255),
  descriptionGr: z.string().optional(),
  descriptionEn: z.string().optional(),
  type: z.enum(['APARTMENT', 'HOUSE', 'ROOM', 'COMMERCIAL', 'STORAGE', 'VACATION_RENTAL', 'LUXURY', 'INVESTMENT']),
  address: z.string().min(1),
  city: z.string().min(1),
  country: z.string().min(1),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  maxGuests: z.number().int().min(1),
  bedrooms: z.number().int().min(0),
  bathrooms: z.number().int().min(0),
  area: z.number().positive().optional(),
  basePrice: z.number().positive(),
  currency: z.string().default('EUR'),
  cleaningFee: z.number().min(0).optional(),
  serviceFee: z.number().min(0).optional(),
  taxes: z.number().min(0).optional(),
  minStay: z.number().int().min(1).default(1),
  maxStay: z.number().int().positive().optional(),
  advanceBooking: z.number().int().min(1).default(30),
  checkInTime: z.string().optional(),
  checkOutTime: z.string().optional(),
  cancellationPolicy: z.string().optional(),
  houseRules: z.string().optional(),
  petFriendly: z.boolean().default(false),
  smokingAllowed: z.boolean().default(false),
  partyAllowed: z.boolean().default(false),
  images: z.array(z.string().url()).default([]),
  videos: z.array(z.string().url()).default([]),
  amenities: z.array(z.string()).default([])
});

export const updatePropertySchema = createPropertySchema.partial();

// Booking validations
export const createBookingSchema = z.object({
  propertyId: z.string(),
  checkIn: z.string().datetime(),
  checkOut: z.string().datetime(),
  guests: z.number().int().min(1),
  guestName: z.string().min(1),
  guestEmail: z.string().email(),
  guestPhone: z.string().optional(),
  specialRequests: z.string().optional(),
  paymentMethod: z.string().optional()
});

export const updateBookingSchema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'CHECKED_IN', 'COMPLETED', 'CANCELLED', 'NO_SHOW']).optional(),
  paymentStatus: z.enum(['PENDING', 'COMPLETED', 'FAILED', 'REFUNDED', 'PARTIALLY_REFUNDED']).optional(),
  specialRequests: z.string().optional()
});

// Review validations
export const createReviewSchema = z.object({
  propertyId: z.string(),
  bookingId: z.string(),
  rating: z.number().int().min(1).max(5),
  title: z.string().optional(),
  comment: z.string().optional()
});

export const updateReviewSchema = z.object({
  rating: z.number().int().min(1).max(5).optional(),
  title: z.string().optional(),
  comment: z.string().optional(),
  response: z.string().optional()
});

// Edition validations
export const createEditionSchema = z.object({
  category: z.string().min(1),
  titleGr: z.string().min(1),
  titleEn: z.string().min(1),
  descriptionGr: z.string().optional(),
  descriptionEn: z.string().optional(),
  contentGr: z.string().optional(),
  contentEn: z.string().optional(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).default('DRAFT'),
  featured: z.boolean().default(false),
  order: z.number().int().optional()
});

export const updateEditionSchema = createEditionSchema.partial();

// Service validations
export const createServiceSchema = z.object({
  titleGr: z.string().min(1),
  titleEn: z.string().min(1),
  descriptionGr: z.string().optional(),
  descriptionEn: z.string().optional(),
  icon: z.string().optional(),
  features: z.array(z.string()).default([]),
  pricingGr: z.string().optional(),
  pricingEn: z.string().optional(),
  isActive: z.boolean().default(true)
});

export const updateServiceSchema = createServiceSchema.partial();

// Knowledge Article validations
export const createKnowledgeArticleSchema = z.object({
  titleGr: z.string().min(1),
  titleEn: z.string().min(1),
  contentGr: z.string().optional(),
  contentEn: z.string().optional(),
  category: z.string().min(1),
  tags: z.array(z.string()).default([]),
  author: z.string().min(1),
  readTime: z.number().int().positive().optional(),
  publishedAt: z.string().datetime().optional()
});

export const updateKnowledgeArticleSchema = createKnowledgeArticleSchema.partial();

// Query validations
export const paginationSchema = z.object({
  page: z.string().transform(Number).pipe(z.number().int().min(1)).default(1),
  limit: z.string().transform(Number).pipe(z.number().int().min(1).max(100)).default(10),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
});

export const propertySearchSchema = z.object({
  location: z.string().optional(),
  checkIn: z.string().datetime().optional(),
  checkOut: z.string().datetime().optional(),
  guests: z.string().transform(Number).pipe(z.number().int().min(1)).optional(),
  type: z.string().optional(),
  minPrice: z.string().transform(Number).pipe(z.number().min(0)).optional(),
  maxPrice: z.string().transform(Number).pipe(z.number().min(0)).optional(),
  amenities: z.string().optional(),
  ...paginationSchema.shape
});
