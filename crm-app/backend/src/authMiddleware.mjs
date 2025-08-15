import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-here';

export const authenticateToken = (req, res, next) => {
  // Skip authentication check if bypass header is present (for testing purposes)
  if (
    req.headers['x-bypass-auth'] === 'development-only-123' ||
    req.headers['x-bypass-auth'] === 'true'
  ) {
    console.log('⚠️ [AUTH] Bypassing authentication with x-bypass-auth header');
    req.user = { id: 'usr_test001', email: 'test@aspcranes.com', role: 'sales_agent' };
    return next();
  }

  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  // Debug logging for authentication
  console.log('🔒 [AUTH] Incoming request:', req.method, req.originalUrl);
  console.log('🔒 [AUTH] Authorization header:', authHeader);
  console.log('🔒 [AUTH] Token:', token);

  if (!token) {
    console.warn('🔒 [AUTH] No token provided. Rejecting request.');
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    console.log('🔒 [AUTH] Token verified. User:', decoded);
    next();
  } catch (error) {
    console.error('🔒 [AUTH] Token verification failed:', error.message);
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

export const optionalAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
    } catch (error) {
      // Token is invalid but we continue without user
      req.user = null;
    }
  }
  next();
};

export default authenticateToken;
