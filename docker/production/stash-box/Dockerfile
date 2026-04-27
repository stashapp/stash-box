# Multi-stage build for stash-box
# Must be built from the project root:
#   docker build -f docker/production/stash-box/Dockerfile .

# Stage 1: Build frontend
FROM node:24-slim AS frontend

RUN corepack enable pnpm

WORKDIR /app/frontend
COPY frontend/package.json frontend/pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY frontend/ ./
RUN pnpm build

# Stage 2: Build backend
FROM golang:1.25 AS backend

RUN apt-get update && apt-get install -y --no-install-recommends \
    make git ca-certificates libvips-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download

COPY . .
COPY --from=frontend /app/frontend/build ./frontend/build

RUN make build

# Stage 3: Runtime
FROM ubuntu:24.04

RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates libvips \
    && rm -rf /var/lib/apt/lists/*

COPY --from=backend /app/stash-box /usr/bin/stash-box

EXPOSE 9998
CMD ["stash-box", "--config_file", "/root/.stash-box/stash-box-config.yml"]
