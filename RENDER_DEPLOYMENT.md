# Render Deployment Guide - PostgreSQL

This guide will help you deploy the stefanos-backend to Render's free tier with a managed PostgreSQL database.

## Prerequisites

1. **GitHub Account** - Your code needs to be in a GitHub repository
2. **Render Account** - Sign up at [render.com](https://render.com) (free tier available)

## Step 1: Push Code to GitHub

If you haven't already, push your code to GitHub:

```bash
git add .
git commit -m "Migrate to PostgreSQL and prepare for Render deployment"
git push origin main
```

## Step 2: Deploy to Render

### Option A: Using Render Blueprint (Recommended)

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click "New +" → "Blueprint"
3. Connect your GitHub repository
4. Render will detect the `render.yaml` file which includes:
   - A PostgreSQL database service (fully managed)
   - A web service for your backend
5. Review the configuration and click "Apply"
6. Render will automatically:
   - Create a PostgreSQL database
   - Set up the web service
   - Link them together (DATABASE_URL is automatically set)
7. Add your other environment variables (see Step 3)

### Option B: Manual Setup

#### 2a. Create PostgreSQL Database

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click "New +" → "PostgreSQL"
3. Configure:
   - **Name**: `stefanos-db`
   - **Region**: `Oregon` (or closest to you)
   - **Plan**: `Free` (512 MB RAM, shared CPU)
   - **PostgreSQL Version**: Latest (recommended)
4. Click "Create Database"
5. **Important**: Note the connection string - it will be automatically available as `DATABASE_URL` when you link it to your web service

#### 2b. Create Web Service

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Name**: `stefanos-backend`
   - **Environment**: `Node`
   - **Region**: `Oregon` (or closest to you)
   - **Branch**: `main` (or your default branch)
   - **Root Directory**: `stefanos-backend` (if your repo has multiple folders)
   - **Build Command**: `npm install && npm run build && npx prisma generate`
   - **Start Command**: `npm run start:prod`
   - **Plan**: `Free`
5. **Link Database**: In the "Environment" section, link your PostgreSQL database - this automatically sets `DATABASE_URL`

## Step 3: Configure Environment Variables

In Render Dashboard, go to your web service → Environment → Add Environment Variable:

### Required Variables:

```
JWT_SECRET=your-super-secret-jwt-key-here-change-this
NODE_ENV=production
```

**Note**: `DATABASE_URL` is automatically set by Render when you link the PostgreSQL database - you don't need to set it manually!

### Optional Variables (add as needed):

```
FRONTEND_URL=https://your-frontend-url.onrender.com
ADMIN_URL=https://your-admin-url.onrender.com
JWT_EXPIRES_IN=7d

# Email (Nodemailer)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Cloudinary (Image Storage)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Stripe (Payments)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Redis (if using)
REDIS_URL=redis://your-redis-url
```

## Step 4: Run Database Migrations

After your first deployment, you need to run Prisma migrations to set up your database schema:

### Option A: Using Render Shell (Recommended)

1. Go to your web service in Render Dashboard
2. Click "Shell" tab
3. Run:
   ```bash
   npx prisma migrate deploy
   ```
   Or if you want to create a new migration:
   ```bash
   npx prisma migrate dev --name init
   ```

### Option B: Using Local Machine

1. Get your database connection string from Render Dashboard (PostgreSQL service → "Connections")
2. Set it in your local `.env` file:
   ```
   DATABASE_URL=postgresql://user:password@host:port/database?sslmode=require
   ```
3. Run migrations locally:
   ```bash
   npx prisma migrate deploy
   ```

### Option C: Add to Build Command (Automatic)

You can also add migration to your build command in `render.yaml`:
```yaml
buildCommand: npm install && npm run build && npx prisma generate && npx prisma migrate deploy
```

## Step 5: Deploy

1. Click "Create Web Service" (or "Apply" if using Blueprint)
2. Render will automatically:
   - Install dependencies
   - Build your application
   - Generate Prisma client
   - Start the service
3. Wait for deployment to complete (usually 5-10 minutes)
4. Run database migrations (see Step 4)

## Step 6: Get Your Backend URL

Once deployed, Render will provide you with a URL like:
```
https://stefanos-backend.onrender.com
```

Your API will be available at:
```
https://stefanos-backend.onrender.com/api
```

Swagger docs:
```
https://stefanos-backend.onrender.com/api/docs
```

## Important Notes

### Free Tier Limitations:

1. **Spins Down After Inactivity**: Free tier services spin down after 15 minutes of inactivity. First request after spin-down may take 30-60 seconds.

2. **Database**: 
   - Free tier PostgreSQL: 512 MB storage, shared CPU
   - Automatic backups (daily)
   - Connection limit: 97 connections
   - Perfect for development and small production apps

3. **Build Time**: Free tier has limited build time. If builds fail, consider:
   - Optimizing dependencies
   - Using `npm ci` instead of `npm install` in build command
   - Removing unused dependencies

4. **Environment Variables**: Keep sensitive data in Render's environment variables, not in code

### PostgreSQL Benefits on Render:

✅ **Fully Managed**: No need to manage database servers
✅ **Automatic Backups**: Daily backups included
✅ **High Availability**: Available on paid plans
✅ **SSL/TLS**: Secure connections by default
✅ **Easy Scaling**: Upgrade plan when needed
✅ **Connection Pooling**: Built-in connection management

### Updating Your Deployment:

1. Push changes to GitHub
2. Render will automatically detect and deploy (if auto-deploy is enabled)
3. Run migrations if schema changed: `npx prisma migrate deploy`
4. Or manually trigger deployment from Render Dashboard

### Database Migrations:

- **After schema changes**: Update `prisma/schema.prisma`, then run `npx prisma migrate dev --name migration_name`
- **In production**: Run `npx prisma migrate deploy` via Render Shell or add to build command
- **Check migration status**: `npx prisma migrate status`

### Troubleshooting:

- **Build Fails**: Check build logs in Render Dashboard
- **Service Won't Start**: Check runtime logs and ensure all environment variables are set
- **Database Connection Issues**: 
  - Verify DATABASE_URL is set (should be automatic when database is linked)
  - Check PostgreSQL service is running
  - Verify migrations have been run
- **Migration Errors**: Run `npx prisma migrate status` to check migration state
- **CORS Errors**: Update FRONTEND_URL in environment variables

## Next Steps

1. Run database migrations (see Step 4)
2. Seed your database if needed (optional):
   ```bash
   npm run db:seed
   ```
3. Update your frontend to use the new backend URL
4. Test all API endpoints
5. Set up monitoring (Render provides basic logs)
6. Consider upgrading to paid tier for production (no spin-down, better performance, more database storage)

## PostgreSQL Connection String Format

Render automatically provides the connection string in this format:
```
postgresql://user:password@host:port/database?sslmode=require
```

This is automatically set as `DATABASE_URL` when you link the database to your web service.
