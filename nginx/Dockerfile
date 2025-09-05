FROM nginx:alpine

# Install openssl for SSL if needed
RUN apk add --no-cache openssl

# Copy nginx configuration
COPY nginx.prod.conf /etc/nginx/nginx.conf

# Create SSL directory
RUN mkdir -p /etc/nginx/ssl

# Copy SSL certificates if they exist, otherwise create self-signed
RUN if [ -d "./ssl" ]; then \
      cp -r ./ssl/* /etc/nginx/ssl/ 2>/dev/null || true; \
    else \
      openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout /etc/nginx/ssl/nginx.key \
        -out /etc/nginx/ssl/nginx.crt \
        -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"; \
    fi

# Create log directory
RUN mkdir -p /var/log/nginx

# Expose both HTTP and HTTPS
EXPOSE 80 443

CMD ["nginx", "-g", "daemon off;"]
