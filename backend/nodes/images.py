"""Image generation nodes: Stable Diffusion, Flux, and other models."""

import pandas as pd
import numpy as np
from typing import Optional, Dict, Any
import json
import os
from pathlib import Path

from core.types import (
    NodeSpec, PortSpec, ParamSpec, PortType, ParamType,
    NodeContext, NodeResult, CachePolicy
)
from core.registry import NodeExecutor, register_node


# Global model cache
_model_cache = {}
MODELS_DIR = Path("./models")
MODELS_DIR.mkdir(exist_ok=True)


@register_node
class ImageModelNode(NodeExecutor):
    """Load image generation model."""
    
    def __init__(self):
        super().__init__(NodeSpec(
            type="image.model",
            label="Image Model",
            category="images",
            description="Load Stable Diffusion, Flux, or other image generation models",
            icon="🎨",
            color="#FF6B9D",
            inputs=[],
            outputs=[
                PortSpec(name="model", type=PortType.ANY, label="Model"),
                PortSpec(name="info", type=PortType.ANY, label="Model Info")
            ],
            params=[
                ParamSpec(
                    name="model_name",
                    type=ParamType.SELECT,
                    label="Model",
                    options=[
                        "stabilityai/stable-diffusion-3-medium",
                        "black-forest-labs/FLUX.1-dev",
                        "stabilityai/stable-diffusion-xl-base-1.0",
                        "stabilityai/sdxl-turbo",
                        "runwayml/stable-diffusion-v1-5",
                        "Qwen/Qwen-VL"
                    ],
                    default="stabilityai/stable-diffusion-xl-base-1.0",
                    description="Image generation model to use (SDXL Turbo is fastest)"
                ),
                ParamSpec(
                    name="device",
                    type=ParamType.SELECT,
                    label="Device",
                    options=["auto", "cpu", "cuda", "mps"],
                    default="auto",
                    description="Device to run model on"
                ),
                ParamSpec(
                    name="use_local",
                    type=ParamType.BOOLEAN,
                    label="Use Local Model",
                    default=False,
                    description="Load model from ./models directory"
                )
            ],
            cache_policy=CachePolicy.MANUAL
        ))
    
    async def run(self, context: NodeContext) -> NodeResult:
        """Load image generation model."""
        print("[ImageModel] Starting model load...")
        try:
            # Check dependencies
            try:
                from diffusers import DiffusionPipeline
                import torch
            except ImportError:
                return NodeResult(
                    error="Missing dependencies. Install: pip install diffusers transformers torch accelerate"
                )
            
            print("[ImageModel] Dependencies loaded")
            
            model_name = context.params.get("model_name")
            device = context.params.get("device", "auto")
            use_local = context.params.get("use_local", False)
            
            # Determine device
            if device == "auto":
                if torch.cuda.is_available():
                    device = "cuda"
                elif torch.backends.mps.is_available():
                    device = "mps"
                else:
                    device = "cpu"
            
            # Load model
            model_path = MODELS_DIR / model_name.replace("/", "_") if use_local else model_name
            
            if use_local and not model_path.exists():
                return NodeResult(
                    error=f"Local model not found at {model_path}. Please download the model first."
                )
            
            # Load pipeline
            print(f"[ImageModel] Loading pipeline from {model_name}...")
            
            # Workaround for transformers/diffusers compatibility issue
            # Monkey-patch to prevent offload_state_dict from being passed
            import transformers.modeling_utils as modeling_utils
            original_from_pretrained = modeling_utils.PreTrainedModel.from_pretrained
            
            @classmethod
            def patched_from_pretrained(cls, *args, **kwargs):
                # Remove offload_state_dict if present
                kwargs.pop('offload_state_dict', None)
                return original_from_pretrained.__func__(cls, *args, **kwargs)
            
            modeling_utils.PreTrainedModel.from_pretrained = patched_from_pretrained
            
            try:
                load_kwargs = {}
                if device != "cpu":
                    load_kwargs["torch_dtype"] = torch.float16
                
                pipeline = DiffusionPipeline.from_pretrained(
                    str(model_path) if use_local else model_name,
                    **load_kwargs
                )
            finally:
                # Restore original method
                modeling_utils.PreTrainedModel.from_pretrained = original_from_pretrained
            
            # Move to device with aggressive memory management
            try:
                if device == "cuda":
                    # Clear CUDA cache before loading
                    torch.cuda.empty_cache()
                    import gc
                    gc.collect()
                    
                    # Enable memory efficient attention (xformers or flash attention)
                    try:
                        pipeline.enable_xformers_memory_efficient_attention()
                        print(f"[ImageModel] Enabled xformers memory efficient attention")
                    except Exception as e:
                        print(f"[ImageModel] xformers not available: {e}")
                        try:
                            # Try flash attention as fallback
                            pipeline.enable_attention_slicing(slice_size="auto")
                            print(f"[ImageModel] Enabled attention slicing")
                        except:
                            pass
                    
                    # Enable VAE slicing for large images
                    try:
                        pipeline.enable_vae_slicing()
                        print(f"[ImageModel] Enabled VAE slicing")
                    except:
                        pass
                    
                    # Enable CPU offloading for large models to save GPU memory
                    print(f"[ImageModel] Enabling sequential CPU offloading for memory efficiency...")
                    pipeline.enable_sequential_cpu_offload()
                    
                    # Set memory efficient mode
                    if hasattr(pipeline, 'enable_vae_tiling'):
                        pipeline.enable_vae_tiling()
                        print(f"[ImageModel] Enabled VAE tiling")
                else:
                    pipeline = pipeline.to(device)
                print(f"[ImageModel] Pipeline loaded successfully on {device}")
            except torch.cuda.OutOfMemoryError:
                print(f"[ImageModel] CUDA OOM, falling back to aggressive CPU offloading...")
                torch.cuda.empty_cache()
                pipeline.enable_sequential_cpu_offload()
                device = "cuda (with CPU offload)"
            
            # Store in cache
            model_id = f"image_model_{id(pipeline)}"
            _model_cache[model_id] = pipeline
            
            info = {
                "model_name": model_name,
                "device": device,
                "dtype": "float16" if device != "cpu" else "float32",
                "local": use_local,
                "model_id": model_id
            }
            
            # Create a simple dict to represent the model (serializable)
            model_ref = {
                "model_id": model_id,
                "model_name": model_name,
                "device": device
            }
            
            # Return the model reference (serializable) instead of the pipeline object
            result = NodeResult(
                outputs={
                    "model": model_ref,  # Return serializable reference
                    "info": info
                },
                metadata=info,
                preview={
                    "type": "metrics",
                    "data": info,
                    "message": f"✅ Loaded {model_name} on {device}"
                }
            )
            
            # Debug: print what we're returning
            print(f"[ImageModel] Returning outputs: {list(result.outputs.keys())}")
            print(f"[ImageModel] Model output value: {result.outputs['model']}")
            
            return result
            
        except Exception as e:
            print(f"[ImageModel] ERROR: {str(e)}")
            import traceback
            traceback.print_exc()
            return NodeResult(error=f"Failed to load model: {str(e)}")


@register_node
class PromptNode(NodeExecutor):
    """Create and enhance prompts for image generation."""
    
    def __init__(self):
        super().__init__(NodeSpec(
            type="image.prompt",
            label="Prompt",
            category="images",
            description="Create detailed prompts for image generation",
            icon="💬",
            color="#C77DFF",
            inputs=[],
            outputs=[
                PortSpec(name="prompt", type=PortType.PARAMS, label="Prompt"),
                PortSpec(name="negative_prompt", type=PortType.PARAMS, label="Negative Prompt")
            ],
            params=[
                ParamSpec(
                    name="prompt",
                    type=ParamType.STRING,
                    label="Prompt",
                    default="A beautiful landscape with mountains and a lake",
                    description="Describe what you want to generate"
                ),
                ParamSpec(
                    name="negative_prompt",
                    type=ParamType.STRING,
                    label="Negative Prompt",
                    default="blurry, low quality, distorted",
                    description="What to avoid in the image"
                ),
                ParamSpec(
                    name="enhance_prompt",
                    type=ParamType.BOOLEAN,
                    label="Enhance Prompt",
                    default=True,
                    description="Add quality keywords automatically"
                ),
                ParamSpec(
                    name="language",
                    type=ParamType.SELECT,
                    label="Language",
                    options=["english", "italian"],
                    default="english",
                    description="Prompt language"
                )
            ],
            cache_policy=CachePolicy.MANUAL
        ))
    
    async def run(self, context: NodeContext) -> NodeResult:
        """Process prompt."""
        try:
            prompt = context.params.get("prompt", "")
            negative_prompt = context.params.get("negative_prompt", "")
            enhance = context.params.get("enhance_prompt", True)
            language = context.params.get("language", "english")
            
            # Enhance prompt with quality keywords
            if enhance:
                if language == "italian":
                    quality_keywords = ", altissima qualità, dettagliato, 8k, fotorealistico, illuminazione professionale"
                else:
                    quality_keywords = ", highly detailed, 8k, photorealistic, professional lighting, masterpiece"
                prompt = prompt + quality_keywords
            
            # Enhance negative prompt
            if enhance:
                if language == "italian":
                    negative_keywords = ", sfocato, bassa qualità, distorto, artefatti, brutto"
                else:
                    negative_keywords = ", blurry, low quality, distorted, artifacts, ugly, bad anatomy"
                if negative_prompt:
                    negative_prompt = negative_prompt + negative_keywords
                else:
                    negative_prompt = negative_keywords.strip(", ")
            
            result = {
                "prompt": prompt,
                "negative_prompt": negative_prompt,
                "enhanced": enhance
            }
            
            return NodeResult(
                outputs={
                    "prompt": prompt,
                    "negative_prompt": negative_prompt
                },
                metadata=result,
                preview={
                    "type": "metrics",
                    "data": result,
                    "message": f"✅ Prompt ready: {len(prompt)} chars"
                }
            )
            
        except Exception as e:
            return NodeResult(error=f"Failed to process prompt: {str(e)}")


@register_node
class OptimizePromptNode(NodeExecutor):
    """Optimize and translate prompts using AI for better image generation."""
    
    def __init__(self):
        super().__init__(NodeSpec(
            type="image.optimize_prompt",
            label="Optimize Prompt",
            category="images",
            description="Translate Italian prompts to English and enhance them following prompt engineering best practices",
            icon="✨",
            color="#FFD700",
            inputs=[],
            outputs=[
                PortSpec(name="prompt", type=PortType.PARAMS, label="Optimized Prompt"),
                PortSpec(name="negative_prompt", type=PortType.PARAMS, label="Negative Prompt")
            ],
            params=[
                ParamSpec(
                    name="prompt",
                    type=ParamType.STRING,
                    label="Prompt (Italian or English)",
                    default="Un paesaggio montano al tramonto con un lago cristallino",
                    description="Describe what you want to generate in Italian or English"
                ),
                ParamSpec(
                    name="style",
                    type=ParamType.SELECT,
                    label="Style Emphasis",
                    options=["photorealistic", "artistic", "cinematic", "anime", "3d_render", "oil_painting"],
                    default="photorealistic",
                    description="Visual style to emphasize"
                ),
                ParamSpec(
                    name="detail_level",
                    type=ParamType.SELECT,
                    label="Detail Level",
                    options=["minimal", "moderate", "high", "extreme"],
                    default="high",
                    description="How detailed the prompt should be"
                ),
                ParamSpec(
                    name="api_key",
                    type=ParamType.STRING,
                    label="OpenAI API Key",
                    default="",
                    description="Your OpenAI API key (or set OPENAI_API_KEY env variable)"
                )
            ],
            cache_policy=CachePolicy.MANUAL
        ))
    
    async def run(self, context: NodeContext) -> NodeResult:
        """Optimize prompt using OpenAI."""
        try:
            import os
            import openai
            
            prompt = context.params.get("prompt", "")
            style = context.params.get("style", "photorealistic")
            detail_level = context.params.get("detail_level", "high")
            api_key = context.params.get("api_key", "").strip()
            
            if not api_key:
                api_key = os.environ.get("OPENAI_API_KEY", "")
            
            if not api_key:
                return NodeResult(error="OpenAI API key required. Set it in parameters or OPENAI_API_KEY environment variable.")
            
            print(f"[OptimizePrompt] 🎨 Optimizing prompt: {prompt[:50]}...")
            print(f"[OptimizePrompt] Style: {style}, Detail: {detail_level}")
            
            # Style-specific guidelines
            style_guidelines = {
                "photorealistic": "ultra-realistic, photographic quality, natural lighting, high resolution, professional photography",
                "artistic": "artistic interpretation, creative composition, expressive, painterly quality",
                "cinematic": "cinematic lighting, dramatic atmosphere, movie-like quality, depth of field, color grading",
                "anime": "anime style, manga aesthetic, vibrant colors, clean lines, Japanese animation",
                "3d_render": "3D rendered, CGI, Octane render, Unreal Engine, ray tracing, volumetric lighting",
                "oil_painting": "oil painting style, brushstrokes visible, classical art technique, rich textures"
            }
            
            detail_instructions = {
                "minimal": "Keep it concise and simple",
                "moderate": "Add some descriptive details",
                "high": "Include rich details about composition, lighting, and atmosphere",
                "extreme": "Provide extensive details about every aspect: composition, lighting, colors, textures, mood, camera angle, and technical specifications"
            }
            
            # Create optimization prompt
            system_prompt = f"""You are an expert in prompt engineering for AI image generation (Stable Diffusion, FLUX, etc.).
Your task is to:
1. Translate Italian prompts to English (if needed)
2. Enhance the prompt following best practices for {style} style
3. Add technical details for {detail_level} detail level
4. Structure the prompt with: [main subject], [setting/environment], [lighting], [style keywords], [quality tags]
5. Keep it under 200 words

Style emphasis: {style_guidelines[style]}
Detail level: {detail_instructions[detail_level]}

Return ONLY the optimized prompt, nothing else."""

            user_prompt = f"""Original prompt: {prompt}

Optimize this prompt for image generation."""

            print(f"[OptimizePrompt] 🤖 Calling OpenAI API...")
            
            # Call OpenAI API
            client = openai.OpenAI(api_key=api_key)
            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.7,
                max_tokens=300
            )
            
            optimized_prompt = response.choices[0].message.content.strip()
            
            print(f"[OptimizePrompt] ✅ Optimized: {optimized_prompt[:100]}...")
            
            # Generate negative prompt
            negative_prompt = "blurry, low quality, distorted, artifacts, ugly, bad anatomy, deformed, disfigured, poorly drawn, bad proportions, gross proportions, malformed limbs, missing limbs, extra limbs, mutated, mutation"
            
            result = {
                "original_prompt": prompt,
                "optimized_prompt": optimized_prompt,
                "negative_prompt": negative_prompt,
                "style": style,
                "detail_level": detail_level,
                "tokens_used": response.usage.total_tokens
            }
            
            return NodeResult(
                outputs={
                    "prompt": optimized_prompt,
                    "negative_prompt": negative_prompt
                },
                metadata=result,
                preview={
                    "type": "text",
                    "data": {
                        "Original": prompt,
                        "Optimized": optimized_prompt,
                        "Style": style,
                        "Tokens": response.usage.total_tokens
                    }
                }
            )
            
        except Exception as e:
            import traceback
            traceback.print_exc()
            return NodeResult(error=f"Failed to optimize prompt: {str(e)}")


@register_node
class StyleNode(NodeExecutor):
    """Apply artistic styles to image generation."""
    
    def __init__(self):
        super().__init__(NodeSpec(
            type="image.style",
            label="Style",
            category="images",
            description="Apply artistic styles and aesthetics",
            icon="🎭",
            color="#E0AAFF",
            inputs=[
                PortSpec(name="prompt", type=PortType.PARAMS, label="Base Prompt")
            ],
            outputs=[
                PortSpec(name="styled_prompt", type=PortType.PARAMS, label="Styled Prompt")
            ],
            params=[
                ParamSpec(
                    name="style",
                    type=ParamType.SELECT,
                    label="Style",
                    options=[
                        "realistic",
                        "anime",
                        "oil_painting",
                        "watercolor",
                        "digital_art",
                        "3d_render",
                        "pixel_art",
                        "sketch",
                        "cinematic",
                        "fantasy"
                    ],
                    default="realistic",
                    description="Artistic style to apply"
                ),
                ParamSpec(
                    name="mood",
                    type=ParamType.SELECT,
                    label="Mood",
                    options=["neutral", "vibrant", "dark", "dreamy", "dramatic", "peaceful"],
                    default="neutral",
                    description="Overall mood/atmosphere"
                ),
                ParamSpec(
                    name="lighting",
                    type=ParamType.SELECT,
                    label="Lighting",
                    options=["natural", "studio", "golden_hour", "dramatic", "soft", "neon"],
                    default="natural",
                    description="Lighting style"
                )
            ],
            cache_policy=CachePolicy.MANUAL
        ))
    
    async def run(self, context: NodeContext) -> NodeResult:
        """Apply style to prompt."""
        try:
            base_prompt = context.inputs.get("prompt", "")
            style = context.params.get("style", "realistic")
            mood = context.params.get("mood", "neutral")
            lighting = context.params.get("lighting", "natural")
            
            # Style modifiers
            style_map = {
                "realistic": "photorealistic, hyperrealistic, detailed",
                "anime": "anime style, manga, cel shaded",
                "oil_painting": "oil painting, classical art, brushstrokes",
                "watercolor": "watercolor painting, soft colors, artistic",
                "digital_art": "digital art, concept art, trending on artstation",
                "3d_render": "3d render, octane render, unreal engine",
                "pixel_art": "pixel art, 8-bit, retro game style",
                "sketch": "pencil sketch, hand drawn, artistic",
                "cinematic": "cinematic, movie still, dramatic composition",
                "fantasy": "fantasy art, magical, ethereal"
            }
            
            mood_map = {
                "vibrant": "vibrant colors, saturated, energetic",
                "dark": "dark atmosphere, moody, shadows",
                "dreamy": "dreamy, soft focus, ethereal",
                "dramatic": "dramatic, high contrast, intense",
                "peaceful": "peaceful, calm, serene"
            }
            
            lighting_map = {
                "natural": "natural lighting",
                "studio": "studio lighting, professional",
                "golden_hour": "golden hour, warm lighting",
                "dramatic": "dramatic lighting, chiaroscuro",
                "soft": "soft lighting, diffused",
                "neon": "neon lighting, cyberpunk"
            }
            
            # Build styled prompt
            style_text = style_map.get(style, "")
            mood_text = mood_map.get(mood, "") if mood != "neutral" else ""
            lighting_text = lighting_map.get(lighting, "")
            
            styled_prompt = base_prompt
            if style_text:
                styled_prompt += f", {style_text}"
            if mood_text:
                styled_prompt += f", {mood_text}"
            if lighting_text:
                styled_prompt += f", {lighting_text}"
            
            result = {
                "original": base_prompt,
                "styled": styled_prompt,
                "style": style,
                "mood": mood,
                "lighting": lighting
            }
            
            return NodeResult(
                outputs={"styled_prompt": styled_prompt},
                metadata=result,
                preview={
                    "type": "metrics",
                    "data": result,
                    "message": f"✅ Applied {style} style"
                }
            )
            
        except Exception as e:
            return NodeResult(error=f"Failed to apply style: {str(e)}")


@register_node
class GenerateImageNode(NodeExecutor):
    """Generate images using the loaded model."""
    
    def __init__(self):
        super().__init__(NodeSpec(
            type="image.generate",
            label="Generate Image",
            category="images",
            description="Generate images from prompts",
            icon="✨",
            color="#9D4EDD",
            inputs=[
                PortSpec(name="model", type=PortType.ANY, label="Model"),
                PortSpec(name="prompt", type=PortType.ANY, label="Prompt (text or table)"),
                PortSpec(name="negative_prompt", type=PortType.ANY, label="Negative Prompt", required=False)
            ],
            outputs=[
                PortSpec(name="images", type=PortType.PARAMS, label="Generated Images"),
                PortSpec(name="metadata", type=PortType.PARAMS, label="Metadata")
            ],
            params=[
                ParamSpec(
                    name="num_images",
                    type=ParamType.INTEGER,
                    label="Number of Images",
                    default=1,
                    description="How many images to generate"
                ),
                ParamSpec(
                    name="width",
                    type=ParamType.SELECT,
                    label="Width",
                    options=["512", "768", "1024"],
                    default="1024",
                    description="Image width"
                ),
                ParamSpec(
                    name="height",
                    type=ParamType.SELECT,
                    label="Height",
                    options=["512", "768", "1024"],
                    default="1024",
                    description="Image height"
                ),
                ParamSpec(
                    name="steps",
                    type=ParamType.INTEGER,
                    label="Inference Steps",
                    default=30,
                    description="Number of denoising steps (higher = better quality). SDXL Turbo uses 1-4 steps automatically."
                ),
                ParamSpec(
                    name="guidance_scale",
                    type=ParamType.SLIDER,
                    label="Guidance Scale",
                    default=7.5,
                    min=1.0,
                    max=20.0,
                    step=0.5,
                    description="How closely to follow the prompt"
                ),
                ParamSpec(
                    name="seed",
                    type=ParamType.INTEGER,
                    label="Seed",
                    default=-1,
                    description="Random seed (-1 for random)"
                )
            ],
            cache_policy=CachePolicy.MANUAL
        ))
    
    async def run(self, context: NodeContext) -> NodeResult:
        """Generate images."""
        try:
            import torch
            import pandas as pd
            
            model_input = context.inputs.get("model")
            prompt_input = context.inputs.get("prompt", "")
            negative_prompt = context.inputs.get("negative_prompt", "")
            
            # Extract model_id from input (could be dict or string)
            if isinstance(model_input, dict):
                model_id = model_input.get("model_id")
            else:
                model_id = model_input
            
            # Get model from cache
            if model_id not in _model_cache:
                return NodeResult(error=f"Model not found in cache. Please run Image Model node first. Available: {list(_model_cache.keys())}")
            
            pipeline = _model_cache[model_id]
            
            # Get device from pipeline
            device = str(pipeline.device)
            
            # Handle prompt input - can be string or DataFrame
            prompts = []
            if isinstance(prompt_input, pd.DataFrame):
                # Extract prompts from DataFrame - look for 'prompt' column or first text column
                if 'prompt' in prompt_input.columns:
                    prompts = prompt_input['prompt'].tolist()
                else:
                    # Use first column
                    prompts = prompt_input.iloc[:, 0].tolist()
                print(f"[ImageGenerate] Batch mode: {len(prompts)} prompts from table")
            elif isinstance(prompt_input, str):
                prompts = [prompt_input]
            else:
                prompts = [str(prompt_input)]
            
            # Parameters
            num_images = int(context.params.get("num_images", 1))
            width = int(context.params.get("width", 1024))
            height = int(context.params.get("height", 1024))
            steps = int(context.params.get("steps", 30))
            guidance = float(context.params.get("guidance_scale", 7.5))
            seed = int(context.params.get("seed", -1))
            
            # Detect SDXL Turbo and adjust parameters automatically
            model_config = pipeline.config if hasattr(pipeline, 'config') else {}
            model_name = str(model_config.get('_name_or_path', ''))
            is_turbo = 'turbo' in model_name.lower()
            
            if is_turbo:
                print(f"[ImageGenerate] 🚀 SDXL Turbo detected - using optimized settings")
                # SDXL Turbo works best with 1-4 steps and low guidance
                if steps > 4:
                    steps = 4
                    print(f"[ImageGenerate] Adjusted steps to {steps} for Turbo model")
                if guidance > 2.0:
                    guidance = 0.0  # Turbo works best with guidance_scale=0
                    print(f"[ImageGenerate] Adjusted guidance_scale to {guidance} for Turbo model")
            
            # Generate images for all prompts
            all_images = []
            all_seeds = []
            
            for prompt_idx, prompt in enumerate(prompts):
                # Clear CUDA cache before each generation to prevent fragmentation
                if torch.cuda.is_available():
                    torch.cuda.empty_cache()
                    import gc
                    gc.collect()
                
                # Set seed (different for each prompt if -1)
                if seed == -1:
                    current_seed = torch.randint(0, 2**32, (1,)).item()
                else:
                    current_seed = seed + prompt_idx
                
                # Use CPU for generator to save GPU memory
                generator = torch.Generator(device="cpu").manual_seed(current_seed)
                
                print(f"[ImageGenerate] Generating image {prompt_idx + 1}/{len(prompts)}: {prompt[:50]}...")
                print(f"[ImageGenerate] GPU Memory: {torch.cuda.memory_allocated() / 1024**3:.2f}GB / {torch.cuda.max_memory_allocated() / 1024**3:.2f}GB")
                
                # Generate images with memory-efficient settings
                try:
                    images = pipeline(
                        prompt=prompt,
                        negative_prompt=negative_prompt if negative_prompt else None,
                        num_images_per_prompt=num_images,
                        width=width,
                        height=height,
                        num_inference_steps=steps,
                        guidance_scale=guidance,
                        generator=generator
                    ).images
                except torch.cuda.OutOfMemoryError as e:
                    print(f"[ImageGenerate] CUDA OOM during generation. Clearing cache and retrying...")
                    torch.cuda.empty_cache()
                    gc.collect()
                    # Retry with reduced batch size
                    images = pipeline(
                        prompt=prompt,
                        negative_prompt=negative_prompt if negative_prompt else None,
                        num_images_per_prompt=1,  # Reduce to 1 image at a time
                        width=width,
                        height=height,
                        num_inference_steps=steps,
                        guidance_scale=guidance,
                        generator=generator
                    ).images
                
                all_images.extend(images)
                all_seeds.extend([current_seed] * len(images))
                
                # Clear cache after each image
                if torch.cuda.is_available():
                    torch.cuda.empty_cache()
            
            # Save images temporarily and convert to base64 for preview
            import base64
            from io import BytesIO
            
            image_paths = []
            image_base64_list = []
            output_dir = Path("./outputs/images")
            output_dir.mkdir(parents=True, exist_ok=True)
            
            for i, (img, img_seed) in enumerate(zip(all_images, all_seeds)):
                # Save to file
                path = output_dir / f"generated_{img_seed}_{i}.png"
                img.save(path)
                image_paths.append(str(path))
                
                # Convert to base64 for preview (limit to first 5 for performance)
                if i < 5:
                    buffered = BytesIO()
                    img.save(buffered, format="PNG")
                    img_base64 = base64.b64encode(buffered.getvalue()).decode()
                    image_base64_list.append(f"data:image/png;base64,{img_base64}")
            
            metadata = {
                "prompts": prompts if len(prompts) > 1 else prompts[0],
                "negative_prompt": negative_prompt,
                "num_images": len(all_images),
                "num_prompts": len(prompts),
                "width": width,
                "height": height,
                "steps": steps,
                "guidance_scale": guidance,
                "seeds": all_seeds if len(all_seeds) <= 10 else f"{len(all_seeds)} seeds",
                "paths": image_paths
            }
            
            return NodeResult(
                outputs={
                    "images": image_paths,
                    "metadata": metadata
                },
                metadata=metadata,
                preview={
                    "type": "images",
                    "images": image_base64_list,
                    "data": metadata,
                    "message": f"✅ Generated {len(all_images)} image(s) from {len(prompts)} prompt(s)" + 
                               (f" (showing first 5)" if len(all_images) > 5 else "")
                }
            )
            
        except Exception as e:
            return NodeResult(error=f"Failed to generate images: {str(e)}")


@register_node
class SaveImageNode(NodeExecutor):
    """Save generated images to disk."""
    
    def __init__(self):
        super().__init__(NodeSpec(
            type="image.save",
            label="Save Image",
            category="images",
            description="Save images to specified location",
            icon="💾",
            color="#7209B7",
            inputs=[
                PortSpec(name="images", type=PortType.PARAMS, label="Images")
            ],
            outputs=[
                PortSpec(name="saved_paths", type=PortType.TABLE, label="Saved Paths")
            ],
            params=[
                ParamSpec(
                    name="output_dir",
                    type=ParamType.STRING,
                    label="Output Directory",
                    default="./outputs/images",
                    description="Where to save images"
                ),
                ParamSpec(
                    name="filename_prefix",
                    type=ParamType.STRING,
                    label="Filename Prefix",
                    default="image",
                    description="Prefix for saved files"
                ),
                ParamSpec(
                    name="format",
                    type=ParamType.SELECT,
                    label="Format",
                    options=["png", "jpg", "webp"],
                    default="png",
                    description="Image format"
                )
            ],
            cache_policy=CachePolicy.MANUAL
        ))
    
    async def run(self, context: NodeContext) -> NodeResult:
        """Save images."""
        try:
            from PIL import Image
            
            image_paths = context.inputs.get("images", [])
            output_dir = Path(context.params.get("output_dir", "./outputs/images"))
            prefix = context.params.get("filename_prefix", "image")
            format_type = context.params.get("format", "png")
            
            output_dir.mkdir(parents=True, exist_ok=True)
            
            saved_paths = []
            for i, img_path in enumerate(image_paths):
                # Load and save with new name
                img = Image.open(img_path)
                new_path = output_dir / f"{prefix}_{i:04d}.{format_type}"
                img.save(new_path, format=format_type.upper())
                saved_paths.append(str(new_path))
            
            # Create DataFrame
            df = pd.DataFrame({
                "filename": [Path(p).name for p in saved_paths],
                "path": saved_paths,
                "format": [format_type] * len(saved_paths)
            })
            
            return NodeResult(
                outputs={"saved_paths": df},
                metadata={"num_saved": len(saved_paths)},
                preview={
                    "type": "table",
                    "columns": list(df.columns),
                    "head": df.to_dict(orient="records"),
                    "shape": df.shape,
                    "message": f"✅ Saved {len(saved_paths)} image(s) to {output_dir}"
                }
            )
            
        except Exception as e:
            return NodeResult(error=f"Failed to save images: {str(e)}")
