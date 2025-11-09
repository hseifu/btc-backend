# BTC Price Tracker - Backend

A NestJS-based backend service for tracking Bitcoin prices and managing user guesses on BTC price movements.

## Features

- **Authentication & Authorization**: JWT-based auth with access and refresh tokens
- **BTC Price Tracking**: Real-time BTC price fetching from CoinMarketCap API
- **WebSocket Support**: Real-time updates for BTC prices and guess validations
- **Guess Management**: Users can guess if BTC will go UP or DOWN
- **Score System**: Track wins, losses, and points for each user
- **Automated Validation**: Cron job validates pending guesses after 1 minute
- **Leaderboard**: Global leaderboard based on user scores

## Tech Stack

- **Framework**: NestJS
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT (Passport.js)
- **Real-time**: Socket.IO
- **Task Scheduling**: @nestjs/schedule and nestjs CRON
- **Testing**: Jest

## Prerequisites

- Node.js (v18 or higher)
- PostgreSQL database (local or cloud-based like RDS, Neon, Railway, Supabase)
- CoinMarketCap API key

## Environment Setup

1. **Copy the environment template**:

   ```bash
   cp .env.example .env
   ```

2. **Configure environment variables** in `.env`:
   Copy and paste provided .env file.

## Installation

```bash
npm install
```

## Database Setup

1. **Generate Prisma client**:

   ```bash
   npx prisma generate
   ```

2. **Run database migrations**:

   ```bash
   npx prisma migrate dev
   ```

## Running the Application

### Development Mode

```bash
npm run start:dev
```

The server will start on `http://localhost:3009` (or your configured PORT)

### Production Mode

```bash
npm run build
npm run start:prod
```

### Debug Mode

```bash
npm run start:debug
```

## Testing

```bash
# Run unit tests
npm test

# Run tests in watch mode
npm run test:watch

# Run test coverage
npm run test:cov

# Run e2e tests
npm run test:e2e
```

## API Documentation

Once the server is running, the following endpoints are available:

### Authentication

- `POST /v1/auth/register` - Register a new user
- `POST /v1/auth/login` - Login user
- `GET /v1/auth/refresh` - Refresh access token
- `GET /v1/auth/me` - Get current user

### BTC Price

- `GET /v1/btc/latest` - Get latest BTC price

### Guesses

- `POST /v1/guesses` - Create a new guess
- `GET /v1/guesses/me` - Get current user's guesses
- `GET /v1/guesses/:id` - Get specific guess
- `DELETE /v1/guesses/:id` - Delete guess

### Scores

- `GET /v1/scores` - Get all scores (leaderboard)
- `GET /v1/scores/:userId` - Get specific user's score

### WebSocket Events

**Namespace: `/btc`**

- Event: `btcPrice` - Emitted every 5 seconds with latest BTC price

**Namespace: `/guesses`**

- Emit: `subscribeToGuess` - Subscribe to guess validation updates
- Event: `guessValidated` - Receive guess validation results
