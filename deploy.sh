#!/bin/bash
set -e

cd /var/www/whvac-portal

echo "Pulling latest code..."
git pull

echo "Stopping containers..."
docker compose down

echo "Building and starting containers..."
docker compose up -d --build

echo "Deploy complete ✓"
docker compose ps
