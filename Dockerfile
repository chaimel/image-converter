# syntax=docker/dockerfile:1

FROM node:24-bookworm-slim AS build
WORKDIR /app
COPY . .
RUN --mount=type=cache,target=/root/.npm npm ci && npm run build

FROM node:24-bookworm-slim
# Fonts let SVG text render. jemalloc is Sharp's recommended allocator for long-running Linux servers.
RUN apt-get update \
    && apt-get install -y --no-install-recommends fontconfig fonts-dejavu-core fonts-liberation2 libjemalloc2 \
    && rm -rf /var/lib/apt/lists/* \
    && ln -s "/usr/lib/$(uname -m)-linux-gnu/libjemalloc.so.2" /usr/local/lib/libjemalloc.so.2
ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=3000 \
    LD_PRELOAD=/usr/local/lib/libjemalloc.so.2 \
    XDG_CACHE_HOME=/tmp/.cache
WORKDIR /app
COPY --from=build /app/.output ./.output
COPY --from=build /app/node_modules/dotenv ./node_modules/dotenv
COPY --from=build /app/scripts/env.mjs /app/scripts/serve.mjs ./scripts/
COPY --from=build /app/environments ./environments
# On Linux, Sharp's native binary loads libvips from a separate package (@img/sharp-libvips-*) that
# Nitro's file tracing may not pick up, so copy all of Sharp's platform packages from the build stage.
COPY --from=build /app/node_modules/@img ./.output/server/node_modules/@img
# Fail the build now, not on the first conversion, if Sharp's Linux binaries were not bundled. Import
# it the way the app does (ESM; the build has no CommonJS entry) and make a real image.
RUN cd .output/server && node --input-type=module -e "import sharp from 'sharp'; await sharp({ create: { width: 1, height: 1, channels: 3, background: '#000' } }).png().toBuffer()"
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD ["node", "-e", "fetch('http://127.0.0.1:' + process.env.PORT + '/api/health').then((r) => process.exit(r.ok ? 0 : 1), () => process.exit(1))"]
CMD ["node", "scripts/serve.mjs"]
