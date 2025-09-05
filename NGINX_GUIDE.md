# Nginx Configuration Guide

## 🎯 **Unified Nginx Setup**

We've consolidated the nginx configuration to eliminate duplication and provide a production-ready setup that works for both development and production.

## 📁 **New Structure**

```
nginx/
├── Dockerfile          # Nginx container build
├── nginx.conf          # Unified configuration
├── nginx.prod.conf     # Legacy production config (for reference)
└── ssl/
    ├── README.md       # SSL setup instructions
    ├── nginx.crt       # SSL certificate (auto-generated for dev)
    └── nginx.key       # SSL private key (auto-generated for dev)
```

## 🚀 **Features**

### **Development Mode**
- **Self-signed SSL certificates** automatically generated
- **HTTPS redirect** from HTTP (port 80 → 443)
- **WebSocket support** for Vite HMR
- **Rate limiting** for API protection
- **Health check** endpoints

### **Production Mode**
- **Production SSL** certificates (place in `ssl/` directory)
- **Security headers** (HSTS, CSP, XSS protection)
- **GZIP compression** for performance
- **Advanced rate limiting**
- **Static asset caching**

## 🛠️ **Usage**

### **Start Development Environment**
```bash
docker-compose up -d
```

### **Access Application**
- **HTTPS**: https://localhost (recommended)
- **HTTP**: http://localhost (redirects to HTTPS)

### **Health Check**
- **URL**: https://localhost/health
- **Response**: `healthy`

## 🔒 **SSL Configuration**

### **Development (Automatic)**
- Self-signed certificates generated automatically
- No manual setup required
- Browser will show security warning (normal for self-signed)

### **Production**
1. Place your SSL certificates in `nginx/ssl/`:
   ```
   nginx/ssl/
   ├── nginx.crt    # Your SSL certificate
   └── nginx.key    # Your private key
   ```

2. Update domain in `nginx.conf`:
   ```nginx
   server_name your-domain.com *.your-domain.com;
   ```

## 🔧 **Rate Limiting**

- **API endpoints**: 10 requests/second (burst: 20)
- **Auth endpoints**: 5 requests/minute (burst: 5)
- **Static files**: No rate limiting

## 📊 **Monitoring**

### **Logs**
- **Access logs**: `/var/log/nginx/access.log`
- **Error logs**: `/var/log/nginx/error.log`

### **Health Check**
```bash
curl -k https://localhost/health
# Response: healthy
```

## 🚨 **Security Features**

1. **HTTPS enforcement** with automatic HTTP redirect
2. **Security headers**: HSTS, CSP, X-Frame-Options
3. **Rate limiting** on API and auth endpoints
4. **Modern SSL/TLS** configuration (TLS 1.2+)
5. **GZIP compression** enabled
6. **Static asset caching** for performance

## 🔄 **Migration Notes**

**What Changed:**
- ❌ Removed duplicate `crm-app/nginx/` configuration
- ✅ Unified configuration in `nginx/` directory
- ✅ Added SSL support for both dev and production
- ✅ Enhanced security headers and rate limiting
- ✅ Docker Compose now uses production-ready nginx

**Breaking Changes:**
- Application now runs on **HTTPS by default**
- **Port 443** is now exposed for SSL
- **Self-signed certificates** for development (browser warnings expected)

## 🎉 **Benefits**

1. **Single source of truth** for nginx configuration
2. **Production-ready** security out of the box
3. **Automatic SSL** setup for development
4. **Consistent behavior** across environments
5. **Enhanced performance** with caching and compression
