# Stage 1: deps
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

# Stage 2: builder
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

# Dummy env vars for build-time page data collection
# (Next.js executes some routes at build; real values come from .env at runtime)
ENV DATABASE_URL=postgresql://dummy:dummy@localhost:5432/dummy
ENV OPENAI_API_KEY=sk-dummy-build-time-key
ENV NEXTAUTH_SECRET=dummy-build-secret-at-least-32-chars-long
ENV NEXTAUTH_URL=http://localhost:3000

RUN npx prisma generate
RUN npm run build

# Stage 3: runner
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
