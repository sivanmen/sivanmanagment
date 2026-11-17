# Sivan Management website (Astro + Node adapter). Build context: repository root.
#   docker build -f apps/web/Dockerfile -t sivan-web .
FROM node:20-alpine AS build
WORKDIR /repo
RUN corepack enable
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/web/package.json apps/web/
RUN pnpm install --filter web --frozen-lockfile
COPY apps/web apps/web
RUN pnpm --filter web build

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production HOST=0.0.0.0 PORT=8080
COPY --from=build /repo/apps/web/dist ./dist
COPY --from=build /repo/apps/web/package.json ./
COPY --from=build /repo/node_modules/.pnpm /repo/node_modules/.pnpm
COPY --from=build /repo/apps/web/node_modules ./node_modules
USER node
EXPOSE 8080
CMD ["node", "./dist/server/entry.mjs"]
