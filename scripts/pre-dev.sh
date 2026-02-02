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
  echo -e "${GREEN}✔ USE_SYK_INN_VALKEY=false — skipping Valkey check${RESET}"
fi
