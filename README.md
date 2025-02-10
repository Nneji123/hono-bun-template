# HONO-BUN-TEMPLATE

This is a TypeScript backend project built with [Hono](https://hono.dev/), [Bun](https://bun.sh/), [Docker](https://www.docker.com/), and [Docker Compose](https://docs.docker.com/compose/).

## Prerequisites

Ensure you have the following installed:

- [Docker](https://www.docker.com/products/docker-desktop)
- [Docker Compose](https://docs.docker.com/compose/install/)
- [Bun](https://bun.sh/en)

## Environment Variables

Create a `.env` file in the root directory. Use the sample `.env.example` as a guide.

## Running the Application

### With Docker

1. **Build and Start**: Run the following command:

   ```bash
   docker-compose up --build
   ```

2. **Access the Application**: Open `http://localhost:5000`.

3. **Access Mailpit**: Open `http://localhost:8025` for email testing.

4. **Access Mongo-Express**: Open `http://localhost:8081` to view MongoDB data.

5. **Stop the Containers**: Use:

   ```bash
   docker-compose down
   ```

### Without Docker

1. **Install Dependencies**: Run the following command:

   ```bash
   bun install
   ```

2. **Start the Application**: Use:

   ```bash
   bun run src/index.ts
   ```

3. **Access the Application**: Open `http://localhost:5000`.

## Development

To run the application in development mode with hot-reloading:

```bash
NODE_ENV=development bun run --hot src/index.ts
```

## Formatting Code

To format the code using [Biome](https://biomejs.dev/), run:

```bash
bunx biome format --write
```

## Project Structure

```
cedar-backend/
├── src/
│   ├── index.ts      # Entry point
│   ├── routes/       # API routes
│   ├── middlewares/  # Middleware functions
│   ├── services/     # Business logic
│   ├── models/       # Database models
│   ├── utils/        # Utility functions
│   ├── types/        # TypeScript type definitions
├── .env.example      # Environment variable sample
├── docker-compose.yml # Docker Compose configuration
├── tsconfig.json     # TypeScript configuration
├── bun.lockb         # Bun package lock file
├── package.json      # Project metadata
```