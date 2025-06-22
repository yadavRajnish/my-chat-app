#!/bin/bash

# Deployment script for chat application

echo "🚀 Starting deployment process..."

# Build the application
echo "📦 Building application..."
npm run build

# Run database migrations
echo "🗄️ Setting up database..."
# Add your database migration commands here

# Start the application
echo "🎯 Starting application..."
npm start

echo "✅ Deployment completed successfully!"
echo "🌐 Application is running on port 3000"
