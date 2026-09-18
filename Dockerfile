FROM node:20-slim AS builder

WORKDIR /app

# Install build dependencies for Prisma and native node modules
RUN apt-get update -y && apt-get install -y openssl ca-certificates python3 make g++ && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install all dependencies
RUN npm ci

# Generate Prisma Client
RUN npx prisma generate

# Copy application source code
COPY . .

# Build Next.js application
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
RUN npm run build

# ----------------------------------------------------
# Production Runner Image
# ----------------------------------------------------
FROM node:20-slim AS runner

WORKDIR /app

# Install OpenSSL runtime required by Prisma Engine
RUN apt-get update -y && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Copy package files and install production dependencies
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci --omit=dev && npx prisma generate

# Copy built application and server scripts from builder
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/src/server ./src/server

# Expose ports: 3000 (Web App POS), 3001 (WhatsApp Daemon)
EXPOSE 3000
EXPOSE 3001

# Start both WhatsApp Baileys Engine and Next.js Server
CMD ["node", "src/server/start-all.js"]
