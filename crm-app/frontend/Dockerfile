FROM node:18-alpine
WORKDIR /app

# Copy package files
COPY package*.json ./

# Clear npm cache and install dependencies
RUN npm cache clean --force && npm install

# Install wget for healthcheck
RUN apk add --no-cache wget

# Copy source code (excluding node_modules)
COPY src ./src
COPY public ./public
COPY index.html ./
COPY vite.config.ts ./
COPY tsconfig*.json ./
COPY tailwind.config.js ./
COPY postcss.config.js ./
COPY .env.production ./

# Build the application with production mode explicitly set
ENV NODE_ENV=production
ENV VITE_NODE_ENV=production
RUN npm run build -- --mode production

# Remove development modules from production build
RUN find /app/dist -name "*devLogin*" -delete && \
    find /app/dist -name "*authDebug*" -delete && \
    find /app/dist -name "*.js" -exec sed -i 's/devLogin-[A-Za-z0-9]*.js//g' {} \; && \
    find /app/dist -name "*.js" -exec sed -i 's/authDebug-[A-Za-z0-9]*.js//g' {} \; || true

# Expose port
EXPOSE 3000

# Add health check using wget (already installed)
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/ || exit 1

# Start the server using npx to avoid permission issues
CMD ["npx", "vite", "preview", "--host", "0.0.0.0", "--port", "3000"]
