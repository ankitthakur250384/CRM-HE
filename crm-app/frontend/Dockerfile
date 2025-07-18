FROM node:18-alpine
WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm install --unsafe-perm

# Ensure node_modules/.bin is in PATH
ENV PATH="/app/node_modules/.bin:${PATH}"

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Expose port
EXPOSE 3000

# Start the server
CMD ["npm", "run", "preview"]
