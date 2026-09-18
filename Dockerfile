FROM node:22-bookworm-slim
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends ffmpeg && rm -rf /var/lib/apt/lists/*
COPY --chown=node:node package.json server.mjs LICENSE THIRD_PARTY_NOTICES.md ./
COPY --chown=node:node lib ./lib
COPY --chown=node:node web ./web
USER node
ENV HOST=0.0.0.0 PORT=3000
EXPOSE 3000
CMD ["node", "server.mjs"]
