# Security Enhancement Dependencies Installation Guide

## Backend Dependencies

Run these commands in the backend directory:

```bash
cd crm-app/backend

# Core security packages
npm install express-rate-limit
npm install helmet
npm install cors
npm install cookie-parser

# MFA and encryption
npm install speakeasy
npm install qrcode
npm install crypto

# Additional security utilities
npm install validator
npm install express-validator
npm install morgan

# TypeScript support
npm install --save-dev @types/speakeasy
npm install --save-dev @types/qrcode
npm install --save-dev @types/express-rate-limit
npm install --save-dev @types/validator
```

## Frontend Dependencies

Run these commands in the frontend directory:

```bash
cd crm-app/frontend

# QR Code display for MFA
npm install qrcode.react
npm install @types/qrcode.react

# Enhanced form validation
npm install react-hook-form
npm install @hookform/resolvers
npm install yup

# Security utilities
npm install crypto-js
npm install @types/crypto-js
```

## Environment Variables Setup

Add these to your `.env` files:

### Backend `.env`:
```env
# JWT Configuration
JWT_SECRET=your-super-secure-jwt-secret-key-minimum-32-characters
REFRESH_TOKEN_SECRET=your-super-secure-refresh-token-secret-different-from-jwt

# Security Settings
NODE_ENV=production
VERIFY_USER_ON_EACH_REQUEST=false
AI_MAX_REQUESTS_PER_MINUTE=60

# CrewAI Configuration (Already existing)
CREWAI_API_ENDPOINT=https://asp-cranes-ai-sales-chatbot-v1-19ac7cde-f23-cb712937.crewai.com
CREWAI_API_KEY=323534e6cfe2

# CORS Configuration
FRONTEND_URL=http://localhost:5173
ALLOWED_ORIGINS=http://localhost:5173,https://yourdomain.com

# Session Configuration
SESSION_SECRET=your-session-secret-key
COOKIE_SECURE=false  # Set to true in production with HTTPS
```

### Frontend `.env`:
```env
# API Configuration
VITE_API_URL=http://localhost:3000/api

# Security Settings
VITE_ENABLE_HTTPS=false  # Set to true in production
VITE_APP_NAME=ASP Cranes CRM
```
