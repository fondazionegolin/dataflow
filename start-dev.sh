#!/bin/bash

# Start both backend and frontend in development mode (Web App)

echo "=========================================="
echo "DataFlow Platform - Development Mode"
echo "=========================================="
echo ""
echo "Starting as WEB APP (no Tauri required)"
echo "Open http://localhost:1420 in your browser"
echo ""

# Check if backend venv exists
if [ ! -d "backend/venv" ]; then
    echo "❌ Backend virtual environment not found!"
    echo "Please run: cd backend && python3.11 -m venv venv && source venv/bin/activate && pip install -r requirements.txt"
    exit 1
fi

# Check if frontend node_modules exists
if [ ! -d "frontend/node_modules" ]; then
    echo "Installing frontend dependencies..."
    cd frontend
    npm install
    cd ..
fi

# Start backend in background with GPU optimizations
echo "Starting backend server with GPU optimizations..."
cd backend
source venv/bin/activate

# Set GPU optimization environment variables
export PYTORCH_CUDA_ALLOC_CONF=expandable_segments:True
export CUDA_LAUNCH_BLOCKING=0
export TORCH_CUDNN_V8_API_ENABLED=1
echo "  ✅ GPU optimizations enabled (expandable_segments:True)"

PYTHONPATH=. python main.py &
BACKEND_PID=$!
cd ..

# Wait for backend to start
echo "Waiting for backend to initialize..."
sleep 3

# Check if backend is running
if curl -s http://127.0.0.1:8765 > /dev/null 2>&1; then
    echo "✅ Backend is running on http://127.0.0.1:8765"
else
    echo "⚠️  Backend may not be running. Check for errors above."
fi

echo ""
echo "Starting frontend (web app)..."
echo ""

# Start frontend
cd frontend
npm run dev &
FRONTEND_PID=$!

# Cleanup on exit
trap "echo 'Stopping servers...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null" EXIT

echo ""
echo "=========================================="
echo "✅ DataFlow Platform is starting!"
echo "=========================================="
echo ""
echo "Backend:  http://127.0.0.1:8765"
echo "Frontend: http://localhost:1420"
echo ""
echo "Press Ctrl+C to stop both servers"
echo ""

# Wait for user interrupt
wait
