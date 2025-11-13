# Backend Environment Variables

Create a `.env` file in the `backend` directory with these variables:

```env
# Database
DATABASE_URL="mongodb+srv://username:password@cluster.mongodb.net/real_estate_db?retryWrites=true&w=majority"
# OR for PostgreSQL:
# DATABASE_URL="postgresql://username:password@localhost:5432/real_estate_db"

# JWT Authentication
JWT_SECRET="your-super-secret-jwt-key-here-change-in-production"
JWT_EXPIRES_IN="7d"

# Server Configuration
PORT=3001
NODE_ENV="development"

# CORS - Allowed Origins
FRONTEND_URL="http://localhost:3000"
ADMIN_URL="http://localhost:3002"

# Email Configuration (Nodemailer)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
SMTP_FROM="noreply@yourdomain.com"

# Cloudinary (Image Storage)
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"

# Stripe (Payments)
STRIPE_SECRET_KEY="sk_test_your_stripe_secret_key_here"
STRIPE_WEBHOOK_SECRET="whsec_your_webhook_secret_here"

# Optional: Airbnb API Integration
# AIRBNB_CLIENT_ID="your-client-id"
# AIRBNB_CLIENT_SECRET="your-client-secret"
# AIRBNB_REDIRECT_URI="http://localhost:3001/api/auth/airbnb/callback"

# Optional: Redis (for caching and rate limiting)
# REDIS_URL="redis://localhost:6379"
```

## Quick Setup

1. **Generate JWT Secret:**
   ```bash
   openssl rand -base64 32
   ```

2. **Get Stripe Keys:**
   - Go to [Stripe Dashboard](https://dashboard.stripe.com/test/apikeys)
   - Copy **Secret key** (starts with `sk_test_`)
   - Copy **Publishable key** for frontend

3. **Database:**
   - MongoDB Atlas: Get connection string from your cluster
   - PostgreSQL: Use connection string format shown above

4. **Email (Optional for development):**
   - Gmail: Use App Password (not regular password)
   - Other providers: Check their SMTP settings

