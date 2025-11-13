# Backend Setup Guide

## Quick Start

### 1. Install Dependencies
```bash
cd backend
yarn install
# or
npm install
```

### 2. Set Up Environment Variables
```bash
cp env.example .env
# Edit .env with your actual values
```

### 3. Generate Prisma Client (CRITICAL)
```bash
npx prisma generate
```

This is **required** after schema changes. The new models and enums won't be available until you run this.

### 4. Set Up Database
```bash
# For development (pushes schema directly)
npx prisma db push

# OR for production (creates migration)
npx prisma migrate dev --name initial
```

### 5. Seed Database (Optional)
```bash
npm run db:seed
```

### 6. Start Development Server
```bash
npm run dev
# or
yarn dev
```

The server will start on `http://localhost:3001`
- API: `http://localhost:3001/api`
- Swagger Docs: `http://localhost:3001/api/docs`
- Health Check: `http://localhost:3001/api/health`

## New Features Added

### Modules Created:
1. **Payments Module** - Stripe integration for payment processing
2. **Rooms Module** - Dynamic room management
3. **PropertyGroups Module** - Subholding functionality
4. **Analytics Module** - Property and financial analytics
5. **Cleaning Module** - Cleanliness tracking and scheduling
6. **Reviews Module** - Reviews with cleanliness ratings
7. **Admin Module** - Comprehensive admin panel

### Security Features:
- MFA support (TOTP, Email OTP)
- Audit logging
- Rate limiting
- Enhanced RBAC

### Financial Features:
- Stay-only payment model
- Tax calculation (Greece VAT 24%)
- Profit tracking
- Owner revenue calculation
- Refund handling

## Troubleshooting

### TypeScript Errors About Missing Types
If you see errors like:
- `Module '@prisma/client' has no exported member 'PaymentMethod'`
- `Property 'payment' does not exist on type 'PrismaService'`

**Solution**: Run `npx prisma generate` to regenerate Prisma Client.

### Database Connection Issues
- Verify `DATABASE_URL` in `.env` is correct
- Ensure MongoDB is running (if using local MongoDB)
- Check network connectivity for cloud databases

### Stripe Integration
- Set `STRIPE_SECRET_KEY` in `.env`
- Set `STRIPE_WEBHOOK_SECRET` for webhook handling
- Use test keys for development

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/mfa/enable` - Enable MFA
- `POST /api/auth/mfa/disable` - Disable MFA

### Properties
- `GET /api/properties` - List/search properties
- `GET /api/properties/:id` - Get property details
- `POST /api/properties` - Create property (owner/admin)
- `PUT /api/properties/:id` - Update property
- `DELETE /api/properties/:id` - Delete property

### Bookings
- `GET /api/bookings` - List bookings
- `GET /api/bookings/:id` - Get booking details
- `POST /api/bookings` - Create booking
- `PATCH /api/bookings/:id` - Update booking
- `POST /api/bookings/:id/cancel` - Cancel booking

### Payments
- `POST /api/payments/process` - Process payment
- `POST /api/payments/confirm/:paymentIntentId` - Confirm payment
- `POST /api/payments/refund` - Refund payment
- `GET /api/payments/:id` - Get payment details
- `GET /api/payments/owner/payouts` - Get owner payouts
- `POST /api/payments/webhook` - Stripe webhook handler

### Reviews
- `GET /api/reviews` - List reviews
- `GET /api/reviews/property/:propertyId` - Get property reviews
- `POST /api/reviews` - Create review
- `PATCH /api/reviews/:id` - Update review
- `DELETE /api/reviews/:id` - Delete review

### Admin
- `GET /api/admin/dashboard` - Dashboard stats
- `GET /api/admin/users` - List users
- `GET /api/admin/properties` - List all properties
- `GET /api/admin/bookings` - List all bookings
- `GET /api/admin/audit-logs` - Audit logs
- `GET /api/admin/financial-report` - Financial report

See Swagger docs at `/api/docs` for full API documentation.

