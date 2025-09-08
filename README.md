# Uplift Plan Management System

A comprehensive NestJS-based plan management system with IELTS Writing Assessment, user authentication, and role-based access control.

## Features

### Core Features

- **Plan Management**: Create, read, update, and delete subscription plans
- **User Plan Tracking**: Track user trial counts and paid plan status
- **IELTS Writing Assessment**: AI-powered writing task evaluation and feedback
- **User Authentication**: JWT-based authentication with role-based access control
- **Admin Panel**: Administrative functions for user and content management

### Technical Features

- **RESTful API**: Complete REST API with Swagger documentation
- **MongoDB Integration**: Uses Mongoose for database operations
- **Authentication**: JWT tokens with passport.js
- **Authorization**: Role-based access control (USER, ADMIN, SUPER_ADMIN)
- **Validation**: Request validation using class-validator
- **TypeScript**: Fully typed application
- **Swagger Documentation**: Interactive API documentation

## Project Structure

```
src/
├── auth/                    # Authentication module
│   ├── decorators/         # Role decorators
│   ├── guards/             # JWT and role guards
│   ├── strategies/         # Passport strategies
│   └── auth.module.ts      # Auth module configuration
├── users/                  # User management module
│   ├── dto/                # User DTOs
│   ├── schemas/            # User MongoDB schemas
│   ├── user.controller.ts  # User endpoints
│   ├── user.service.ts     # User business logic
│   └── user.module.ts      # User module configuration
├── plan/                   # Plan management module
│   ├── dto/                # Plan DTOs
│   ├── schemas/            # Plan MongoDB schemas
│   ├── plan.controller.ts  # Plan endpoints
│   ├── plan.service.ts     # Plan business logic
│   └── plan.module.ts      # Plan module configuration
├── user-plan/              # User plan tracking module
│   ├── dto/                # User plan DTOs
│   ├── schemas/            # User plan MongoDB schemas
│   ├── user-plan.controller.ts  # User plan endpoints
│   ├── user-plan.service.ts     # User plan business logic
│   └── user-plan.module.ts      # User plan module configuration
├── ielts/                  # IELTS assessment module
│   ├── writing/            # Writing tasks
│   ├── writing-submission/ # Writing submissions and AI analysis
│   └── ielts.module.ts     # IELTS module configuration
├── types/                  # TypeScript type definitions
├── enums/                  # Application enums
├── app.module.ts           # Main application module
└── main.ts                 # Application bootstrap
```

## Installation

1. **Install dependencies:**

```bash
npm install
```

2. **Set up environment variables:**

```bash
cp .env.example .env
```

3. **Configure environment variables in `.env`:**

```env
# Database Configuration
MONGODB_URI=mongodb://localhost:27017/uplift-plan

# Server Configuration
PORT=3000
NODE_ENV=development

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# AI Service Configuration
GEMINI_API_KEY=your-gemini-api-key-here
```

4. **Start MongoDB** (make sure MongoDB is running on your system)

5. **Run the application:**

```bash
# Development
npm run start:dev

# Production
npm run build
npm run start:prod
```

## API Documentation

Once the application is running, visit:

- **API**: http://localhost:3000
- **Swagger Documentation**: http://localhost:3000/api

## API Endpoints

### Authentication & Users

- `POST /users/register` - Register a new user
- `POST /users/login` - User login
- `GET /users/profile` - Get current user profile (Auth required)
- `PATCH /users/profile` - Update current user profile (Auth required)
- `PATCH /users/change-password` - Change user password (Auth required)
- `GET /users` - Get all users (Admin only)
- `GET /users/:id` - Get user by ID (Admin only)
- `PATCH /users/:id` - Update user (Admin only)
- `DELETE /users/:id` - Delete user (Super Admin only)

### Plans

- `GET /plans` - Get all plans
- `POST /plans` - Create a new plan
- `GET /plans/:id` - Get plan by ID
- `PATCH /plans/:id` - Update plan
- `DELETE /plans/:id` - Delete plan

### User Plans

- `GET /user-plans` - Get all user plans
- `POST /user-plans` - Create a new user plan
- `GET /user-plans/:id` - Get user plan by ID
- `GET /user-plans/user/:id/balance` - Get user balance
- `PATCH /user-plans/:id` - Update user plan
- `DELETE /user-plans/:id` - Delete user plan

### IELTS Writing Tasks

- `GET /ielts-writing` - Get all writing tasks
- `POST /ielts-writing` - Create a new writing task
- `GET /ielts-writing/:id` - Get writing task by ID
- `PATCH /ielts-writing/:id` - Update writing task
- `DELETE /ielts-writing/:id` - Delete writing task

### IELTS Writing Submissions

- `POST /ielts-writing-submission` - Create a new submission (Auth required)
- `GET /ielts-writing-submission/my-submissions` - Get user's submissions (Auth required)
- `GET /ielts-writing-submission` - Get all submissions (Admin only)
- `GET /ielts-writing-submission/:id` - Get submission by ID
- `PATCH /ielts-writing-submission/:id` - Update submission
- `DELETE /ielts-writing-submission/:id` - Delete submission

### AI Analysis

- `POST /ielts-ai/analyze/:id` - Analyze writing submission with AI

## User Roles

### USER

- Register and login
- View and update own profile
- Create IELTS writing submissions
- View own submissions
- Change password

### ADMIN

- All USER permissions
- View all users
- View all submissions
- Manage plans and user plans
- Manage IELTS writing tasks

### SUPER_ADMIN

- All ADMIN permissions
- Delete users
- Full system access

## Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Environment Variables

- `MONGODB_URI`: MongoDB connection string
- `PORT`: Server port (default: 3000)
- `NODE_ENV`: Environment (development/production)
- `JWT_SECRET`: Secret key for JWT token signing
- `GEMINI_API_KEY`: Google Gemini API key for AI analysis

## Technologies Used

- **NestJS**: Node.js framework
- **MongoDB**: Database
- **Mongoose**: MongoDB ODM
- **JWT**: Authentication tokens
- **Passport.js**: Authentication middleware
- **bcrypt**: Password hashing
- **Swagger**: API documentation
- **class-validator**: Request validation
- **TypeScript**: Programming language
- **Google Gemini AI**: AI-powered writing analysis

## Getting Started

1. **Register a user:**

```bash
curl -X POST http://localhost:3000/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123",
    "firstName": "John",
    "lastName": "Doe"
  }'
```

2. **Login:**

```bash
curl -X POST http://localhost:3000/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

3. **Create an IELTS writing submission:**

```bash
curl -X POST http://localhost:3000/ielts-writing-submission \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-jwt-token>" \
  -d '{
    "body": "This is my essay about technology...",
    "topic": "CUSTOM",
    "customWritingQuestion": "Discuss the impact of technology on education",
    "targetScore": "BAND_SEVEN"
  }'
```

## Development

```bash
# Install dependencies
npm install

# Run in development mode
npm run start:dev

# Build for production
npm run build

# Run tests
npm run test

# Lint code
npm run lint
```
