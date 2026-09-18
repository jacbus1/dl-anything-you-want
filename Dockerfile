FROM node:22-bookworm-slim AS whisper-build
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates cmake curl g++ make && rm -rf /var/lib/apt/lists/*
WORKDIR /src
RUN curl -L --fail --silent --show-error https://github.com/ggml-org/whisper.cpp/archive/refs/tags/v1.9.4.tar.gz -o whisper.tar.gz \
 && echo "57e280cee375ab02425b806ad5146b99f6eb9357e3c2b31357c8a6af2e2e44ae  whisper.tar.gz" | sha256sum -c - \
 && tar -xzf whisper.tar.gz --strip-components=1 \
 && cmake -B build -DCMAKE_BUILD_TYPE=Release -DBUILD_SHARED_LIBS=OFF -DGGML_NATIVE=OFF -DWHISPER_BUILD_TESTS=OFF -DWHISPER_BUILD_EXAMPLES=ON \
 && cmake --build build --config Release -j2 --target whisper-cli
RUN curl -L --fail --silent --show-error https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-tiny.bin -o ggml-tiny.bin \
 && echo "bd577a113a864445d4c299885e0cb97d4ba92b5f  ggml-tiny.bin" | sha1sum -c -

FROM node:22-bookworm-slim
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends ffmpeg && rm -rf /var/lib/apt/lists/*
COPY --from=whisper-build /src/build/bin/whisper-cli /usr/local/bin/whisper-cli
COPY --from=whisper-build /src/ggml-tiny.bin /opt/whisper/ggml-tiny.bin
COPY --chown=node:node package.json server.mjs LICENSE THIRD_PARTY_NOTICES.md ./
COPY --chown=node:node lib ./lib
COPY --chown=node:node web ./web
USER node
ENV HOST=0.0.0.0 PORT=3000 WHISPER_BIN=/usr/local/bin/whisper-cli WHISPER_MODEL=/opt/whisper/ggml-tiny.bin
EXPOSE 3000
CMD ["node", "server.mjs"]
