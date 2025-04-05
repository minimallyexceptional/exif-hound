# Exif-Hound Website Docker Setup

This document explains how to run the Exif-Hound website using Docker with integrated Stripe payment processing and license key generation.

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/install/)
- A Stripe account with API keys

## Setup

1. **Create an environment file:**

   Copy the example environment file and fill in your actual Stripe API keys:

   ```bash
   cp .env.example .env
   ```

   Then edit the `.env` file to add your Stripe API keys:
   
   ```
   STRIPE_SECRET_KEY=sk_test_your_actual_secret_key
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_actual_publishable_key
   STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here  # Optional for development
   NEXT_PUBLIC_BASE_URL=http://localhost:3000  # Update for production
   ```

2. **Build and run the containers:**

   ```bash
   # On Linux/macOS:
   chmod +x deploy.sh
   ./deploy.sh

   # On Windows:
   docker-compose up -d --build
   ```

## How It Works

This Docker setup consists of two containers:

1. **`app` container**: Runs the Next.js application with the following features:
   - Serves the Exif-Hound website
   - Processes Stripe checkout sessions
   - Generates and stores license keys
   - Exposes API endpoints for license verification

2. **`stripe-cli` container**: Runs the Stripe CLI to:
   - Forward webhook events from Stripe to your local application
   - Allow for testing the full payment and license generation flow

The license keys are stored in the `./data/licenses.json` file, which is mounted as a volume to persist the data.

## Using the Stripe CLI

The Stripe CLI container automatically forwards webhook events to your application. When a payment is successfully processed, the webhook will trigger license key generation.

To view the Stripe CLI logs:

```bash
docker-compose logs -f stripe-cli
```

## Testing the Payment Flow

1. Open the website at [http://localhost:3000](http://localhost:3000)
2. Navigate to the pricing page and click on "Buy Now"
3. Complete the checkout using a [Stripe test card](https://stripe.com/docs/testing#cards) (e.g., 4242 4242 4242 4242)
4. After successful payment, you'll be redirected to the success page with your license key

## Updating the Application

To update the application after making code changes:

```bash
docker-compose up -d --build
```

## Stopping the Application

To stop all containers:

```bash
docker-compose down
```

## Production Deployment

For production deployment:

1. Update the `NEXT_PUBLIC_BASE_URL` in your `.env` file to your actual domain
2. Set up a proper webhook endpoint in your Stripe Dashboard and update the `STRIPE_WEBHOOK_SECRET`
3. Consider using a reverse proxy like Nginx to handle SSL/TLS termination

## License Management

The generated license keys are stored in the `./data/licenses.json` file. This file is mounted as a volume to persist the data even when the containers are restarted.

You can access this data to implement additional license management features like:
- Email notifications
- License verification endpoints
- Admin dashboard for license management 