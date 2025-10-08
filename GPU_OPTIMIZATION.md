# GPU Optimization Guide for RTX 4090

## Problem
When generating images, you may encounter CUDA Out of Memory errors even with a RTX 4090 (24GB VRAM):
```
CUDA out of memory. Tried to allocate 6.50 GiB. GPU 0 has a total capacity of 23.51 GiB 
of which 4.04 GiB is free. Including non-PyTorch memory, this process has 18.31 GiB memory in use.
```

## Root Causes
1. **Memory Fragmentation**: PyTorch allocates memory in chunks, leading to fragmentation
2. **Model Size**: Stable Diffusion models (especially SDXL and Flux) are very large
3. **Batch Processing**: Generating multiple images at once multiplies memory usage
4. **Cached Models**: Previous models may still be in VRAM

## Solutions Implemented

### 1. Memory Management Optimizations (in `backend/nodes/images.py`)

#### Model Loading Phase
- ✅ **Sequential CPU Offloading**: Moves model components to GPU only when needed
- ✅ **XFormers Memory Efficient Attention**: Reduces attention mechanism memory by ~40%
- ✅ **Attention Slicing**: Fallback if xformers not available
- ✅ **VAE Slicing**: Processes images in tiles for large resolutions
- ✅ **VAE Tiling**: Further reduces VAE memory usage
- ✅ **Cache Clearing**: Empties CUDA cache before loading

#### Image Generation Phase
- ✅ **Per-Image Cache Clearing**: Clears cache before and after each image
- ✅ **Garbage Collection**: Forces Python GC to free unused memory
- ✅ **CPU Generator**: Uses CPU for random number generation
- ✅ **Memory Monitoring**: Logs GPU memory usage during generation
- ✅ **Automatic Retry**: Falls back to single image generation on OOM

### 2. Environment Variables (in `start-backend-optimized.sh`)

```bash
# Reduce memory fragmentation
export PYTORCH_CUDA_ALLOC_CONF=expandable_segments:True

# Disable blocking for better performance
export CUDA_LAUNCH_BLOCKING=0

# Enable cuDNN optimizations
export TORCH_CUDNN_V8_API_ENABLED=1
```

## Usage

### Start Backend with Optimizations
```bash
./start-backend-optimized.sh
```

This script automatically sets all optimization flags and starts the backend.

### Manual Environment Setup
If you prefer to start the backend manually:
```bash
export PYTORCH_CUDA_ALLOC_CONF=expandable_segments:True
cd backend
source venv/bin/activate
python main.py
```

## Recommended Settings for Image Generation

### For RTX 4090 (24GB VRAM)

#### Stable Diffusion XL (SDXL)
- **Resolution**: 1024x1024 ✅
- **Batch Size**: 1-2 images
- **Steps**: 30-50
- **Multiple Prompts**: Process sequentially

#### Stable Diffusion 1.5
- **Resolution**: 512x512 or 768x768 ✅
- **Batch Size**: 2-4 images
- **Steps**: 20-50

#### Flux.1-dev
- **Resolution**: 1024x1024 ✅
- **Batch Size**: 1 image (very large model)
- **Steps**: 20-30

### Memory-Saving Tips

1. **Generate Images Sequentially**: Instead of `num_images=4`, run the node 4 times with `num_images=1`

2. **Use Lower Resolutions First**: Test with 512x512 before going to 1024x1024

3. **Reduce Inference Steps**: 20-30 steps often sufficient, 50+ uses more memory

4. **Clear Cache Between Runs**: 
   - Restart the backend if memory issues persist
   - Or add a "Clear Cache" node in your workflow

5. **Use Batch Processing with Tables**: 
   - Create a table with multiple prompts
   - Connect to Image Generate node
   - It will process them one by one with cache clearing

## Additional Optimizations

### Install XFormers (Highly Recommended)
XFormers provides 40% memory reduction for attention mechanisms:

```bash
cd backend
source venv/bin/activate
pip install xformers
```

### Monitor GPU Usage
```bash
# Watch GPU memory in real-time
watch -n 1 nvidia-smi

# Or use Python
python -c "
import torch
print(f'Allocated: {torch.cuda.memory_allocated()/1024**3:.2f}GB')
print(f'Reserved: {torch.cuda.memory_reserved()/1024**3:.2f}GB')
print(f'Max Allocated: {torch.cuda.max_memory_allocated()/1024**3:.2f}GB')
"
```

### Clear CUDA Cache Manually
If you need to clear cache from Python:
```python
import torch
import gc

torch.cuda.empty_cache()
gc.collect()
```

## Troubleshooting

### Still Getting OOM Errors?

1. **Restart the Backend**: Sometimes cached models accumulate
   ```bash
   # Stop backend (Ctrl+C)
   ./start-backend-optimized.sh
   ```

2. **Use Smaller Models**: Try SD 1.5 instead of SDXL
   - `runwayml/stable-diffusion-v1-5` uses ~4GB
   - `stabilityai/stable-diffusion-xl-base-1.0` uses ~7GB
   - `black-forest-labs/FLUX.1-dev` uses ~12GB

3. **Reduce Image Size**: 
   - 512x512 uses ~25% memory of 1024x1024
   - 768x768 is a good middle ground

4. **Check Other GPU Processes**:
   ```bash
   nvidia-smi
   # Kill other processes using GPU if needed
   ```

5. **Enable Aggressive Offloading**: The code now uses `enable_sequential_cpu_offload()` which is more aggressive than `enable_model_cpu_offload()`

## Performance vs Memory Trade-offs

| Setting | Memory Usage | Speed | Quality |
|---------|-------------|-------|---------|
| Full GPU (no offload) | Highest | Fastest | Same |
| Sequential CPU Offload | Medium | Medium | Same |
| Attention Slicing | Lower | Slower | Same |
| VAE Slicing | Lower | Slower | Same |
| Lower Resolution | Lowest | Fastest | Lower |

The current implementation uses **Sequential CPU Offload + Attention Slicing + VAE Slicing** for the best balance.

## Expected Memory Usage

With optimizations enabled:

| Model | Resolution | Expected VRAM |
|-------|-----------|---------------|
| SD 1.5 | 512x512 | ~3-4 GB |
| SD 1.5 | 768x768 | ~4-5 GB |
| SDXL | 1024x1024 | ~8-10 GB |
| Flux.1-dev | 1024x1024 | ~12-15 GB |

Your RTX 4090 (24GB) should handle all of these comfortably with the optimizations.

## Summary

The optimizations implemented should allow you to:
- ✅ Generate 1024x1024 images with SDXL
- ✅ Process multiple prompts sequentially
- ✅ Avoid memory fragmentation
- ✅ Automatically recover from OOM errors
- ✅ Monitor memory usage in logs

**Start the backend with**: `./start-backend-optimized.sh`
