FROM node:18
WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm install --unsafe-perm \
    && chmod +x node_modules/.bin/vite \
    && ls -l node_modules/.bin \
    && cat node_modules/.bin/vite

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
