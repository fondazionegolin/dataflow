#!/bin/bash

# Start the Python backend server

echo "Starting DataFlow Platform Backend..."

cd backend

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Upgrade pip first
echo "Upgrading pip, setuptools, and wheel..."
pip install --upgrade pip setuptools wheel --quiet

# Install dependencies
echo "Installing dependencies..."
if pip install -r requirements.txt; then
    echo "✅ Dependencies installed successfully"
else
    echo "⚠️  Standard installation failed, trying minimal requirements..."
    if pip install -r requirements-minimal.txt; then
        echo "✅ Minimal dependencies installed successfully"
    else
        echo "❌ Installation failed. Please see TROUBLESHOOTING_INSTALL.md"
        exit 1
    fi
fi

# Start the server
echo ""
echo "Starting FastAPI server on http://127.0.0.1:8765"
echo "Press Ctrl+C to stop"
echo ""

# Run from backend directory with proper Python path
cd "$(dirname "$0")/backend"
PYTHONPATH=. python main.py
