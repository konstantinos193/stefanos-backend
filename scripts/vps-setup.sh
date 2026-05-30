#!/bin/bash
# Run this ONCE on the VPS to set up the project for the first time.
# After this, GitHub Actions handles all future deploys.

set -e

APP_DIR="/root/stefanos-backend"
REPO_URL="https://github.com/YOUR_GITHUB_USERNAME/YOUR_REPO_NAME.git"
PM2_APP_NAME="stefanos-backend"

echo "=== Installing system dependencies ==="
apt-get update -y
apt-get install -y git curl

echo "=== Installing Node.js (via nvm) ==="
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
export NVM_DIR="$HOME/.nvm"
source "$NVM_DIR/nvm.sh"
nvm install --lts
nvm use --lts

echo "=== Installing pnpm ==="
npm install -g pnpm pm2

echo "=== Cloning repository ==="
git clone "$REPO_URL" "$APP_DIR"
cd "$APP_DIR"

echo "=== Copying .env ==="
echo ">>> Copy your .env file to $APP_DIR/.env now, then press Enter to continue <<<"
read -r

echo "=== Installing dependencies and building ==="
pnpm install --frozen-lockfile
pnpm build

echo "=== Running migrations ==="
pnpm prisma migrate deploy

echo "=== Starting with PM2 ==="
pm2 start dist/main.js --name "$PM2_APP_NAME"
pm2 save
pm2 startup

echo "=== Done! PM2 app '$PM2_APP_NAME' is running. ==="
pm2 status
