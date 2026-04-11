FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9 --activate
WORKDIR /app

# Copy root workspace files
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml tsconfig.base.json ./

# Copy package manifests
COPY packages/shared/package.json packages/shared/
COPY packages/ui/package.json packages/ui/
COPY apps/api/package.json apps/api/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY packages/shared/ packages/shared/
COPY packages/ui/ packages/ui/
COPY apps/api/ apps/api/

# Generate Prisma client
RUN pnpm --filter api prisma:generate

# Build
RUN pnpm --filter @sivan/shared build 2>/dev/null || true
RUN pnpm --filter api build

# Production stage
FROM node:20-alpine AS production
RUN corepack enable && corepack prepare pnpm@9 --activate
WORKDIR /app

COPY --from=base /app/package.json /app/pnpm-workspace.yaml /app/pnpm-lock.yaml ./
COPY --from=base /app/packages/shared/package.json packages/shared/
COPY --from=base /app/packages/ui/package.json packages/ui/
COPY --from=base /app/apps/api/package.json apps/api/

RUN pnpm install --frozen-lockfile --prod

COPY --from=base /app/packages/shared/ packages/shared/
COPY --from=base /app/apps/api/dist/ apps/api/dist/
COPY --from=base /app/apps/api/prisma/ apps/api/prisma/
COPY --from=base /app/node_modules/.pnpm/@prisma+client*/node_modules/@prisma/client/ node_modules/.pnpm/@prisma+client/node_modules/@prisma/client/ 2>/dev/null || true

EXPOSE ${PORT:-3001}

# Copy Prisma client to production
COPY --from=base /app/apps/api/node_modules/.prisma/ apps/api/node_modules/.prisma/ 2>/dev/null || true
COPY --from=base /app/node_modules/.prisma/ node_modules/.prisma/ 2>/dev/null || true

# Entrypoint: run migrations, seed, then start server
COPY --from=base /app/apps/api/prisma/ apps/api/prisma/
CMD ["sh", "-c", "cd apps/api && npx prisma migrate deploy && (node dist/prisma/seed.js || echo 'Seed skipped or already applied') && node dist/index.js"]
