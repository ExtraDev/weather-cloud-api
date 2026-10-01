# Build and run the app with Playwright's supported Chromium dependencies.
FROM node:24-bookworm-slim

WORKDIR /app

COPY package*.json ./
RUN npm install
RUN npx playwright install --with-deps chromium

COPY tsconfig.json ./
COPY src ./src
RUN npm run build && printf '{"type":"commonjs"}\n' > dist/package.json

EXPOSE 8080

CMD ["node", "dist/index.js"]