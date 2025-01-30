#!/bin/bash

# Ask the user which environment they want to see logs for (default: dev)
echo "Which environment do you want to see logs for? (dev/prod) [default: dev]"
read -r ENV

# Set default to dev if no input is given
ENV=${ENV:-dev}

# Set the appropriate compose file based on user input
case "$ENV" in
    dev)
        COMPOSE_FILE="compose.dev.yaml"
        ;;
    prod)
        COMPOSE_FILE="compose.prod.yaml"
        ;;
    *)
        echo "Invalid option. Please choose 'dev' or 'prod'."
        exit 1
        ;;
esac

# Check if the compose file exists
if [[ ! -f $COMPOSE_FILE ]]; then
    echo "Error: $COMPOSE_FILE not found in the current directory."
    exit 1
fi

# Show logs for the selected environment
docker compose -f "$COMPOSE_FILE" logs -f