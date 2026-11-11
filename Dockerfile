FROM node:22-bookworm-slim

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY ./prisma .
RUN npx prisma generate

COPY . .
RUN npx tsc
RUN npm prune --omit=dev

EXPOSE 8000

CMD ["node", "dist/index.js"]