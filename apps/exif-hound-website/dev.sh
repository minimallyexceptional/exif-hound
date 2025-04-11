#!/bin/bash
set -e

# Colors for terminal output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to display script usage
function show_usage {
  echo -e "${BLUE}Exif-Hound Docker Development Environment${NC}"
  echo ""
  echo "Usage: ./dev.sh [command]"
  echo ""
  echo "Commands:"
  echo "  start       - Start the development environment"
  echo "  stop        - Stop the development environment"
  echo "  restart     - Restart the development environment"
  echo "  rebuild     - Rebuild and start the development environment"
  echo "  logs        - Show logs from all containers"
  echo "  logs:app    - Show logs from the Next.js app"
  echo "  logs:stripe - Show logs from the Stripe CLI"
  echo "  ps          - Show running containers"
  echo "  shell       - Open a shell in the app container"
  echo "  test:license <key> - Test a license key"
  echo "  help        - Show this help message"
  echo ""
}

# Check if Docker is installed
function check_docker {
  if ! command -v docker &> /dev/null; then
    echo -e "${RED}Error: Docker is not installed${NC}"
    echo "Please install Docker: https://docs.docker.com/get-docker/"
    exit 1
  fi

  if ! command -v docker-compose &> /dev/null; then
    echo -e "${YELLOW}Warning: docker-compose is not installed. Using 'docker compose' command instead.${NC}"
    DOCKER_COMPOSE="docker compose"
  else
    DOCKER_COMPOSE="docker-compose"
  fi
}

# Check if .env file exists, create from template if missing
function check_env {
  if [ ! -f .env ]; then
    echo -e "${YELLOW}No .env file found. Creating from .env.example...${NC}"
    
    if [ -f .env.example ]; then
      cp .env.example .env
      echo -e "${GREEN}Created .env file from example template.${NC}"
      echo -e "${YELLOW}Please edit the .env file with your Stripe API keys before running the application.${NC}"
    else
      echo -e "${RED}Error: Could not find .env.example file${NC}"
      exit 1
    fi
  fi
}

# Start the development environment
function start_dev {
  echo -e "${BLUE}Starting Exif-Hound development environment...${NC}"
  check_env
  $DOCKER_COMPOSE up -d
  echo -e "${GREEN}Development environment is running!${NC}"
  echo -e "Website: ${BLUE}http://localhost:3000${NC}"
  echo -e "Use ${YELLOW}./dev.sh logs${NC} to view logs"
}

# Stop the development environment
function stop_dev {
  echo -e "${BLUE}Stopping Exif-Hound development environment...${NC}"
  $DOCKER_COMPOSE down
  echo -e "${GREEN}Development environment stopped${NC}"
}

# Rebuild the development environment
function rebuild_dev {
  echo -e "${BLUE}Rebuilding Exif-Hound development environment...${NC}"
  check_env
  $DOCKER_COMPOSE up -d --build
  echo -e "${GREEN}Development environment rebuilt and running!${NC}"
  echo -e "Website: ${BLUE}http://localhost:3000${NC}"
}

# View logs
function show_logs {
  case "$1" in
    "app")
      $DOCKER_COMPOSE logs -f app
      ;;
    "stripe")
      $DOCKER_COMPOSE logs -f stripe-cli
      ;;
    *)
      $DOCKER_COMPOSE logs -f
      ;;
  esac
}

# Show container status
function show_status {
  $DOCKER_COMPOSE ps
}

# Open a shell in the app container
function open_shell {
  $DOCKER_COMPOSE exec app /bin/sh
}

# Test a license key
function test_license {
  if [ -z "$1" ]; then
    echo -e "${RED}Error: No license key provided${NC}"
    echo "Usage: ./dev.sh test:license <license_key>"
    exit 1
  fi
  
  echo -e "${BLUE}Testing license key: $1${NC}"
  curl -s -X POST http://localhost:3000/api/verify-license \
    -H "Content-Type: application/json" \
    -d "{\"licenseKey\": \"$1\"}" | jq .
}

# Main function
function main {
  check_docker
  
  case "$1" in
    "start")
      start_dev
      ;;
    "stop")
      stop_dev
      ;;
    "restart")
      stop_dev
      start_dev
      ;;
    "rebuild")
      stop_dev
      rebuild_dev
      ;;
    "logs")
      show_logs "$2"
      ;;
    "logs:app")
      show_logs "app"
      ;;
    "logs:stripe")
      show_logs "stripe"
      ;;
    "ps")
      show_status
      ;;
    "shell")
      open_shell
      ;;
    "test:license")
      test_license "$2"
      ;;
    "help"|"--help"|"-h"|"")
      show_usage
      ;;
    *)
      echo -e "${RED}Unknown command: $1${NC}"
      show_usage
      exit 1
      ;;
  esac
}

# Run the script
main "$@" 