FROM oven/bun:1.3.10 AS base
WORKDIR /app

COPY package.json tsconfig.json ./
COPY prisma ./prisma
COPY src ./src

RUN bun install
RUN bunx prisma generate
RUN bun build src/index.ts --outdir dist --target bun

EXPOSE 3001
CMD ["bun", "run", "dist/index.js"]
