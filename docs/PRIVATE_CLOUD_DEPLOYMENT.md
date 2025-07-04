# ASP Cranes CRM - Private Cloud Deployment Guide

This guide provides instructions for deploying the ASP Cranes CRM application to a private cloud environment. These instructions ensure that the application is deployed securely with proper authentication and configuration.

## Prerequisites

Before deploying, ensure you have:

- Node.js v16+ and npm v8+ installed on your build machine
- Access to your private cloud environment with administrative privileges
- HTTPS certificates for your domain
- Database server (PostgreSQL)
- Proper network security configurations in place

## Environment Variables

The following environment variables must be set in your private cloud environment:

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode (must be "production") | `production` |
| `API_URL` | URL to your API backend | `https://api.yourcompany.com` |
| `JWT_SECRET` | Secret key for JWT token signing (min 32 chars) | `your-very-long-and-secure-random-string` |
| `DB_CONNECTION_STRING` | PostgreSQL connection string | `postgresql://user:pass@dbhost:5432/dbname` |
| `PORT` | Port to run the server (optional) | `8080` |

## Build Process

To build the application for production deployment, follow these steps:

1. Clone the repository
   ```
   git clone https://your-repo-url.git
   cd bolt-asp-crm
   ```

2. Install dependencies
   ```
   npm ci
   ```

3. Set required environment variables
   ```
   export NODE_ENV=production
   export API_URL=https://your-api-url
   export JWT_SECRET=your-secure-jwt-secret
   ```

4. Build for production
   ```
   npm run build:prod
   ```

5. Create deployment package
   ```
   npm run deploy:cloud
   ```

## Deployment Steps

### Option 1: Using the Deployment Script

The simplest approach is to use our deployment script which handles validation and packaging:

```bash
npm run deploy:cloud
```

This creates a `deploy` folder with everything needed for deployment.

### Option 2: Manual Deployment

If you prefer manual deployment:

1. Build the application
   ```
   NODE_ENV=production npm run build
   ```

2. Copy the contents of the `dist` directory to your web server

3. Configure your web server (see below)

## Web Server Configuration

### Nginx Configuration

```nginx
server {
    listen 80;
    server_name crm.yourcompany.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name crm.yourcompany.com;

    # SSL configuration
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_ciphers 'ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384';
    
    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self'; connect-src 'self' https://api.yourcompany.com; img-src 'self' data:; style-src 'self' 'unsafe-inline';" always;
    
    # Root directory
    root /var/www/crm/dist;
    index index.html;
    
    # Handle SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # API proxy
    location /api/ {
        proxy_pass https://api.yourcompany.com/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires max;
        add_header Cache-Control "public, max-age=31536000";
        log_not_found off;
    }
}
```

### Apache Configuration

```apache
<VirtualHost *:80>
    ServerName crm.yourcompany.com
    Redirect permanent / https://crm.yourcompany.com/
</VirtualHost>

<VirtualHost *:443>
    ServerName crm.yourcompany.com
    
    # SSL configuration
    SSLEngine on
    SSLCertificateFile /path/to/cert.pem
    SSLCertificateKeyFile /path/to/key.pem
    SSLProtocol all -SSLv3 -TLSv1 -TLSv1.1
    
    # Security headers
    Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains"
    Header always set X-Content-Type-Options "nosniff"
    Header always set X-Frame-Options "SAMEORIGIN"
    Header always set Content-Security-Policy "default-src 'self'; script-src 'self'; connect-src 'self' https://api.yourcompany.com; img-src 'self' data:; style-src 'self' 'unsafe-inline';"
    
    # Root directory
    DocumentRoot /var/www/crm/dist
    
    # SPA routing
    <Directory "/var/www/crm/dist">
        RewriteEngine On
        RewriteBase /
        RewriteRule ^index\.html$ - [L]
        RewriteCond %{REQUEST_FILENAME} !-f
        RewriteCond %{REQUEST_FILENAME} !-d
        RewriteRule . /index.html [L]
        
        AllowOverride All
        Require all granted
    </Directory>
    
    # API proxy
    ProxyPass /api/ https://api.yourcompany.com/
    ProxyPassReverse /api/ https://api.yourcompany.com/
    
    # Cache static assets
    <FilesMatch "\.(js|css|png|jpg|jpeg|gif|ico|svg)$">
        Header set Cache-Control "max-age=31536000, public"
    </FilesMatch>
</VirtualHost>
```

## Security Considerations

1. **JWT Token Security**:
   - The application uses JWT for authentication
   - Ensure your `JWT_SECRET` is long, complex, and kept secure
   - Tokens expire after 8 hours by default

2. **HTTPS**:
   - Always use HTTPS in production
   - Configure proper TLS/SSL settings
   - Implement HTTP to HTTPS redirection

3. **Database Security**:
   - Use strong database credentials
   - Limit database user permissions
   - Enable database encryption at rest

4. **Development Artifacts**:
   - The build process automatically excludes development artifacts
   - Verify no development tools or bypasses are present in production

5. **Regular Updates**:
   - Keep the application and its dependencies updated
   - Regularly update your server's software

## Post-Deployment Verification

After deployment, verify:

1. The application loads correctly
2. Authentication works properly
3. There are no console errors related to authentication
4. Development tools and bypasses are not accessible
5. API calls function correctly

## Troubleshooting

If you encounter issues:

1. **Authentication Failures**:
   - Check that `JWT_SECRET` is correctly set
   - Ensure API endpoints are properly configured

2. **API Connection Issues**:
   - Verify the `API_URL` is correctly set
   - Check network connectivity and firewall rules

3. **Missing Static Assets**:
   - Ensure all files were copied to the server
   - Check web server configuration for static file serving

4. **Blank Screen / JavaScript Errors**:
   - Check browser console for errors
   - Verify all required assets are loading correctly

For additional support, contact your system administrator or the development team.

---

© ASP Cranes CRM - Confidential
