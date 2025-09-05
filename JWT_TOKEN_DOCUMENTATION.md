# JWT Token Management - ASP Cranes CRM

## Overview
Fresh JWT tokens have been generated and implemented across the ASP Cranes CRM system with automatic refresh capabilities and enhanced security.

## Token Configuration

### Generated Tokens
- **Generated on**: $(date)
- **JWT Secret Length**: 88 characters (Base64 encoded 64 bytes)
- **Refresh Secret Length**: 88 characters (Base64 encoded 64 bytes)  
- **Session Secret Length**: 44 characters (Base64 encoded 32 bytes)

### Token Expiry Settings
- **Access Token**: 15 minutes
- **Refresh Token**: 7 days
- **Refresh Threshold**: 5 minutes before expiry
- **Auto-refresh Interval**: 13 minutes (client-side)

## Security Features

### 🔒 Authentication Security
- **JWT-based authentication** with secure, randomly generated secrets
- **Refresh token rotation** for enhanced security
- **HTTP-only cookies** for token storage (server-side)
- **Rate limiting** on authentication endpoints
- **CSRF protection** with security headers

### 🔄 Automatic Token Refresh
- **Client-side auto-refresh** every 13 minutes
- **Proactive token renewal** 5 minutes before expiry
- **Silent refresh** without user interruption
- **Multi-tab synchronization** via localStorage events
- **Graceful failure handling** with automatic logout

### 🛡️ Production Security
- **All development bypasses removed**
- **Secure cookie configuration** (HTTPS-only in production)
- **SameSite cookie protection**
- **Comprehensive audit logging**
- **Failed authentication tracking**

## Implementation Details

### Backend Services
1. **JWT Service** (`jwtService.ts`)
   - Token generation and validation
   - Expiry calculation and management
   - Cookie handling utilities

2. **Token Routes** (`tokenRoutes.ts`)
   - `/api/auth/refresh` - Token refresh endpoint
   - `/api/auth/token-info` - Token information endpoint

3. **Authentication Middleware** (`authMiddleware.ts`)
   - Request authentication validation
   - Role-based access control
   - Security logging

### Frontend Services
1. **Token Manager** (`tokenManager.ts`)
   - Automatic refresh scheduling
   - Token validation and renewal
   - Multi-tab synchronization
   - Error handling and recovery

2. **Enhanced Auth Store** (`enhancedAuthStore.ts`)
   - State management with persistence
   - Integration with token manager
   - User session handling

## Docker Deployment

### Environment Configuration
All Docker containers are configured with the new JWT tokens:

```yaml
environment:
  JWT_SECRET: [SECURE_TOKEN]
  JWT_REFRESH_SECRET: [SECURE_REFRESH_TOKEN]
  SESSION_SECRET: [SECURE_SESSION_TOKEN]
  JWT_ACCESS_TOKEN_EXPIRY: 15m
  JWT_REFRESH_TOKEN_EXPIRY: 7d
```

### Health Checks
- **JWT Health Check Script** validates token generation
- **Token endpoint monitoring** ensures refresh functionality
- **Environment variable validation** confirms proper configuration

## API Endpoints

### Authentication Endpoints
- `POST /api/auth/login` - User login with token generation
- `POST /api/auth/refresh` - Token refresh using refresh token
- `POST /api/auth/logout` - Secure logout with cookie cleanup
- `GET /api/auth/token-info` - Current token information

### Protected Endpoints
All sensitive endpoints now require valid JWT authentication:
- `/api/leads/*` - Lead management
- `/api/ai/*` - AI system access
- `/api/quotations/*` - Quotation generation
- `/api/jobs/*` - Job scheduling
- `/api/users/*` - User management

## Token Refresh Flow

### Client-Side Process
1. **Initial Login**: User receives access + refresh tokens
2. **Auto-monitoring**: Token manager monitors expiry
3. **Proactive Refresh**: Refresh triggered 5 minutes before expiry
4. **Silent Update**: New tokens stored without user interaction
5. **Error Handling**: Failed refresh triggers logout flow

### Server-Side Process
1. **Refresh Request**: Client sends refresh token in HTTP-only cookie
2. **Token Validation**: Server verifies refresh token signature
3. **New Token Generation**: Fresh access token created
4. **Secure Response**: New tokens set in HTTP-only cookies
5. **Audit Logging**: Refresh event logged for security

## Security Best Practices

### ✅ Implemented
- Cryptographically secure token generation
- Short-lived access tokens (15 minutes)
- Long-lived refresh tokens (7 days) with rotation
- HTTP-only cookie storage
- CSRF protection headers
- Rate limiting on auth endpoints
- Comprehensive audit logging
- All development bypasses removed

### 🔧 Production Recommendations
1. **SSL/TLS**: Enable HTTPS for secure cookie transmission
2. **Cookie Security**: Set `Secure` flag in production
3. **Token Rotation**: Implement refresh token rotation policy
4. **Monitoring**: Set up failed authentication alerts
5. **Backup**: Regular backup of user authentication data

## Token Generation Scripts

### Automatic Generation
- **PowerShell**: `generate_jwt_tokens.ps1` (Windows)
- **Bash**: `generate_jwt_tokens.sh` (Linux/macOS)
- **Health Check**: `jwt_health_check.sh` (Validation)

### Manual Generation
```bash
# Generate new JWT secret (64 bytes)
node -e "console.log(require('crypto').randomBytes(64).toString('base64'))"

# Generate new refresh secret (64 bytes)
node -e "console.log(require('crypto').randomBytes(64).toString('base64'))"

# Generate new session secret (32 bytes)
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

## Deployment Checklist

### Pre-Deployment
- [ ] New JWT tokens generated and applied
- [ ] All environment files updated
- [ ] Docker Compose configuration verified
- [ ] Health checks passing
- [ ] Development bypasses removed

### Post-Deployment
- [ ] Token refresh endpoints responding
- [ ] Client-side auto-refresh working
- [ ] Multi-tab synchronization functional
- [ ] Failed authentication handling tested
- [ ] Audit logs capturing events

### Monitoring
- [ ] Token refresh success rate
- [ ] Failed authentication attempts
- [ ] Token expiry patterns
- [ ] System performance impact
- [ ] User session behavior

## Troubleshooting

### Common Issues
1. **Token Refresh Fails**: Check refresh token cookie presence
2. **Auto-logout Occurring**: Verify refresh endpoint availability  
3. **Multi-tab Issues**: Check localStorage event handling
4. **Docker Auth Errors**: Validate environment variable injection

### Debug Information
- Enable debug logging in development
- Monitor network requests for auth endpoints
- Check browser developer tools for cookie issues
- Verify JWT token structure and expiry

## Security Incident Response

### Suspected Token Compromise
1. **Immediate**: Rotate all JWT secrets
2. **Invalidate**: Clear all user sessions
3. **Audit**: Review authentication logs
4. **Notify**: Alert affected users
5. **Monitor**: Watch for suspicious activity

### Recovery Process
1. Generate new JWT secrets using provided scripts
2. Deploy updated configuration to all services
3. Force user re-authentication
4. Monitor system for stability
5. Document incident and lessons learned

---

**Note**: This system implements enterprise-level JWT token security with automatic refresh capabilities. All development authentication bypasses have been completely removed for production security.
