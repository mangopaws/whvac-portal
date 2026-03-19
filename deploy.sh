#!/bin/bash
set -e

cd /var/www/whvac-portal

echo "Pulling latest code..."
git pull origin main

echo "Stopping and removing container..."
docker stop whvac-portal || true
docker rm whvac-portal || true

echo "Building image..."
docker build -t whvac-portal .

echo "Starting container..."
docker run -d \
  --name whvac-portal \
  --restart unless-stopped \
  -p 3002:3002 \
  --env-file .env \
  -v /var/www/whvac-portal/.env:/app/.env:ro \
  -v /var/www/whvac-portal/data:/app/data \
  whvac-portal

echo "Deploy complete ✓"
docker ps | grep whvac-portal
