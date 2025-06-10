# --- Stage 1: Builder ---
# This stage builds the TypeScript code into JavaScript
FROM node:20-alpine AS builder

# Set the working directory
WORKDIR /app

# Enable pnpm using corepack
RUN corepack enable

# Copy dependency definition files
COPY package.json pnpm-lock.yaml ./

# Install all dependencies, including dev dependencies for building
RUN pnpm install --frozen-lockfile

# Copy the rest of the source code
COPY . .

# Compile the TypeScript code
RUN pnpm build

# --- Stage 2: Production ---
# This stage creates the final, lean image with only what's needed to run the bot
FROM node:20-alpine

# Set the working directory
WORKDIR /app

# Install production dependencies using Alpine's package manager.
# This now includes yt-dlp directly, which is the correct way.
RUN apk add --no-cache ffmpeg yt-dlp

# Enable pnpm using corepack
RUN corepack enable

# Copy ONLY the production package.json
COPY package.json pnpm-lock.yaml ./

# Install ONLY production dependencies for Node.js
RUN pnpm install --prod --frozen-lockfile

# Copy the compiled code from the builder stage
COPY --from=builder /app/dist ./dist

# Set the command to run the bot
# The entrypoint is the compiled index.js in the dist folder
CMD [ "node", "dist/app.js" ]