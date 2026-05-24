# ── Build stage ───────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma
RUN npm ci
RUN npx prisma generate

COPY . .

# Bake the Clerk publishable key into the frontend bundle at build time
ARG VITE_CLERK_PUBLISHABLE_KEY
ENV VITE_CLERK_PUBLISHABLE_KEY=$VITE_CLERK_PUBLISHABLE_KEY
RUN npm run build

# ── Run stage ─────────────────────────────────────────────────────────────────
FROM node:20-alpine
WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma
RUN npm ci --omit=dev
RUN npx prisma generate

COPY server ./server
COPY --from=builder /app/dist ./dist

ENV NODE_ENV=production
EXPOSE 3001

# Push schema on first boot, then start the server
CMD ["sh", "-c", "npx prisma db push --accept-data-loss && node server/index.js"]
