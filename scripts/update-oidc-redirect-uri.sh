#!/bin/bash

# Script to add redirect URIs to Vault OIDC role
# Usage: ./scripts/update-oidc-redirect-uri.sh [your-redirect-uri]

set -e

# Configuration
VAULT_ADDR="${VAULT_ADDR:-https://vault.factory.adeo.cloud}"
VAULT_NAMESPACE="${VAULT_NAMESPACE:-adeo/solution-offer-design}"
OIDC_ROLE="${OIDC_ROLE:-users}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if vault token exists
if [ ! -f ~/.vault-token ]; then
  echo -e "${RED}Error: No Vault token found. Please run 'vault-me' first.${NC}"
  exit 1
fi

export VAULT_TOKEN=$(cat ~/.vault-token)

# Get the redirect URI from argument or use default
NEW_REDIRECT_URI="${1:-http://localhost:3000/auth/vault/callback}"

echo -e "${YELLOW}Vault Configuration:${NC}"
echo "  Address: $VAULT_ADDR"
echo "  Namespace: $VAULT_NAMESPACE"
echo "  Role: $OIDC_ROLE"
echo "  New Redirect URI: $NEW_REDIRECT_URI"
echo ""

# Read current configuration
echo -e "${YELLOW}Reading current OIDC role configuration...${NC}"
CURRENT_CONFIG=$(vault read -format=json auth/oidc/role/$OIDC_ROLE)

if [ $? -ne 0 ]; then
  echo -e "${RED}Error: Failed to read OIDC role configuration.${NC}"
  echo "Make sure you have the necessary permissions."
  exit 1
fi

# Extract current redirect URIs
CURRENT_URIS=$(echo "$CURRENT_CONFIG" | jq -r '.data.allowed_redirect_uris[]' 2>/dev/null)

if [ $? -ne 0 ]; then
  echo -e "${RED}Error: Failed to parse current configuration.${NC}"
  exit 1
fi

echo -e "${GREEN}Current allowed redirect URIs:${NC}"
echo "$CURRENT_URIS" | while read uri; do
  echo "  - $uri"
done
echo ""

# Check if the URI already exists
if echo "$CURRENT_URIS" | grep -qF "$NEW_REDIRECT_URI"; then
  echo -e "${GREEN}The redirect URI is already registered!${NC}"
  exit 0
fi

# Extract bound_audiences
BOUND_AUDIENCES=$(echo "$CURRENT_CONFIG" | jq -r '.data.bound_audiences[0]' 2>/dev/null)

# Build the vault write command
echo -e "${YELLOW}Adding new redirect URI...${NC}"

# Create an array with all URIs
ALL_URIS="$CURRENT_URIS"$'\n'"$NEW_REDIRECT_URI"

# Build the command
CMD="vault write auth/oidc/role/$OIDC_ROLE"

# Add all redirect URIs
while IFS= read -r uri; do
  if [ -n "$uri" ]; then
    CMD="$CMD allowed_redirect_uris=\"$uri\""
  fi
done <<< "$ALL_URIS"

# Add bound_audiences
CMD="$CMD bound_audiences=\"$BOUND_AUDIENCES\" user_claim=\"sub\""

echo ""
echo -e "${YELLOW}Command to execute:${NC}"
echo "$CMD"
echo ""

# Ask for confirmation
read -p "Do you want to execute this command? (y/n) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
  eval "$CMD"

  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Successfully updated OIDC role configuration!${NC}"
    echo ""
    echo -e "${YELLOW}Verifying...${NC}"
    vault read auth/oidc/role/$OIDC_ROLE | grep -A 20 "allowed_redirect_uris"
  else
    echo -e "${RED}✗ Failed to update OIDC role configuration.${NC}"
    exit 1
  fi
else
  echo -e "${YELLOW}Operation cancelled.${NC}"
  exit 0
fi
