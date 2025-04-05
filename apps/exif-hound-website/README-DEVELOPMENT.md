# Exif-Hound Website Development Guide

This document explains how to set up and run the Exif-Hound website development environment using Docker.

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/install/) (usually included with Docker Desktop)
- A Stripe account with API keys (for testing payments)

## Quick Start

We provide convenient scripts for managing the development environment:

### For Linux/macOS:

```bash
# Make the script executable (only needed once)
chmod +x dev.sh

# Start the development environment
./dev.sh start

# View logs
./dev.sh logs

# Stop the development environment
./dev.sh stop
```

### For Windows:

```batch
# Start the development environment
dev.bat start

# View logs
dev.bat logs

# Stop the development environment
dev.bat stop
```

## Available Commands

Both scripts support the following commands:

- `start` - Start the development environment
- `stop` - Stop the development environment
- `restart` - Restart the development environment
- `rebuild` - Rebuild and start the development environment
- `logs` - Show logs from all containers
- `logs:app` - Show logs from the Next.js app
- `logs:stripe` - Show logs from the Stripe CLI
- `ps` - Show running containers
- `shell` - Open a shell in the app container
- `test:license <key>` - Test a license key
- `help` - Show the help message

## Environment Setup

The first time you run the development environment, the script will:

1. Check if Docker is installed
2. Create a `.env` file from `.env.example` if it doesn't exist
3. Start the Docker containers

You should edit the `.env` file to add your Stripe API keys:

```
# Stripe API Keys - Replace with your actual keys
STRIPE_SECRET_KEY=sk_test_your_actual_key_here
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_actual_key_here

# Stripe Webhook Secret - Get this after setting up the webhook in Stripe Dashboard
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Base URL - Update for production
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

## Testing License Verification

To test license verification, you can use the `test:license` command with a license key:

```bash
# For Linux/macOS
./dev.sh test:license EXH-ABCDE-FGHIJ-KLMNO-PQRST

# For Windows
dev.bat test:license EXH-ABCDE-FGHIJ-KLMNO-PQRST
```

This will send a request to the license verification API and show the result.

## Website Access

Once the development environment is running, you can access:

- Website: [http://localhost:3000](http://localhost:3000)

## Stripe CLI

The Stripe CLI container forwards webhook events from Stripe to your local application. For this to work correctly, you need to:

1. Add valid Stripe API keys to your `.env` file
2. Ensure your Stripe account has webhook endpoints configured

## Troubleshooting

If you encounter issues:

1. Check the logs: `./dev.sh logs` or `dev.bat logs`
2. Ensure Docker is running
3. Try rebuilding the environment: `./dev.sh rebuild` or `dev.bat rebuild`
4. Verify your Stripe API keys in the `.env` file

## Manual Docker Commands

If you prefer to use Docker commands directly:

```bash
# Start containers in the background
docker-compose up -d

# View logs
docker-compose logs -f

# Stop containers
docker-compose down

# Rebuild containers
docker-compose up -d --build
``` 