#!/bin/bash

# Optimized backend startup script for RTX 4090
# This script sets environment variables to optimize CUDA memory usage

echo "🚀 Starting DataFlow backend with GPU optimizations for RTX 4090..."

# Set CUDA memory management environment variables
export PYTORCH_CUDA_ALLOC_CONF=expandable_segments:True
export CUDA_LAUNCH_BLOCKING=0

# Optional: Limit PyTorch memory allocation (uncomment if needed)
# export PYTORCH_CUDA_ALLOC_CONF=max_split_size_mb:512

# Enable cuDNN benchmarking for better performance
export TORCH_CUDNN_V8_API_ENABLED=1

# Set number of threads (adjust based on your CPU)
export OMP_NUM_THREADS=8
export MKL_NUM_THREADS=8

echo "📊 CUDA Memory Configuration:"
echo "  - PYTORCH_CUDA_ALLOC_CONF: $PYTORCH_CUDA_ALLOC_CONF"
echo "  - Expandable segments: Enabled (reduces fragmentation)"
echo ""

# Navigate to backend directory
cd "$(dirname "$0")/backend"

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "❌ Virtual environment not found. Please run setup first."
    exit 1
fi

# Activate virtual environment
source venv/bin/activate

# Check if required packages are installed
echo "📦 Checking dependencies..."
python -c "import torch; print(f'✅ PyTorch {torch.__version__} (CUDA available: {torch.cuda.is_available()})')" 2>/dev/null || {
    echo "❌ PyTorch not found. Installing dependencies..."
    pip install -r requirements.txt
}

# Display GPU info
echo ""
echo "🎮 GPU Information:"
python -c "
import torch
if torch.cuda.is_available():
    print(f'  Device: {torch.cuda.get_device_name(0)}')
    print(f'  Total Memory: {torch.cuda.get_device_properties(0).total_memory / 1024**3:.2f} GB')
    print(f'  CUDA Version: {torch.version.cuda}')
else:
    print('  ⚠️  CUDA not available')
"
echo ""

# Start the backend
echo "🌟 Starting FastAPI backend on http://127.0.0.1:8765"
echo "   Press Ctrl+C to stop"
echo ""

python main.py
