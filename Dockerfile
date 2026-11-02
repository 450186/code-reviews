# syntax=docker/dockerfile:1
#
# Multi-stage build for the code-reviews technical test.
#   docker build --target api -t code-reviews-api .
#   docker build --target web -t code-reviews-web .
# or simply: docker compose up --build

ARG NODE_VERSION=24-alpine

# ---------------------------------------------------------------------------
# deps: install all workspace dependencies once
# ---------------------------------------------------------------------------
FROM node:${NODE_VERSION} AS deps
WORKDIR /app
RUN apk add --no-cache libc6-compat openssl
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
RUN npm ci

# ---------------------------------------------------------------------------
# api-build: generate Prisma client and compile TypeScript
# ---------------------------------------------------------------------------
FROM deps AS api-build
WORKDIR /app
COPY apps/api apps/api
RUN npm run build -w apps/api

# ---------------------------------------------------------------------------
# api: runtime image (GraphQL API + SQLite file on a volume)
# ---------------------------------------------------------------------------
FROM node:${NODE_VERSION} AS api
WORKDIR /app
ENV NODE_ENV=production
RUN apk add --no-cache openssl
COPY --from=api-build /app/node_modules ./node_modules
COPY --from=api-build /app/package.json ./package.json
COPY --from=api-build /app/apps/api/package.json ./apps/api/package.json
COPY --from=api-build /app/apps/api/dist ./apps/api/dist
COPY --from=api-build /app/apps/api/prisma ./apps/api/prisma
COPY docker/api-entrypoint.sh /usr/local/bin/api-entrypoint.sh
RUN chmod +x /usr/local/bin/api-entrypoint.sh \
 && mkdir -p /data && chown -R node:node /data /app
USER node
WORKDIR /app/apps/api
ENV PORT=4000
ENV DATABASE_URL="file:/data/app.db"
EXPOSE 4000
VOLUME ["/data"]
ENTRYPOINT ["api-entrypoint.sh"]
CMD ["node", "dist/index.js"]

# ---------------------------------------------------------------------------
# web-build: build the Next.js app in standalone mode
# ---------------------------------------------------------------------------
FROM deps AS web-build
WORKDIR /app
COPY apps/web apps/web
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build -w apps/web

# ---------------------------------------------------------------------------
# web: runtime image (Next.js standalone server)
# ---------------------------------------------------------------------------
FROM node:${NODE_VERSION} AS web
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=web-build /app/apps/web/.next/standalone ./
COPY --from=web-build /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=web-build /app/apps/web/public ./apps/web/public
USER node
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
EXPOSE 3000
CMD ["node", "apps/web/server.js"]
