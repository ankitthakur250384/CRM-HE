FROM node:18
WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm install --unsafe-perm

# Copy source code
COPY . .

# Set executable permissions for all binaries
RUN chmod -R +x node_modules/.bin

# Ensure node_modules/.bin is in PATH
ENV PATH="/app/node_modules/.bin:${PATH}"

# Build the application using npx to avoid permission issues
RUN npx vite build

# Expose port
EXPOSE 3000

# Start the server
CMD ["npm", "run", "preview"]
