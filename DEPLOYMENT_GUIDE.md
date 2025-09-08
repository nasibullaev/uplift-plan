# Deployment Guide - Port 4000 Configuration

This guide explains how to deploy your Uplift Plan application on port 4000.

## 🚀 **Port Configuration**

The application is now configured to use different ports based on the environment:

- **Development**: Port 3000 (default)
- **Production**: Port 4000 (when NODE_ENV=production)

## 📋 **Deployment Methods**

### Method 1: Using Environment Variables

```bash
# Set production environment and port
export NODE_ENV=production
export PORT=4000

# Build and start
npm run build
npm run start:prod
```

### Method 2: Using Production Scripts

```bash
# Build and start on port 4000
npm run build:prod

# Or just start on port 4000
npm run start:prod:4000
```

### Method 3: Direct Environment Setting

```bash
# One-liner for production deployment
NODE_ENV=production PORT=4000 npm run start:prod
```

## 🔧 **Environment Configuration**

### Production Environment Variables

Create a `.env.production` file (or set these in your deployment platform):

```env
# Server Configuration
NODE_ENV=production
PORT=4000

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/uplift-plan-prod
# or for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/uplift-plan-prod

# JWT Configuration
JWT_SECRET=your-super-secure-jwt-secret-for-production

# AI Service Configuration
GEMINI_API_KEY=your-gemini-api-key-here
```

## 🌐 **CORS Configuration**

The application now includes port 4000 in CORS origins:

```typescript
origin: [
  "http://localhost:3000", // Development backend
  "http://localhost:4000", // Production backend
  "http://localhost:5173", // Frontend development
  "http://127.0.0.1:3000",
  "http://127.0.0.1:4000",
  "http://127.0.0.1:5173",
  // Add your production domain here
  // "https://yourdomain.com",
];
```

## 🐳 **Docker Deployment**

### Dockerfile Example

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build application
RUN npm run build

# Expose port 4000
EXPOSE 4000

# Set production environment
ENV NODE_ENV=production
ENV PORT=4000

# Start application
CMD ["npm", "run", "start:prod"]
```

### Docker Compose Example

```yaml
version: "3.8"
services:
  app:
    build: .
    ports:
      - "4000:4000"
    environment:
      - NODE_ENV=production
      - PORT=4000
      - MONGODB_URI=mongodb://mongo:27017/uplift-plan-prod
      - JWT_SECRET=your-jwt-secret
      - GEMINI_API_KEY=your-gemini-key
    depends_on:
      - mongo

  mongo:
    image: mongo:latest
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db

volumes:
  mongo_data:
```

## ☁️ **Cloud Platform Deployment**

### Heroku

```bash
# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set PORT=4000
heroku config:set JWT_SECRET=your-secret
heroku config:set GEMINI_API_KEY=your-key

# Deploy
git push heroku main
```

### Railway

```bash
# Set environment variables in Railway dashboard
NODE_ENV=production
PORT=4000
JWT_SECRET=your-secret
GEMINI_API_KEY=your-key

# Deploy
railway deploy
```

### DigitalOcean App Platform

```yaml
# .do/app.yaml
name: uplift-plan
services:
  - name: api
    source_dir: /
    github:
      repo: your-username/uplift-plan
      branch: main
    run_command: npm run start:prod:4000
    environment_slug: node-js
    instance_count: 1
    instance_size_slug: basic-xxs
    envs:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: "4000"
      - key: JWT_SECRET
        value: your-secret
      - key: GEMINI_API_KEY
        value: your-key
```

## 🔍 **Verification**

After deployment, verify the application is running on port 4000:

```bash
# Check if port 4000 is listening
lsof -i :4000

# Test the API
curl http://localhost:4000/api

# Test a specific endpoint
curl http://localhost:4000/auth/login
```

## 📝 **Frontend Configuration**

Update your frontend configuration to point to port 4000 in production:

```javascript
// Frontend API configuration
const API_BASE_URL =
  process.env.NODE_ENV === "production"
    ? "http://yourdomain.com:4000/api" // Production
    : "http://localhost:3000/api"; // Development

// Or use environment variables
const API_BASE_URL =
  process.env.REACT_APP_API_URL || "http://localhost:3000/api";
```

## 🚨 **Important Notes**

1. **Security**: Use strong JWT secrets in production
2. **Database**: Use production MongoDB instance, not local
3. **CORS**: Add your production domain to CORS origins
4. **Environment**: Always set NODE_ENV=production
5. **Port**: Ensure port 4000 is open in your firewall/cloud platform

## 🔧 **Troubleshooting**

### Port Already in Use

```bash
# Kill process on port 4000
lsof -ti:4000 | xargs kill -9
```

### Environment Variables Not Loading

```bash
# Check environment variables
echo $NODE_ENV
echo $PORT
```

### CORS Issues

- Ensure your production domain is added to CORS origins
- Check if credentials are properly configured
- Verify headers are allowed

## 📚 **Additional Resources**

- [NestJS Deployment Guide](https://docs.nestjs.com/recipes/deployment)
- [Node.js Production Best Practices](https://nodejs.org/en/docs/guides/nodejs-docker-webapp/)
- [MongoDB Atlas Setup](https://docs.atlas.mongodb.com/)
