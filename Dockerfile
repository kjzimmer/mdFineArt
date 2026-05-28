# Build trigger v2
FROM node:20-slim

RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files first for better layer caching
COPY package*.json ./
COPY client/package.json client/package-lock.json* ./client/
COPY server/package.json server/package-lock.json* ./server/

RUN npm ci

# Copy source
COPY . .

# Build (prisma generate + vite + tsc)
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
