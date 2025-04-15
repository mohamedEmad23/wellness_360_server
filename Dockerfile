# Use Node.js 20 (LTS) base image
FROM node:23-slim@sha256:dfb18d8011c0b3a112214a32e772d9c6752131ffee512e974e59367e46fcee52

# Set working directory
WORKDIR /app

# Copy dependency files first
COPY package*.json ./

# Install all dependencies (including dev for build phase)
RUN npm install

# Copy project files
COPY . .

# Build the TypeScript app
RUN npm run build

# Expose app port
EXPOSE 3000

# Run in production
CMD ["npm", "run", "start:prod"]
