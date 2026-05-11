FROM node:22-alpine AS base
RUN apk add --no-cache openssl

FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma client
RUN DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy" npx prisma generate

# Build Next.js
RUN DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy" npm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=4000
ENV HOSTNAME="0.0.0.0"

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy standalone Next.js output
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Copy prisma config + schema + migrations
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts
COPY --from=builder /app/src/generated ./src/generated

# Install prisma CLI + dotenv (needed for migrate deploy at runtime via prisma.config.ts)
RUN npm install prisma@7 dotenv --omit=dev

RUN chown -R nextjs:nodejs /app

USER nextjs
EXPOSE 4000

CMD ["sh", "-c", "npx prisma migrate deploy && node server.js"]