# Build and run the app with Playwright's supported Chromium dependencies.
FROM node:24-bookworm-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 make g++ \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm install
RUN npx playwright install --with-deps chromium

COPY tsconfig.json ./
COPY src ./src
RUN npm run build && printf '{"type":"commonjs"}\n' > dist/package.json

EXPOSE 8080

CMD ["node", "dist/index.js"]