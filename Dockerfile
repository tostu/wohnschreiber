FROM oven/bun:1 AS build
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ \
	&& rm -rf /var/lib/apt/lists/*

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY . .
# Only used to satisfy the build-time import check in db/index.ts; not a real connection.
ENV DATABASE_URL="postgres://user:pass@localhost:5432/db"
RUN bun run build

FROM oven/bun:1-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production

COPY --from=build /app/build ./build
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/drizzle ./drizzle
COPY --from=build /app/scripts ./scripts

ENV HOST=0.0.0.0
ENV PORT=3000
EXPOSE 3000

# Apply pending DB migrations before starting the server. If migration fails the
# container exits non-zero instead of serving against an outdated schema.
CMD ["sh", "-c", "bun ./scripts/migrate.ts && bun ./build/index.js"]
