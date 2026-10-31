FROM oven/bun:latest

WORKDIR /app

COPY package.json ./
RUN bun install

COPY . .

EXPOSE 3017

ENV PORT=3017 \
    HOSTNAME="0.0.0.0"

CMD ["bun", "run", "dev"]

