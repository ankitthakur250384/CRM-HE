FROM node:18-alpine
WORKDIR /app

# Install dependencies needed for native modules and wget for health check
RUN apk add --no-cache python3 make g++ wget

# Copy package files
COPY package*.json ./

# Clear npm cache and install dependencies
RUN npm cache clean --force && npm install

# Copy source code
COPY . .

# Copy CrewAI environment file if it exists
COPY .env.crewai* ./

# Expose port
EXPOSE 3001

# Add health check using wget
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/api/health || exit 1

# Start the server
CMD ["npm", "start"]
