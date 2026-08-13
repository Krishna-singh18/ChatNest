# Use official Node.js lightweight image
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package.json and install dependencies
COPY package*.json ./
RUN npm ci

# Copy the rest of the application code
COPY . .

# Build the Next.js application
RUN npm run build

# Start a new lightweight stage for production
FROM node:20-alpine AS runner

WORKDIR /app

# Copy only the necessary files from the builder stage
COPY --from=builder /app/package.json .
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next

# Expose Next.js port
EXPOSE 3000

# Set environment variable for production
ENV NODE_ENV=production

# Run the Next.js production server
CMD ["npm", "start"]
