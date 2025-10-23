#!/bin/bash

# Simple startup script for eCFR Analyzer
# This ensures packages are ready before starting

echo "Starting eCFR Data Analyzer..."

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

# Start the development server
echo "Starting server..."
npm run dev
