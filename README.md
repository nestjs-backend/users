# User microservice

## Start stack

- docker compose -f compose.dev.yaml up -d
- docker compose -f compose.dev.yaml up -d --build
- docker compose -f compose.dev.yaml down

## Install a new library

- npm install class-validator
- docker compose -f compose.dev.yaml exec user-dev npm install class-validator
