#!/bin/bash
set -e

# Check if .env file exists
if [ ! -f .env ]; then
  echo "Error: .env file not found."
  echo "Please create an .env file with your environment variables."
  echo "You can use .env.example as a template."
  exit 1
fi

# Build and start the containers
echo "Building and starting Docker containers..."
docker-compose up -d --build

echo "Application is now running at http://localhost:3000"
echo "Stripe webhooks are being forwarded to the application."
echo ""
echo "To view logs:"
echo "  docker-compose logs -f"
echo ""
echo "To stop the application:"
echo "  docker-compose down" 