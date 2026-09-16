FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY server/package*.json ./server/
COPY client/package*.json ./client/
RUN npm install
COPY . .
RUN npm run build:client

FROM nginx:alpine AS runner
COPY --from=builder /app/client/dist /usr/share/nginx/html
COPY client/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 3000
HEALTHCHECK --interval=5s --timeout=5s --retries=5 --start-period=5s \
  CMD wget -qO- http://127.0.0.1:3000/health || exit 1
CMD ["nginx", "-g", "daemon off;"]
