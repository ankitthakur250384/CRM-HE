FROM node:18
WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm install --unsafe-perm \
    && chmod -R +x node_modules/.bin

# Ensure node_modules/.bin is in PATH
ENV PATH="/app/node_modules/.bin:${PATH}"

# Copy source code
COPY . .

# Build the application using npx to avoid permission issues
RUN npx vite build

# Expose port
EXPOSE 3000

# Start the server
CMD ["npm", "run", "preview"]
