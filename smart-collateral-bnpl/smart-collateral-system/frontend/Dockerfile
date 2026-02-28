# Dockerfile for Next.js Frontend
FROM node:20-alpine

# Install system dependencies
RUN apk add --no-cache libc6-compat

WORKDIR /app

# Copy package files
COPY ./frontend/package*.json ./

# Install dependencies
RUN npm install

# Copy frontend source
COPY ./frontend/. .

# Copy artifacts (will be available at /app/artifacts)
COPY ./artifacts ./artifacts

# Expose Next.js port
EXPOSE 3000

# Set environment
ENV NEXT_TELEMETRY_DISABLED 1

# Run dev server (artifacts will be mounted at runtime)
CMD ["npm", "run", "dev", "--", "--hostname", "0.0.0.0"]
