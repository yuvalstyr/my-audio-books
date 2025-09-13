# Railway Deployment Guide

This document provides instructions for deploying the Audiobook Wishlist Manager to Railway.

## Prerequisites

- Railway account (sign up at [railway.app](https://railway.app))
- Railway CLI installed (optional, for command-line deployment)
- Project built and tested locally

## Deployment Configuration

The project is configured for Railway deployment with the following files:

### `railway.json`
- Configures Nixpacks builder for automatic dependency detection
- Sets up health check endpoint at `/api/health`
- Defines production environment variables
- Configures restart policy for reliability

### Environment Variables

The following environment variables will be automatically set by Railway:

**Required (set by Railway):**
- `NODE_ENV=production`
- `DATABASE_PATH` - Path to persistent database file
- `RAILWAY_VOLUME_MOUNT_PATH` - Volume mount path for data persistence

**Optional:**
- `PORT` - Server port (Railway sets this automatically)

## Deployment Steps

### Method 1: GitHub Integration (Recommended)

1. **Push to GitHub:**
   ```bash
   git add .
   git commit -m "Prepare for Railway deployment"
   git push origin main
   ```

2. **Connect to Railway:**
   - Go to [railway.app](https://railway.app)
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your repository
   - Railway will automatically detect the configuration

3. **Configure Environment:**
   - Railway will automatically set required environment variables
   - The database will be created in the persistent volume

### Method 2: Railway CLI

1. **Install Railway CLI:**
   ```bash
   npm install -g @railway/cli
   ```

2. **Login and Deploy:**
   ```bash
   railway login
   railway init
   railway up
   ```

## Pre-Deployment Verification

Run the deployment verification script to ensure everything is ready:

```bash
npm run verify:deployment
```

This script checks:
- Build artifacts are present
- Configuration files are correct
- Database migrations are available
- Critical files exist
- Common deployment issues

## Build Process

The deployment uses the following build process:

1. **Clean Build:** Removes old build artifacts
2. **SvelteKit Build:** Creates optimized production build
3. **Railway Init:** Sets up database and environment
4. **Health Check:** Verifies deployment readiness

```bash
npm run build:production
```

## Database Setup

The application uses SQLite with automatic setup:

1. **Database Location:** Stored in Railway's persistent volume
2. **Migrations:** Run automatically during deployment
3. **Initialization:** Database created on first startup if needed

## Health Monitoring

The application provides health check endpoints:

- **Basic Health Check:** `GET /api/health`
- **Detailed Health Check:** `POST /api/health/detailed`

Railway uses the basic health check to monitor application status.

## Troubleshooting

### Common Issues

1. **Build Failures:**
   - Check that all dependencies are in `package.json`
   - Verify TypeScript compilation passes locally
   - Ensure environment variables are correctly configured

2. **Database Issues:**
   - Check that migrations run successfully
   - Verify database path is accessible
   - Ensure volume is properly mounted

3. **Runtime Errors:**
   - Check Railway logs for detailed error messages
   - Verify all required environment variables are set
   - Test the build locally with production settings

### Debugging Commands

```bash
# Test local build
npm run build:production
npm run start

# Verify deployment readiness
npm run verify:deployment

# Test API endpoints
npm run test:deployment
```

### Railway Logs

View deployment and runtime logs in the Railway dashboard:
- Go to your project in Railway
- Click on the "Deployments" tab
- Select a deployment to view logs

## Performance Optimization

The deployment is optimized for production:

- **Asset Compression:** Vite optimizes and compresses assets
- **Code Splitting:** Automatic code splitting for faster loading
- **Service Worker:** PWA features for offline functionality
- **Database Optimization:** SQLite with proper indexing

## Security Considerations

- Environment variables are securely managed by Railway
- Database is stored in persistent, secure volume
- HTTPS is automatically provided by Railway
- No sensitive data is committed to version control

## Scaling

Railway provides automatic scaling options:
- **Horizontal Scaling:** Multiple instances for high traffic
- **Vertical Scaling:** Increased CPU/memory for performance
- **Database Scaling:** Persistent volume can be expanded

## Support

For deployment issues:
1. Check Railway documentation: [docs.railway.app](https://docs.railway.app)
2. Review application logs in Railway dashboard
3. Run local verification scripts
4. Check GitHub repository for updates

## Deployment Checklist

- [ ] Code committed and pushed to GitHub
- [ ] `npm run verify:deployment` passes
- [ ] Environment variables configured
- [ ] Database migrations tested
- [ ] Health check endpoints working
- [ ] Railway project configured
- [ ] Domain configured (if custom domain needed)