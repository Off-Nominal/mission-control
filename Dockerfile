# syntax=docker/dockerfile:1

# Node 26 links libatomic.so.1. node:bookworm-slim already ships libatomic1.
ARG NODE_VERSION=26.12.1

FROM node:${NODE_VERSION}-bookworm-slim AS build

WORKDIR /app
# pnpm prune refuses to delete node_modules unless this is set.
ENV CI=true

RUN npm install -g pnpm@10.34.7

COPY package.json pnpm-lock.yaml ./
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
  pnpm install --frozen-lockfile --store-dir /pnpm/store \
    --config.node-linker=hoisted \
    --config.package-import-method=copy

COPY tsconfig.json ./
COPY src ./src
RUN pnpm run build \
  && pnpm prune --prod \
    --config.node-linker=hoisted \
    --config.package-import-method=copy

FROM node:${NODE_VERSION}-bookworm-slim AS runtime

WORKDIR /app
ENV NODE_ENV=production

COPY --from=build /app/package.json ./package.json
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist

USER node
EXPOSE 8080
CMD ["node", "dist/index.js"]
