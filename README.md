# Real Estate Platform Backend

A comprehensive backend API for the Real Estate Platform built with Node.js, Express, TypeScript, and Prisma.

## Features

- **Property Management**: Full CRUD operations for properties with amenities, pricing, and availability
- **Booking System**: Complete booking flow with conflict resolution and payment processing
- **User Management**: Multi-role user system (Admin, Property Owner, Manager, User)
- **Content Management**: Dynamic editions and knowledge articles with multilingual support
- **Service Management**: Service catalog with pricing and features
- **Review System**: Property reviews and ratings
- **Maintenance System**: Maintenance request tracking and management
- **Messaging**: Real-time communication between guests and hosts
- **Notifications**: User notification system
- **Analytics**: Property and booking analytics

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT
- **Validation**: Zod
- **Email**: Nodemailer
- **Payments**: Stripe
- **File Storage**: Cloudinary
- **Caching**: Redis (optional)

## Getting Started

### Prerequisites

- Node.js 18+ 
- PostgreSQL 13+
- npm or yarn

### Installation

1. Clone the repository and navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp env.example .env
```

4. Update the `.env` file with your database credentials and other configurations.

5. Set up the database:
```bash
# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# Seed the database with sample data
npm run db:seed
```

6. Start the development server:
```bash
npm run dev
```

The API will be available at `http://localhost:3001`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Properties
- `GET /api/properties` - Get all properties with search/filters
- `GET /api/properties/:id` - Get single property
- `POST /api/properties` - Create property
- `PUT /api/properties/:id` - Update property
- `DELETE /api/properties/:id` - Delete property
- `GET /api/properties/:id/availability` - Get property availability

### Bookings
- `GET /api/bookings` - Get all bookings
- `GET /api/bookings/:id` - Get single booking
- `POST /api/bookings` - Create booking
- `PUT /api/bookings/:id` - Update booking
- `POST /api/bookings/:id/cancel` - Cancel booking

### Users
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get single user
- `PUT /api/users/:id` - Update user
- `POST /api/users/:id/activate` - Activate user
- `POST /api/users/:id/deactivate` - Deactivate user

### Editions
- `GET /api/editions` - Get all editions
- `GET /api/editions/:id` - Get single edition
- `POST /api/editions` - Create edition
- `PUT /api/editions/:id` - Update edition
- `DELETE /api/editions/:id` - Delete edition
- `GET /api/editions/category/:category` - Get editions by category

### Services
- `GET /api/services` - Get all services
- `GET /api/services/:id` - Get single service
- `POST /api/services` - Create service
- `PUT /api/services/:id` - Update service
- `DELETE /api/services/:id` - Delete service
- `POST /api/services/:id/toggle` - Toggle service status

### Knowledge Articles
- `GET /api/knowledge` - Get all articles
- `GET /api/knowledge/:id` - Get single article
- `POST /api/knowledge` - Create article
- `PUT /api/knowledge/:id` - Update article
- `DELETE /api/knowledge/:id` - Delete article
- `POST /api/knowledge/:id/publish` - Publish article
- `GET /api/knowledge/category/:category` - Get articles by category
- `GET /api/knowledge/search/:query` - Search articles

## Database Schema

The database includes the following main entities:

- **Users**: User accounts with roles and authentication
- **Properties**: Real estate listings with amenities and pricing
- **Bookings**: Reservation system with status tracking
- **Amenities**: Property features and facilities
- **Reviews**: Property ratings and comments
- **Services**: Service catalog and management
- **Editions**: Content management system
- **Knowledge Articles**: Knowledge base and documentation
- **Messages**: Communication system
- **Notifications**: User notification system
- **Maintenance Requests**: Property maintenance tracking

## Environment Variables

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/real_estate_db"

# JWT
JWT_SECRET="your-super-secret-jwt-key-here"
JWT_EXPIRES_IN="7d"

# Server
PORT=3001
NODE_ENV="development"

# CORS
FRONTEND_URL="http://localhost:3000"

# Email
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"

# Cloudinary
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"

# Stripe
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Redis (optional)
REDIS_URL="redis://localhost:6379"
```

## Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push schema changes to database
- `npm run db:migrate` - Run database migrations
- `npm run db:studio` - Open Prisma Studio
- `npm run db:seed` - Seed database with sample data

## Development

### Project Structure

```
src/
├── lib/           # Utilities and shared code
│   ├── db.ts      # Database connection
│   ├── utils.ts   # Helper functions
│   └── validations.ts # Zod schemas
├── routes/        # API route handlers
│   ├── auth.ts
│   ├── properties.ts
│   ├── bookings.ts
│   ├── users.ts
│   ├── editions.ts
│   ├── services.ts
│   └── knowledge.ts
├── index.ts       # Main application entry point
└── seed.ts        # Database seeding script
```

### Adding New Features

1. Create new route files in `src/routes/`
2. Add validation schemas in `src/lib/validations.ts`
3. Update database schema in `prisma/schema.prisma`
4. Run `npm run db:generate` and `npm run db:push`
5. Add tests for new functionality

## Deployment

The backend is designed to be deployed on Render or similar platforms:

1. Set up PostgreSQL database
2. Configure environment variables
3. Deploy the application
4. Run database migrations
5. Seed initial data if needed

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

This project is licensed under the MIT License.
