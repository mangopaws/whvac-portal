# Stage 1: Install dependencies
FROM node:20-alpine AS deps
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --frozen-lockfile

# Stage 2: Build
FROM node:20-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Create the data directory so better-sqlite3 can open the DB file during
# `next build` (Next.js evaluates every route module at build time to collect
# page data). The real database volume is mounted at runtime; this just
# satisfies the directory-existence check in openDatabase().
RUN mkdir -p /app/data

RUN npm run build

# Stage 3: Production runner
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3002
ENV HOSTNAME=0.0.0.0

# Create non-root user
RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

# Create data directory for SQLite and empty .env for Next.js disk read
RUN mkdir -p /app/data && chown nextjs:nodejs /app/data \
  && touch /app/.env && chown nextjs:nodejs /app/.env

# Copy standalone output
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

USER nextjs

EXPOSE 3002

CMD ["node", "server.js"]
