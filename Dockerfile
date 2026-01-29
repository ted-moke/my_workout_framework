# Multi-stage build for full application

# Stage 1: Build client
FROM node:20-alpine AS client-builder
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci
COPY client/ ./
RUN npm run build

# Stage 2: Build server
FROM node:20-alpine AS server-builder
WORKDIR /app/server
COPY server/package*.json ./
RUN npm ci
COPY server/ ./
RUN npm run build

# Stage 3: Production image
FROM node:20-alpine AS production
WORKDIR /app

# Copy server package files and install production dependencies
COPY server/package*.json ./server/
RUN cd server && npm ci --only=production

# Copy built server
COPY --from=server-builder /app/server/dist ./server/dist

# Copy built client
COPY --from=client-builder /app/client/dist ./client/dist

WORKDIR /app/server

ENV NODE_ENV=production
EXPOSE 3001

CMD ["node", "dist/index.js"]
