# Deployment Guide

This guide covers various deployment options for the Audiobook Wishlist Manager application.

## Table of Contents

- [Railway Deployment (Recommended)](#railway-deployment-recommended)
- [Docker Deployment](#docker-deployment)
- [Manual Server Deployment](#manual-server-deployment)
- [Static Site Deployment](#static-site-deployment)
- [Environment Configuration](#environment-configuration)
- [Database Setup](#database-setup)
- [Troubleshooting](#troubleshooting)

## Railway Deployment (Recommended)

Railway provides the easiest deployment with automatic builds, database persistence, and zero-config setup.

### Prerequisites

- Railway account (free tier available)
- GitHub repository with your code
- Git repository with all changes committed

### Step-by-Step Deployment

1. **Prepare Repository**
   ```sh
   # Ensure all changes are committed
   git add .
   git commit -m "Prepare for Railway deployment"
   git push origin main
   ```

2. **Deploy to Railway**
   - Visit [railway.app](https://railway.app)
   - Click "Deploy from GitHub repo"
   - Authorize GitHub access
   - Select your repository
   - Railway automatically detects the configuration

3. **Configure Database Persistence** (Recommended)
   - In Railway dashboard, go to your project
   - Click "Add Service" → "Volume"
   - Set mount path: `/app/data`
   - Size: 1GB (adjust as needed)
   - The app automatically uses this for database storage

4. **Set Custom Domain** (Optional)
   - In Railway dashboard, go to your service
   - Click "Settings" → "Domains"
   - Add your custom domain
   - Configure DNS records as shown

5. **Verify Deployment**
   ```sh
   # Test the deployment
   npm run verify:deployment
   
   # Or manually check
   curl https://your-app.railway.app/api/health
   ```

### Railway Configuration

The project includes optimized `railway.json`:

```json
{
    "build": {
        "builder": "NIXPACKS",
        "buildCommand": "npm ci && npm run build"
    },
    "deploy": {
        "startCommand": "npm run start",
        "restartPolicyType": "ON_FAILURE",
        "restartPolicyMaxRetries": 10,
        "healthcheckPath": "/api/health",
        "healthcheckTimeout": 300
    },
    "environments": {
        "production": {
            "variables": {
                "NODE_ENV": "production",
                "DATABASE_PATH": "$RAILWAY_VOLUME_MOUNT_PATH/audiobook-wishlist.db"
            }
        }
    }
}
```

### Railway Environment Variables

Railway automatically sets:
- `PORT`: Application port
- `RAILWAY_VOLUME_MOUNT_PATH`: Volume mount path (if volume is configured)

You can add custom variables in the Railway dashboard under "Variables".

## Docker Deployment

Deploy using Docker for containerized environments.

### Dockerfile

Create a `Dockerfile` in the project root:

```dockerfile
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:18-alpine AS runner

WORKDIR /app

# Copy built application
COPY --from=builder /app/build ./build
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/drizzle ./drizzle

# Create data directory for database
RUN mkdir -p /app/data

# Expose port
EXPOSE 3000

# Set environment variables
ENV NODE_ENV=production
ENV DATABASE_PATH=/app/data/audiobook-wishlist.db
ENV PORT=3000

# Start the application
CMD ["npm", "run", "start"]
```

### Docker Compose

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_PATH=/app/data/audiobook-wishlist.db
    volumes:
      - ./data:/app/data
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
```

### Build and Run

```sh
# Build the image
docker build -t audiobook-wishlist .

# Run with Docker
docker run -d \
  --name audiobook-wishlist \
  -p 3000:3000 \
  -v $(pwd)/data:/app/data \
  audiobook-wishlist

# Or use Docker Compose
docker-compose up -d
```

## Manual Server Deployment

Deploy to your own server (VPS, dedicated server, etc.).

### Prerequisites

- Linux server (Ubuntu 20.04+ recommended)
- Node.js 18+ installed
- Nginx (optional, for reverse proxy)
- SSL certificate (Let's Encrypt recommended)

### Server Setup

1. **Install Node.js**
   ```sh
   # Using NodeSource repository
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   
   # Verify installation
   node --version
   npm --version
   ```

2. **Create Application User**
   ```sh
   sudo useradd -m -s /bin/bash audiobook
   sudo su - audiobook
   ```

3. **Deploy Application**
   ```sh
   # Clone repository
   git clone https://github.com/yourusername/audiobook-wishlist-manager.git
   cd audiobook-wishlist-manager
   
   # Install dependencies
   npm ci --only=production
   
   # Build application
   npm run build:production
   
   # Create data directory
   mkdir -p data
   ```

4. **Configure Environment**
   ```sh
   # Create production environment file
   cat > .env << EOF
   NODE_ENV=production
   DATABASE_PATH=/home/audiobook/audiobook-wishlist-manager/data/audiobook-wishlist.db
   PORT=3000
   EOF
   ```

5. **Set up Process Manager (PM2)**
   ```sh
   # Install PM2 globally
   sudo npm install -g pm2
   
   # Create PM2 ecosystem file
   cat > ecosystem.config.js << EOF
   module.exports = {
     apps: [{
       name: 'audiobook-wishlist',
       script: 'npm',
       args: 'run start',
       cwd: '/home/audiobook/audiobook-wishlist-manager',
       env: {
         NODE_ENV: 'production',
         PORT: 3000
       },
       instances: 1,
       autorestart: true,
       watch: false,
       max_memory_restart: '1G'
     }]
   };
   EOF
   
   # Start application
   pm2 start ecosystem.config.js
   
   # Save PM2 configuration
   pm2 save
   pm2 startup
   ```

### Nginx Configuration

Create `/etc/nginx/sites-available/audiobook-wishlist`:

```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;
    
    # SSL configuration
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    
    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    
    # Proxy to Node.js application
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # Static file caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

Enable the site:
```sh
sudo ln -s /etc/nginx/sites-available/audiobook-wishlist /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## Static Site Deployment

Deploy as a static site (note: this disables server-side features like the API).

### Configure for Static Deployment

1. **Update `svelte.config.js`**:
   ```javascript
   import adapter from '@sveltejs/adapter-static';
   
   export default {
     kit: {
       adapter: adapter({
         pages: 'build',
         assets: 'build',
         fallback: 'index.html'
       })
     }
   };
   ```

2. **Build for static deployment**:
   ```sh
   npm run build
   ```

### Deploy to Netlify

1. **Connect repository** to Netlify
2. **Set build settings**:
   - Build command: `npm run build`
   - Publish directory: `build`
3. **Deploy**

### Deploy to Vercel

1. **Install Vercel CLI**:
   ```sh
   npm i -g vercel
   ```

2. **Deploy**:
   ```sh
   vercel --prod
   ```

### Deploy to GitHub Pages

1. **Install adapter**:
   ```sh
   npm install -D @sveltejs/adapter-static
   ```

2. **Configure for GitHub Pages** in `svelte.config.js`:
   ```javascript
   const config = {
     kit: {
       adapter: adapter(),
       paths: {
         base: process.env.NODE_ENV === 'production' ? '/repository-name' : '',
       }
     }
   };
   ```

3. **Create GitHub Action** (`.github/workflows/deploy.yml`):
   ```yaml
   name: Deploy to GitHub Pages
   
   on:
     push:
       branches: [ main ]
   
   jobs:
     deploy:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v3
         - uses: actions/setup-node@v3
           with:
             node-version: 18
         - run: npm ci
         - run: npm run build
         - uses: actions/deploy-pages@v1
           with:
             artifact_name: github-pages
             path: build
   ```

## Environment Configuration

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `NODE_ENV` | Environment mode | `development` | No |
| `PORT` | Server port | `3000` | No |
| `DATABASE_PATH` | Database file path | `./dev.db` | No |
| `DEBUG` | Enable debug logging | `false` | No |

### Production Environment

```sh
# Required for production
NODE_ENV=production

# Database configuration
DATABASE_PATH=/path/to/database.db

# Server configuration
PORT=3000

# Optional: Debug logging
DEBUG=false
```

### Development Environment

```sh
# Development mode
NODE_ENV=development

# Development database
DATABASE_PATH=./dev.db

# Development server port
PORT=5173
```

## Database Setup

### SQLite Configuration

The application uses SQLite with the following considerations:

1. **File Permissions**: Ensure the database file and directory are writable
2. **Backup Strategy**: Regular backups of the database file
3. **Performance**: Proper indexing for large datasets

### Database Migration

```sh
# Generate migrations after schema changes
npm run db:generate

# Apply migrations
npm run db:migrate

# Push schema changes (development)
npm run db:push
```

### Database Backup

```sh
# Create backup
cp /path/to/audiobook-wishlist.db /path/to/backup/audiobook-wishlist-$(date +%Y%m%d).db

# Automated backup script
#!/bin/bash
DB_PATH="/path/to/audiobook-wishlist.db"
BACKUP_DIR="/path/to/backups"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR
cp $DB_PATH $BACKUP_DIR/audiobook-wishlist-$DATE.db

# Keep only last 30 days of backups
find $BACKUP_DIR -name "audiobook-wishlist-*.db" -mtime +30 -delete
```

## Troubleshooting

### Common Deployment Issues

**Build Failures**:
```sh
# Clear cache and rebuild
rm -rf node_modules .svelte-kit build
npm install
npm run build
```

**Database Issues**:
```sh
# Check database file permissions
ls -la /path/to/database.db

# Reset database
rm database.db
npm run db:push
```

**Port Conflicts**:
```sh
# Check what's using the port
lsof -i :3000

# Kill process using port
kill -9 $(lsof -t -i:3000)
```

**Memory Issues**:
```sh
# Check memory usage
free -h
ps aux --sort=-%mem | head

# Restart application
pm2 restart audiobook-wishlist
```

### Health Checks

**Application Health**:
```sh
# Check if application is running
curl http://localhost:3000/api/health

# Check response time
curl -w "@curl-format.txt" -o /dev/null -s http://localhost:3000/api/health
```

**Database Health**:
```sh
# Check database file
sqlite3 /path/to/database.db ".tables"

# Check database size
du -h /path/to/database.db
```

### Monitoring

**Log Files**:
```sh
# PM2 logs
pm2 logs audiobook-wishlist

# System logs
journalctl -u nginx -f
```

**Performance Monitoring**:
```sh
# CPU and memory usage
htop

# Disk usage
df -h

# Network connections
netstat -tulpn | grep :3000
```

### Backup and Recovery

**Application Backup**:
```sh
# Backup application files
tar -czf audiobook-wishlist-backup.tar.gz \
  /home/audiobook/audiobook-wishlist-manager \
  --exclude=node_modules \
  --exclude=.git
```

**Database Recovery**:
```sh
# Restore from backup
cp /path/to/backup/audiobook-wishlist-backup.db /path/to/audiobook-wishlist.db

# Verify database integrity
sqlite3 /path/to/audiobook-wishlist.db "PRAGMA integrity_check;"
```

## Security Considerations

1. **HTTPS**: Always use HTTPS in production
2. **Firewall**: Configure firewall to only allow necessary ports
3. **Updates**: Keep Node.js and dependencies updated
4. **Backups**: Regular automated backups
5. **Monitoring**: Set up monitoring and alerting
6. **Access Control**: Limit server access to authorized users only

For additional help, check the main [README.md](README.md) or create an issue on GitHub.