# Use Node.js 20 (LTS) base image
FROM node:20

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
