## Prerequisites

- [Docker](https://www.docker.com/products/docker-desktop)
- [Docker Compose](https://docs.docker.com/compose/install/)
- [Bun)](https://bun.sh/en)

## Environment Variables

Create a `.env` file in the root directory. Use the sample `.env.example` as a
guide.

## Running the Application

### With Docker

1. **Build and Start**: Run the following command:

   ```bash
   docker-compose up --build
   ```

2. **Access the Application**: Open `http://localhost:5000`.

3. **Access Mailpit**: Open `http://localhost:8025` for email testing.

4. **Access Mongo-Express**: Open `http://localhost:8081` to view mongodb data.

5. **Stop the Containers**: Use:

   ```bash
   docker-compose down
   ```

### With NPM

1. **Install Dependencies**: Run the following command:

   ```bash
   bun install
   ```

2. **Start the Application**: Use:

   ```bash
   bun run src/index.ts
   ```

3. **Access the Application**: Open `http://localhost:5000`.