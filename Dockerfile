# Multi-stage Dockerfile for full Project Cyber Heist application
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
COPY server/package*.json ./server/
COPY client/package*.json ./client/
RUN npm install

COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8000
ENV API_PORT=8000

COPY package*.json ./
COPY server/package*.json ./server/
COPY client/package*.json ./client/
RUN npm install --omit=dev --workspace=server

COPY --from=builder /app/server/dist ./server/dist
COPY --from=builder /app/client/dist ./client/dist

EXPOSE 8000

HEALTHCHECK --interval=5s --timeout=5s --retries=5 --start-period=5s \
  CMD wget -qO- http://127.0.0.1:8000/health || exit 1

CMD ["node", "server/dist/index.js"]
