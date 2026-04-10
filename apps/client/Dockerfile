FROM node:20-alpine AS build
RUN corepack enable && corepack prepare pnpm@9 --activate
WORKDIR /app

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml tsconfig.base.json ./
COPY packages/shared/package.json packages/shared/
COPY packages/ui/package.json packages/ui/
COPY apps/client/package.json apps/client/

RUN pnpm install --frozen-lockfile

COPY packages/shared/ packages/shared/
COPY packages/ui/ packages/ui/
COPY apps/client/ apps/client/

ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}

RUN pnpm --filter client build

# Serve with a lightweight server
FROM node:20-alpine AS production
RUN npm install -g serve
WORKDIR /app
COPY --from=build /app/apps/client/dist ./dist
EXPOSE ${PORT:-5174}
CMD ["sh", "-c", "serve -s dist -l ${PORT:-5174}"]
