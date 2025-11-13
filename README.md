# Real Estate Platform Backend

A comprehensive backend API for the Real Estate Platform built with NestJS, TypeScript, Prisma, and MongoDB Atlas.

## Features

- **Property Management**: Full CRUD operations for properties with amenities, pricing, and availability
- **Booking System**: Complete booking flow with conflict resolution and payment processing
- **User Management**: Multi-role user system (Admin, Property Owner, Manager, User) with JWT authentication
- **Content Management**: Dynamic editions and knowledge articles with multilingual support
- **Service Management**: Service catalog with pricing and features
- **Review System**: Property reviews and ratings
- **Maintenance System**: Maintenance request tracking and management
- **Messaging**: Real-time communication between guests and hosts
- **Notifications**: User notification system
- **Analytics**: Property and booking analytics

## Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: NestJS 11
- **Language**: TypeScript
- **Database**: MongoDB Atlas with Prisma ORM
- **Authentication**: JWT (Passport.js)
- **Validation**: Zod & class-validator
- **API Documentation**: Swagger/OpenAPI
- **Email**: Nodemailer
- **Payments**: Stripe
- **File Storage**: Cloudinary
- **Caching**: Redis (optional)

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB Atlas account (or local MongoDB)
- npm or yarn

### Installation

1. Clone the repository and navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Set up environment variables:
```bash
cp env.example .env
```

4. Update the `.env` file with your MongoDB Atlas connection string and other configurations:
```env
DATABASE_URL="mongodb+srv://username:password@cluster.mongodb.net/?appName=Cluster0"
JWT_SECRET="your-super-secret-jwt-key-here"
JWT_EXPIRES_IN="7d"
PORT=3001
NODE_ENV="development"
FRONTEND_URL="http://localhost:3000"
```

5. Generate Prisma client (automatically runs on dev/start):
```bash
npm run db:generate
```

6. Push schema to MongoDB:
```bash
npm run db:push
```

7. Seed the database with sample data (optional):
```bash
npm run db:seed
```

8. Start the development server:
```bash
npm run dev
# or
yarn dev
```

The API will be available at `http://localhost:3001`
- API Base: `http://localhost:3001/api`
- Swagger Docs: `http://localhost:3001/api/docs`
- Health Check: `http://localhost:3001/api/health`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user (protected)

### Properties
- `GET /api/properties` - Get all properties with search/filters
- `GET /api/properties/:id` - Get single property
- `POST /api/properties` - Create property (protected)
- `PUT /api/properties/:id` - Update property (protected)
- `DELETE /api/properties/:id` - Delete property (protected)
- `GET /api/properties/:id/availability` - Get property availability

### Bookings
- `GET /api/bookings` - Get all bookings (protected)
- `GET /api/bookings/:id` - Get single booking (protected)
- `POST /api/bookings` - Create booking (protected)
- `PUT /api/bookings/:id` - Update booking (protected)
- `POST /api/bookings/:id/cancel` - Cancel booking (protected)

### Users
- `GET /api/users` - Get all users (protected, admin only)
- `GET /api/users/:id` - Get single user (protected)
- `PUT /api/users/:id` - Update user (protected)
- `POST /api/users/:id/activate` - Activate user (protected, admin only)
- `POST /api/users/:id/deactivate` - Deactivate user (protected, admin only)

### Editions
- `GET /api/editions` - Get all editions
- `GET /api/editions/:id` - Get single edition
- `POST /api/editions` - Create edition (protected)
- `PUT /api/editions/:id` - Update edition (protected)
- `DELETE /api/editions/:id` - Delete edition (protected)
- `GET /api/editions/category/:category` - Get editions by category

### Services
- `GET /api/services` - Get all services
- `GET /api/services/:id` - Get single service
- `POST /api/services` - Create service (protected)
- `PUT /api/services/:id` - Update service (protected)
- `DELETE /api/services/:id` - Delete service (protected)
- `POST /api/services/:id/toggle` - Toggle service status (protected)

### Knowledge Articles
- `GET /api/knowledge` - Get all articles
- `GET /api/knowledge/:id` - Get single article
- `POST /api/knowledge` - Create article (protected)
- `PUT /api/knowledge/:id` - Update article (protected)
- `DELETE /api/knowledge/:id` - Delete article (protected)
- `POST /api/knowledge/:id/publish` - Publish article (protected)
- `GET /api/knowledge/category/:category` - Get articles by category
- `GET /api/knowledge/search/:query` - Search articles

## Database Schema

The MongoDB database includes the following main entities:

- **Users**: User accounts with roles and authentication
- **Properties**: Real estate listings with amenities and pricing
- **Bookings**: Reservation system with status tracking
- **Amenities**: Property features and facilities
- **PropertyAmenity**: Many-to-many relationship between properties and amenities
- **Reviews**: Property ratings and comments
- **Services**: Service catalog and management
- **Editions**: Content management system
- **Knowledge Articles**: Knowledge base and documentation
- **Messages**: Communication system
- **Notifications**: User notification system
- **Maintenance Requests**: Property maintenance tracking
- **Property Availability**: Property availability calendar

## Environment Variables

```env
# Database (MongoDB Atlas)
DATABASE_URL="mongodb+srv://username:password@cluster.mongodb.net/?appName=Cluster0"

# JWT Authentication
JWT_SECRET="your-super-secret-jwt-key-here"
JWT_EXPIRES_IN="7d"

# Server
PORT=3001
NODE_ENV="development"

# CORS
FRONTEND_URL="http://localhost:3000"

# Email (Nodemailer)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"

# Cloudinary (Image Storage)
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"

# Stripe (Payments)
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Airbnb API (optional)
AIRBNB_CLIENT_ID="your-client-id"
AIRBNB_CLIENT_SECRET="your-client-secret"
AIRBNB_REDIRECT_URI="http://localhost:3001/api/auth/airbnb/callback"

# Redis (optional, for caching)
REDIS_URL="redis://localhost:6379"
```

## Scripts

- `npm run dev` - Start development server with hot reload (auto-generates Prisma client)
- `npm run build` - Build for production (includes Prisma client generation)
- `npm run start` - Start production server (auto-generates Prisma client)
- `npm run start:prod` - Start production server from dist folder
- `npm run db:generate` - Generate Prisma client manually
- `npm run db:push` - Push schema changes to MongoDB
- `npm run db:migrate` - Run database migrations
- `npm run db:studio` - Open Prisma Studio
- `npm run db:seed` - Seed database with sample data
- `npm run lint` - Run ESLint
- `npm run test` - Run tests

## Development

### Project Structure

```
src/
├── app.module.ts          # Root application module
├── app.controller.ts       # Root controller
├── main.ts                # Application entry point
├── auth/                  # Authentication module
│   ├── auth.module.ts
│   ├── auth.service.ts
│   ├── auth.controller.ts
│   ├── dto/               # Data Transfer Objects
│   └── strategies/        # Passport strategies
├── users/                 # User management module
├── properties/            # Property management module
├── bookings/              # Booking management module
├── editions/              # Content management module
├── services/              # Service management module
├── knowledge/             # Knowledge base module
├── prisma/                # Prisma configuration
│   ├── prisma.module.ts
│   └── prisma.service.ts
├── common/                # Shared utilities
│   ├── decorators/        # Custom decorators
│   ├── guards/            # Auth guards
│   ├── filters/           # Exception filters
│   └── utils/             # Utility functions
├── lib/                   # Legacy utilities (routes, validations)
└── routes/                 # Legacy Express routes
```

### Adding New Features

1. Create a new module using NestJS CLI:
```bash
nest generate module feature-name
nest generate service feature-name
nest generate controller feature-name
```

2. Update database schema in `prisma/schema.prisma`
3. Run `npm run db:generate` and `npm run db:push`
4. Add validation DTOs in the module's `dto/` folder
5. Implement business logic in the service
6. Add API endpoints in the controller
7. Add tests for new functionality

## Deployment

The backend is optimized for deployment on **Render**:

### Render Deployment Steps

1. **Create a new Web Service** on Render
2. **Connect your GitHub repository**
3. **Configure build settings**:
   - Build Command: `npm run build`
   - Start Command: `npm run start:prod`
4. **Set environment variables** in Render dashboard:
   - `DATABASE_URL` - MongoDB Atlas connection string
   - `JWT_SECRET` - Your JWT secret key
   - `JWT_EXPIRES_IN` - Token expiration (e.g., "7d")
   - `NODE_ENV` - Set to "production"
   - `FRONTEND_URL` - Your frontend URL
   - Other required environment variables
5. **Deploy** - Render will automatically:
   - Run `npm run build` (which includes `prisma generate`)
   - Start the application with `npm run start:prod`

### MongoDB Atlas Setup

1. Create a MongoDB Atlas account
2. Create a new cluster
3. Create a database user
4. Whitelist your IP address (or use 0.0.0.0/0 for Render)
5. Get your connection string and add it to `DATABASE_URL`

### Post-Deployment

1. Run database migrations:
```bash
npm run db:push
```

2. Seed initial data (optional):
```bash
npm run db:seed
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Add tests
5. Commit your changes (`git commit -m 'Add some amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## License

This project is licensed under the MIT License.
