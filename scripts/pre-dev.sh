#!/usr/bin/env bash
set -e

GREEN="\033[0;32m"
CYAN="\033[0;36m"
BOLD="\033[1m"
RED="\033[1;31m"
RESET="\033[0m"

ENV_FILE=".env.development"

if [ -f "$ENV_FILE" ]; then
  set -a
  source "$ENV_FILE"
  set +a
else
  echo -e "${RED}✖ $ENV_FILE not found${RESET}"
  exit 1
fi

if [ "$USE_SYK_INN_VALKEY" = "true" ]; then
  echo -e "${CYAN}Checking Valkey on localhost:6379…${RESET}"
  if ! nc -z localhost 6379 >/dev/null 2>&1; then
    echo -e "${RED}${BOLD}✖ Valkey is NOT running on localhost:6379${RESET}"
    exit 1
  fi
  echo -e "${GREEN}${BOLD}✔ Valkey is running${RESET}"
else
  running_services="$(
    docker compose ps --format json 2>/dev/null \
    | jq -r 'select(.State=="running") | .Service' \
    | sort -u
  )"

  if echo "$running_services" | grep -qx "valkey"; then
    echo -e "${GREEN}✔ Valkey service is already running in Docker Compose${RESET}"
    exit 0
  fi

  echo -e "${CYAN}Starting Valkey service in Docker Compose…${RESET}"

  # Suppress the ugly compose chatter unless it fails
  output=$(docker compose up -d --remove-orphans 2>&1)
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}${BOLD}✔ Compose started!${RESET}"
  else
    echo -e "${RED}${BOLD}✖ Docker compose failed to start${RESET}"
    echo "$output"
    exit 1
  fi
fi
