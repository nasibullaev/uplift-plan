# Uplift Plan API

A comprehensive NestJS backend application for IELTS learning platform with AI-powered writing assessment and payment processing.

## 🚀 Features

- **User Management**: Registration, authentication, and profile management
- **IELTS Writing Assessment**: AI-powered essay analysis using Google Gemini
- **Plan Management**: Subscription plans and user plan assignments
- **Payment Processing**: Payme payment gateway integration
- **Order Management**: Order creation and transaction handling
- **RESTful API**: Well-documented API with Swagger documentation

## 🛠️ Tech Stack

- **Framework**: NestJS (Node.js)
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT with Passport
- **AI Integration**: Google Generative AI (Gemini)
- **Payment**: Payme payment gateway
- **Documentation**: Swagger/OpenAPI
- **Validation**: Class Validator
- **Testing**: Jest

## 📋 Prerequisites

- Node.js (v18 or higher)
- MongoDB
- npm or yarn

## 🔧 Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd uplift-plan
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env` file in the root directory:

   ```env
   MONGODB_URI=mongodb://localhost:27017/uplift-plan
   JWT_SECRET=your-jwt-secret
   GEMINI_API_KEY=your-gemini-api-key
   PAYME_MERCHANT_ID=your-payme-merchant-id
   PAYME_KEY=your-payme-key
   ```

4. **Start the application**

   ```bash
   # Development
   npm run start:dev

   # Production
   npm run build:prod
   ```

## 📚 API Documentation

Once the server is running, visit:

- **Swagger UI**: `http://localhost:4000/docs`
- **API Base URL**: `http://localhost:4000`

## 🏗️ Project Structure

```
src/
├── auth/           # Authentication & authorization
├── ielts/          # IELTS writing assessment
├── orders/         # Order management
├── payment/        # Payment processing
├── plan/           # Subscription plans
├── transactions/   # Transaction handling
├── user-plan/      # User plan assignments
├── users/          # User management
└── main.ts         # Application entry point
```

## 📝 Available Scripts

- `npm run start:dev` - Start development server with hot reload
- `npm run build` - Build the application
- `npm run start:prod` - Start production server
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier

Built with ❤️ using NestJS
