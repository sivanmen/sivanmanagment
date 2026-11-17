# Sivan Management website (Astro + Node adapter). Build context: repository root.
#   docker build -f apps/web/Dockerfile -t sivan-web .
FROM node:20-alpine AS build
WORKDIR /repo
RUN corepack enable
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/web/package.json apps/web/
RUN pnpm install --filter web --frozen-lockfile
COPY apps/web apps/web
ARG SITE_URL=https://sivanmanagment.com
ENV SITE_URL=$SITE_URL
RUN pnpm --filter web build

# Runtime keeps the pnpm workspace layout so node_modules symlinks stay valid.
FROM node:20-alpine
ENV NODE_ENV=production HOST=0.0.0.0 PORT=8080
WORKDIR /repo
COPY --from=build /repo/node_modules ./node_modules
COPY --from=build /repo/apps/web/node_modules ./apps/web/node_modules
COPY --from=build /repo/apps/web/dist ./apps/web/dist
COPY --from=build /repo/apps/web/package.json ./apps/web/package.json
WORKDIR /repo/apps/web
USER node
EXPOSE 8080
CMD ["node", "./dist/server/entry.mjs"]
