#!/bin/bash

echo "🚀 Starting Trading System..."

docker-compose down
docker-compose up -d --build

echo "⏳ Waiting for services..."
sleep 10

echo "✅ Trading System running at http://localhost:3000"
