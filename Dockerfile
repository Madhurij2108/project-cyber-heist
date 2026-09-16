FROM node:22-alpine

WORKDIR /app

# Install curl for container health checks
RUN apk add --no-cache curl

# Install app dependencies
COPY package.json ./
RUN npm install

# Copy source code and configuration
COPY tsconfig.json ./
COPY src/ ./src/

# Compile TypeScript
RUN npm run build

# Expose fixed internal container API port
EXPOSE 8000

ENV PORT=8000
ENV NODE_ENV=production

HEALTHCHECK --interval=10s --timeout=5s --retries=3 CMD curl -f http://127.0.0.1:8000/health || exit 1

CMD ["node", "dist/index.js"]
