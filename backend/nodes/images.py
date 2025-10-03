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
                PortSpec(name="model", type=PortType.MODEL, label="Model"),
                PortSpec(name="info", type=PortType.PARAMS, label="Model Info")
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
                        "runwayml/stable-diffusion-v1-5",
                        "Qwen/Qwen-VL"
                    ],
                    default="stabilityai/stable-diffusion-xl-base-1.0",
                    description="Image generation model to use"
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
        try:
            # Check dependencies
            try:
                from diffusers import DiffusionPipeline
                import torch
            except ImportError:
                return NodeResult(
                    error="Missing dependencies. Install: pip install diffusers transformers torch accelerate"
                )
            
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
            pipeline = DiffusionPipeline.from_pretrained(
                str(model_path) if use_local else model_name,
                torch_dtype=torch.float16 if device != "cpu" else torch.float32,
                use_safetensors=True
            )
            pipeline = pipeline.to(device)
            
            # Store in cache
            model_id = f"image_model_{id(pipeline)}"
            _model_cache[model_id] = {
                "pipeline": pipeline,
                "model_name": model_name,
                "device": device
            }
            
            info = {
                "model_name": model_name,
                "device": device,
                "dtype": "float16" if device != "cpu" else "float32",
                "local": use_local
            }
            
            return NodeResult(
                outputs={
                    "model": model_id,
                    "info": info
                },
                metadata=info,
                preview={
                    "type": "metrics",
                    "data": info,
                    "message": f"✅ Loaded {model_name} on {device}"
                }
            )
            
        except Exception as e:
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
                PortSpec(name="model", type=PortType.MODEL, label="Model"),
                PortSpec(name="prompt", type=PortType.PARAMS, label="Prompt"),
                PortSpec(name="negative_prompt", type=PortType.PARAMS, label="Negative Prompt", required=False)
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
                    description="Number of denoising steps (higher = better quality)"
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
            
            model_id = context.inputs.get("model")
            prompt = context.inputs.get("prompt", "")
            negative_prompt = context.inputs.get("negative_prompt", "")
            
            # Get model from cache
            if model_id not in _model_cache:
                return NodeResult(error="Model not found. Please run Image Model node first.")
            
            model_data = _model_cache[model_id]
            pipeline = model_data["pipeline"]
            
            # Parameters
            num_images = int(context.params.get("num_images", 1))
            width = int(context.params.get("width", 1024))
            height = int(context.params.get("height", 1024))
            steps = int(context.params.get("steps", 30))
            guidance = float(context.params.get("guidance_scale", 7.5))
            seed = int(context.params.get("seed", -1))
            
            # Set seed
            if seed == -1:
                seed = torch.randint(0, 2**32, (1,)).item()
            generator = torch.Generator(device=model_data["device"]).manual_seed(seed)
            
            # Generate images
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
            
            # Save images temporarily
            image_paths = []
            output_dir = Path("./outputs/images")
            output_dir.mkdir(parents=True, exist_ok=True)
            
            for i, img in enumerate(images):
                path = output_dir / f"generated_{seed}_{i}.png"
                img.save(path)
                image_paths.append(str(path))
            
            metadata = {
                "prompt": prompt,
                "negative_prompt": negative_prompt,
                "num_images": len(images),
                "width": width,
                "height": height,
                "steps": steps,
                "guidance_scale": guidance,
                "seed": seed,
                "paths": image_paths
            }
            
            return NodeResult(
                outputs={
                    "images": image_paths,
                    "metadata": metadata
                },
                metadata=metadata,
                preview={
                    "type": "metrics",
                    "data": metadata,
                    "message": f"✅ Generated {len(images)} image(s)"
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
