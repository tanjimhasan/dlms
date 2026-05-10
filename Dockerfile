FROM node:20-alpine AS base

# Install openssl for Prisma (needed in all stages that use Prisma)
RUN apk add --no-cache openssl

FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Remove the dummy DATABASE_URL - it's not needed for prisma generate!
# prisma generate only reads the schema file, doesn't need database connection

# Generate Prisma client
RUN npx prisma generate

# Build Next.js
RUN npm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=4001
ENV HOSTNAME="0.0.0.0"

# openssl already installed from base stage

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy standalone output
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Copy prisma files for migrations
COPY --from=builder /app/prisma ./prisma

# Copy Prisma client and engine files
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Only copy prisma binary if needed for migrations
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma

# Remove this line unless you actually have this directory
# COPY --from=builder /app/src/generated ./src/generated

USER nextjs
EXPOSE 4001  # Match your PORT environment variable

# DATABASE_URL will be provided by Dokploy at runtime
CMD ["sh", "-c", "npx prisma migrate deploy && node server.js"]