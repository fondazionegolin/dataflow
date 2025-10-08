"""Large Language Model nodes: fine-tuning, generation, evaluation."""

import pandas as pd
import numpy as np
from typing import Optional, Dict, Any
import json

from core.types import (
    NodeSpec, PortSpec, ParamSpec, PortType, ParamType,
    NodeContext, NodeResult, CachePolicy
)
from core.registry import NodeExecutor, register_node


@register_node
class LLMDatasetNode(NodeExecutor):
    """Generate conversational dataset for LLM training."""
    
    def __init__(self):
        super().__init__(NodeSpec(
            type="llm.dataset",
            label="LLM Dataset",
            category="llm",
            description="Generate conversational/instructional dataset for LLM fine-tuning",
            icon="💬",
            color="#FF6B6B",
            inputs=[],
            outputs=[
                PortSpec(name="dataset", type=PortType.TABLE, label="Training Dataset")
            ],
            params=[
                ParamSpec(
                    name="format",
                    type=ParamType.SELECT,
                    label="Dataset Format",
                    options=["instruction", "conversation", "completion"],
                    default="conversation",
                    description="Type of dataset to generate"
                ),
                ParamSpec(
                    name="n_samples",
                    type=ParamType.INTEGER,
                    label="Number of Samples",
                    default=100,
                    description="Number of training examples"
                ),
                ParamSpec(
                    name="domain",
                    type=ParamType.SELECT,
                    label="Domain",
                    options=["general", "customer_support", "code", "creative_writing", "qa"],
                    default="general",
                    description="Domain for generated examples"
                ),
                ParamSpec(
                    name="language",
                    type=ParamType.SELECT,
                    label="Language",
                    options=["english", "italian"],
                    default="italian",
                    description="Language for generated text"
                ),
                ParamSpec(
                    name="custom_prompt",
                    type=ParamType.STRING,
                    label="Custom Prompt (Optional)",
                    default="",
                    description="Add custom instructions for generation"
                ),
                ParamSpec(
                    name="seed",
                    type=ParamType.INTEGER,
                    label="Random Seed",
                    default=42,
                    description="Seed for reproducibility"
                )
            ],
            cache_policy=CachePolicy.MANUAL
        ))
    
    async def run(self, context: NodeContext) -> NodeResult:
        """Generate LLM training dataset."""
        try:
            format_type = context.params.get("format", "conversation")
            n_samples = int(context.params.get("n_samples", 100))
            domain = context.params.get("domain", "general")
            language = context.params.get("language", "italian")
            custom_prompt = context.params.get("custom_prompt", "")
            seed = int(context.params.get("seed", 42))
            
            np.random.seed(seed)
            
            # Generate synthetic data based on format
            data = []
            
            if format_type == "instruction":
                # Instruction-following format
                templates = self._get_instruction_templates(domain, language)
                for i in range(n_samples):
                    template = np.random.choice(templates)
                    instruction = template["instruction"]
                    input_text = template.get("input", "")
                    output = template["output"]
                    
                    # Apply custom prompt if provided
                    if custom_prompt:
                        output = f"{custom_prompt} {output}"
                    
                    # Create combined text for training
                    if input_text:
                        text = f"Instruction: {instruction}\nInput: {input_text}\nOutput: {output}"
                    else:
                        text = f"Instruction: {instruction}\nOutput: {output}"
                    
                    data.append({
                        "instruction": instruction,
                        "input": input_text,
                        "output": output,
                        "text": text
                    })
            
            elif format_type == "conversation":
                # Multi-turn conversation
                for i in range(n_samples):
                    user_msg = self._generate_user_message(domain, language)
                    assistant_msg = self._generate_assistant_response(domain, language)
                    
                    # Apply custom prompt if provided
                    if custom_prompt:
                        assistant_msg = f"{custom_prompt} {assistant_msg}"
                    
                    # Create combined text for training
                    text = f"User: {user_msg}\nAssistant: {assistant_msg}"
                    
                    data.append({
                        "user": user_msg,
                        "assistant": assistant_msg,
                        "text": text
                    })
            
            else:  # completion
                # Simple text completion
                for i in range(n_samples):
                    prompt = self._generate_prompt(domain, language)
                    completion = self._generate_completion(domain, language)
                    
                    # Apply custom prompt
                    if custom_prompt:
                        completion = f"{custom_prompt} {completion}"
                    
                    # Create combined text
                    text = f"{prompt} {completion}"
                    
                    data.append({
                        "prompt": prompt,
                        "completion": completion,
                        "text": text
                    })
            
            df = pd.DataFrame(data)
            
            preview = {
                "type": "table",
                "columns": list(df.columns),
                "head": df.head(20).to_dict(orient="records"),
                "shape": df.shape,
                "message": f"✅ Generated {len(df)} {format_type} examples for {domain}"
            }
            
            return NodeResult(
                outputs={"dataset": df},
                metadata={
                    "n_samples": len(df),
                    "format": format_type,
                    "domain": domain
                },
                preview=preview
            )
            
        except Exception as e:
            return NodeResult(error=f"Failed to generate LLM dataset: {str(e)}")
    
    def _get_instruction_templates(self, domain: str, language: str):
        """Get instruction templates for domain and language."""
        if language == "italian":
            templates = {
                "general": [
                    {"instruction": "Riassumi il seguente testo", "output": "Questo è un riassunto del testo."},
                    {"instruction": "Traduci in inglese", "input": "Ciao mondo", "output": "Hello world"},
                    {"instruction": "Scrivi una poesia sulla natura", "output": "Gli alberi ondeggiano nella brezza gentile..."},
                ],
                "customer_support": [
                    {"instruction": "Aiuta il cliente con un rimborso", "output": "Sarò felice di aiutarti con il rimborso..."},
                    {"instruction": "Spiega la politica di reso", "output": "La nostra politica di reso permette 30 giorni..."},
                ],
                "code": [
                    {"instruction": "Scrivi una funzione Python per ordinare una lista", "output": "def ordina_lista(lst):\n    return sorted(lst)"},
                    {"instruction": "Spiega cos'è una variabile", "output": "Una variabile è un contenitore per memorizzare dati..."},
                ],
                "qa": [
                    {"instruction": "Qual è la capitale della Francia?", "output": "La capitale della Francia è Parigi."},
                    {"instruction": "Spiega la fotosintesi", "output": "La fotosintesi è il processo con cui le piante..."},
                ]
            }
        else:
            templates = {
                "general": [
                    {"instruction": "Summarize the following text", "output": "This is a summary of the text."},
                    {"instruction": "Translate to Spanish", "input": "Hello world", "output": "Hola mundo"},
                    {"instruction": "Write a poem about nature", "output": "Trees sway in gentle breeze..."},
                ],
                "customer_support": [
                    {"instruction": "Help customer with refund", "output": "I'd be happy to help with your refund..."},
                    {"instruction": "Explain return policy", "output": "Our return policy allows 30 days..."},
                ],
                "code": [
                    {"instruction": "Write a Python function to sort a list", "output": "def sort_list(lst):\n    return sorted(lst)"},
                    {"instruction": "Explain what is a variable", "output": "A variable is a container for storing data..."},
                ],
                "qa": [
                    {"instruction": "What is the capital of France?", "output": "The capital of France is Paris."},
                    {"instruction": "Explain photosynthesis", "output": "Photosynthesis is the process by which plants..."},
                ]
            }
        return templates.get(domain, templates["general"])
    
    def _generate_user_message(self, domain: str, language: str):
        if language == "italian":
            messages = [
                "Puoi aiutarmi con questo?",
                "Ho una domanda su...",
                "Come faccio a...",
                "Qual è il modo migliore per..."
            ]
        else:
            messages = [
                "Can you help me with this?",
                "I have a question about...",
                "How do I...",
                "What is the best way to..."
            ]
        return np.random.choice(messages)
    
    def _generate_assistant_response(self, domain: str, language: str):
        if language == "italian":
            responses = [
                "Sarò felice di aiutarti! Ecco cosa puoi fare...",
                "Ottima domanda! La risposta è...",
                "Lascia che te lo spieghi...",
                "Certo! Ecco come puoi farlo..."
            ]
        else:
            responses = [
                "I'd be happy to help! Here's what you can do...",
                "Great question! The answer is...",
                "Let me explain that for you...",
                "Sure! Here's how you can do it..."
            ]
        return np.random.choice(responses)
    
    def _generate_prompt(self, domain: str, language: str):
        if language == "italian":
            prompts = [
                "C'era una volta",
                "La volpe veloce",
                "In un mondo dove",
                "Gli scienziati hanno scoperto"
            ]
        else:
            prompts = [
                "Once upon a time",
                "The quick brown fox",
                "In a world where",
                "Scientists discovered"
            ]
        return np.random.choice(prompts)
    
    def _generate_completion(self, domain: str, language: str):
        if language == "italian":
            completions = [
                "c'era un regno magico...",
                "saltò sopra il cane pigro.",
                "la tecnologia governava tutto...",
                "una nuova forma di energia..."
            ]
        else:
            completions = [
                "there was a magical kingdom...",
                "jumped over the lazy dog.",
                "technology ruled everything...",
                "a new form of energy..."
            ]
        return np.random.choice(completions)


@register_node
class FineTuneLLMNode(NodeExecutor):
    """Fine-tune a pre-trained language model."""
    
    def __init__(self):
        super().__init__(NodeSpec(
            type="llm.finetune",
            label="Fine-tune LLM",
            category="llm",
            description="Fine-tune GPT-2 or DistilGPT-2 on custom dataset",
            icon="🎓",
            color="#4ECDC4",
            inputs=[
                PortSpec(name="dataset", type=PortType.TABLE, label="Training Dataset")
            ],
            outputs=[
                PortSpec(name="model", type=PortType.MODEL, label="Fine-tuned Model"),
                PortSpec(name="metrics", type=PortType.METRICS, label="Training Metrics"),
                PortSpec(name="loss_plot", type=PortType.PARAMS, label="Loss Plot"),
                PortSpec(name="loss_history", type=PortType.TABLE, label="Loss History Table")
            ],
            params=[
                ParamSpec(
                    name="base_model",
                    type=ParamType.SELECT,
                    label="Base Model",
                    options=[
                        # Small models (< 1GB VRAM) - NO AUTH REQUIRED
                        "distilgpt2",
                        "gpt2",
                        "gpt2-medium",
                        
                        # Phi models (Microsoft) - Very efficient - NO AUTH REQUIRED
                        "microsoft/phi-2",
                        
                        # Qwen models (Alibaba) - Excellent for Italian - NO AUTH REQUIRED
                        "Qwen/Qwen2-1.5B",
                        "Qwen/Qwen2-7B",
                        "Qwen/Qwen2.5-1.5B",
                        "Qwen/Qwen2.5-7B",
                        
                        # Other efficient models - NO AUTH REQUIRED
                        "stabilityai/stablelm-2-1_6b",
                        "TinyLlama/TinyLlama-1.1B-Chat-v1.0",
                        "HuggingFaceTB/SmolLM-1.7B",
                        "HuggingFaceTB/SmolLM-360M"
                    ],
                    default="microsoft/phi-2",
                    description="Pre-trained model to fine-tune. All models are open access (no HF login required). Phi-2 (2.7B) recommended for RTX 4090"
                ),
                ParamSpec(
                    name="text_column",
                    type=ParamType.COLUMN,
                    label="Text Column",
                    description="Column with text to train on",
                    required=True
                ),
                ParamSpec(
                    name="epochs",
                    type=ParamType.INTEGER,
                    label="Epochs",
                    default=3,
                    description="Number of training epochs"
                ),
                ParamSpec(
                    name="batch_size",
                    type=ParamType.INTEGER,
                    label="Batch Size",
                    default=1,
                    description="Training batch size (use 1 for low memory)"
                ),
                ParamSpec(
                    name="gradient_accumulation_steps",
                    type=ParamType.INTEGER,
                    label="Gradient Accumulation Steps",
                    default=4,
                    description="Accumulate gradients over N steps (simulates larger batch)"
                ),
                ParamSpec(
                    name="use_cpu",
                    type=ParamType.BOOLEAN,
                    label="Use CPU Only",
                    default=False,
                    description="Train on CPU instead of GPU (slower but no memory issues)"
                ),
                ParamSpec(
                    name="fp16",
                    type=ParamType.BOOLEAN,
                    label="Use FP16 (Half Precision)",
                    default=False,
                    description="Use 16-bit precision to save memory (requires GPU)"
                ),
                ParamSpec(
                    name="learning_rate",
                    type=ParamType.NUMBER,
                    label="Learning Rate",
                    default=5e-5,
                    description="Learning rate for training"
                ),
                ParamSpec(
                    name="max_length",
                    type=ParamType.INTEGER,
                    label="Max Length",
                    default=64,
                    description="Maximum sequence length (lower = less memory)"
                ),
                ParamSpec(
                    name="max_samples",
                    type=ParamType.INTEGER,
                    label="Max Training Samples",
                    default=0,
                    description="Limit training samples (0 = use all)"
                )
            ],
            cache_policy=CachePolicy.MANUAL
        ))
    
    async def run(self, context: NodeContext) -> NodeResult:
        """Fine-tune language model."""
        try:
            # Check if transformers is available
            try:
                from transformers import (
                    AutoTokenizer, AutoModelForCausalLM,
                    TrainingArguments, Trainer, DataCollatorForLanguageModeling
                )
                from datasets import Dataset
                import torch
            except ImportError:
                return NodeResult(
                    error="Missing dependencies. Install: pip install transformers datasets torch"
                )
            
            df = context.inputs.get("dataset")
            base_model = context.params.get("base_model", "distilgpt2")
            text_col = context.params.get("text_column")
            epochs = int(context.params.get("epochs", 3))
            batch_size = int(context.params.get("batch_size", 1))
            grad_accum = int(context.params.get("gradient_accumulation_steps", 4))
            use_cpu = context.params.get("use_cpu", False)
            use_fp16 = context.params.get("fp16", False)
            lr = float(context.params.get("learning_rate", 5e-5))
            max_length = int(context.params.get("max_length", 64))
            max_samples = int(context.params.get("max_samples", 0))
            
            # Limit dataset size if specified
            if max_samples > 0 and len(df) > max_samples:
                df = df.head(max_samples)
            
            # Load model and tokenizer
            print(f"[FineTuneLLM] Loading {base_model}...")
            tokenizer = AutoTokenizer.from_pretrained(base_model, trust_remote_code=True)
            
            # Set pad token (different models use different tokens)
            if tokenizer.pad_token is None:
                tokenizer.pad_token = tokenizer.eos_token
            
            # Determine device and dtype
            device = "cpu" if use_cpu else ("cuda" if torch.cuda.is_available() else "cpu")
            
            # Auto-enable fp16 for large models on GPU
            if not use_cpu and torch.cuda.is_available():
                # Enable fp16 automatically for models > 2B parameters
                if any(x in base_model.lower() for x in ['7b', '8b', '9b', 'mistral', 'llama-3']):
                    use_fp16 = True
                    print(f"[FineTuneLLM] Auto-enabled FP16 for large model")
            
            # Clear CUDA cache before loading
            if device == "cuda":
                torch.cuda.empty_cache()
                import gc
                gc.collect()
            
            # Load model with aggressive memory optimization
            print(f"[FineTuneLLM] Loading model on {device} (FP16: {use_fp16})...")
            
            load_kwargs = {
                "low_cpu_mem_usage": True,
                "trust_remote_code": True
            }
            
            if device == "cuda" and use_fp16:
                load_kwargs["torch_dtype"] = torch.float16
            
            # For very large models, use device_map for automatic sharding
            model_size_gb = 0
            if '7b' in base_model.lower() or '8b' in base_model.lower():
                model_size_gb = 7
            elif '9b' in base_model.lower():
                model_size_gb = 9
            elif '3b' in base_model.lower():
                model_size_gb = 3
            
            # Use device_map for models > 5GB
            if model_size_gb > 5 and device == "cuda":
                load_kwargs["device_map"] = "auto"
                print(f"[FineTuneLLM] Using automatic device mapping for {model_size_gb}B model")
            
            try:
                model = AutoModelForCausalLM.from_pretrained(base_model, **load_kwargs)
            except Exception as e:
                print(f"[FineTuneLLM] Failed to load with device_map, trying standard load: {e}")
                load_kwargs.pop("device_map", None)
                model = AutoModelForCausalLM.from_pretrained(base_model, **load_kwargs)
            
            # Move to device if not using device_map
            if "device_map" not in load_kwargs:
                model = model.to(device)
            
            print(f"[FineTuneLLM] Model loaded successfully")
            
            # Enable gradient checkpointing for large models to save memory
            if model_size_gb > 2:
                model.gradient_checkpointing_enable()
                print(f"[FineTuneLLM] Enabled gradient checkpointing")
            
            # Prepare dataset
            texts = df[text_col].tolist()
            dataset = Dataset.from_dict({"text": texts})
            
            def tokenize_function(examples):
                return tokenizer(
                    examples["text"],
                    truncation=True,
                    max_length=max_length,
                    padding="max_length"
                )
            
            tokenized_dataset = dataset.map(tokenize_function, batched=True)
            
            # Training arguments with memory optimization
            training_args = TrainingArguments(
                output_dir="./llm_output",
                num_train_epochs=epochs,
                per_device_train_batch_size=batch_size,
                gradient_accumulation_steps=grad_accum,
                learning_rate=lr,
                logging_steps=5,
                save_strategy="no",
                report_to="none",
                logging_dir="./llm_logs",
                fp16=use_fp16 and not use_cpu,
                no_cuda=use_cpu,
                dataloader_pin_memory=False,
                gradient_checkpointing=True if not use_cpu else False,  # Save memory
                optim="adamw_torch",
                max_grad_norm=1.0
            )
            
            # Data collator
            data_collator = DataCollatorForLanguageModeling(
                tokenizer=tokenizer,
                mlm=False
            )
            
            # Custom callback to track loss
            from transformers import TrainerCallback
            loss_history = []
            
            class LossCallback(TrainerCallback):
                def on_log(self, args, state, control, logs=None, **kwargs):
                    if logs and 'loss' in logs:
                        loss_history.append({
                            'step': state.global_step,
                            'loss': logs['loss']
                        })
            
            # Trainer
            trainer = Trainer(
                model=model,
                args=training_args,
                train_dataset=tokenized_dataset,
                data_collator=data_collator,
                callbacks=[LossCallback()]
            )
            
            # Train with memory cleanup
            try:
                train_result = trainer.train()
            finally:
                # Clean up GPU memory after training
                if not use_cpu and torch.cuda.is_available():
                    torch.cuda.empty_cache()
            
            # Metrics
            final_loss = float(train_result.training_loss) if hasattr(train_result, 'training_loss') else (loss_history[-1]['loss'] if loss_history else 0)
            metrics = {
                "final_loss": final_loss,
                "epochs": epochs,
                "samples": len(df),
                "base_model": base_model,
                "total_steps": len(loss_history),
                "device": device,
                "batch_size": batch_size,
                "grad_accum_steps": grad_accum,
                "effective_batch_size": batch_size * grad_accum
            }
            
            # Loss plot with history
            import plotly.graph_objects as go
            fig = go.Figure()
            
            if loss_history:
                steps = [h['step'] for h in loss_history]
                losses = [h['loss'] for h in loss_history]
                fig.add_trace(go.Scatter(
                    x=steps,
                    y=losses,
                    mode='lines+markers',
                    name='Training Loss',
                    line=dict(color='#4ECDC4', width=2),
                    marker=dict(size=6)
                ))
            else:
                # Fallback to single point
                fig.add_trace(go.Scatter(
                    y=[final_loss],
                    mode='markers',
                    name='Final Loss',
                    marker=dict(size=10, color='#4ECDC4')
                ))
            
            fig.update_layout(
                title='Training Loss Over Time',
                xaxis_title='Training Step',
                yaxis_title='Loss',
                template='plotly_white',
                hovermode='x unified'
            )
            
            # Store model in context for next nodes (can't serialize PyTorch models)
            # Instead, return a reference and keep model in memory
            model_id = f"llm_model_{id(model)}"
            
            # Store in a global cache (simple approach)
            if not hasattr(FineTuneLLMNode, '_model_cache'):
                FineTuneLLMNode._model_cache = {}
            FineTuneLLMNode._model_cache[model_id] = {
                "model": model,
                "tokenizer": tokenizer,
                "base_model": base_model
            }
            
            # Create loss history DataFrame for plotting
            if loss_history:
                loss_df = pd.DataFrame(loss_history)
            else:
                # Fallback to single point
                loss_df = pd.DataFrame({
                    'step': [0],
                    'loss': [final_loss]
                })
            
            return NodeResult(
                outputs={
                    "model": model_id,  # Return ID instead of model object
                    "metrics": metrics,
                    "loss_plot": json.dumps(fig.to_dict()),
                    "loss_history": loss_df
                },
                metadata=metrics,
                preview={
                    "type": "plot",
                    "plot_json": json.dumps(fig.to_dict()),
                    "metrics": metrics,
                    "message": f"✅ Fine-tuned {base_model} on {len(df)} examples - Loss: {train_result.training_loss:.4f}"
                }
            )
            
        except Exception as e:
            return NodeResult(error=f"Failed to fine-tune LLM: {str(e)}")


@register_node
class TextGeneratorNode(NodeExecutor):
    """Generate text using fine-tuned LLM."""
    
    def __init__(self):
        super().__init__(NodeSpec(
            type="llm.generate",
            label="Text Generator",
            category="llm",
            description="Generate text using fine-tuned language model",
            icon="✨",
            color="#95E1D3",
            inputs=[
                PortSpec(name="model", type=PortType.MODEL, label="Fine-tuned Model")
            ],
            outputs=[
                PortSpec(name="generated", type=PortType.TABLE, label="Generated Texts")
            ],
            params=[
                ParamSpec(
                    name="prompt",
                    type=ParamType.STRING,
                    label="Prompt",
                    default="Once upon a time",
                    description="Starting text for generation"
                ),
                ParamSpec(
                    name="max_length",
                    type=ParamType.INTEGER,
                    label="Max Length",
                    default=100,
                    description="Maximum tokens to generate"
                ),
                ParamSpec(
                    name="temperature",
                    type=ParamType.SLIDER,
                    label="Temperature",
                    default=0.7,
                    min=0.1,
                    max=2.0,
                    step=0.1,
                    description="Sampling temperature (higher = more creative)"
                ),
                ParamSpec(
                    name="top_p",
                    type=ParamType.SLIDER,
                    label="Top P",
                    default=0.9,
                    min=0.1,
                    max=1.0,
                    step=0.05,
                    description="Nucleus sampling threshold"
                ),
                ParamSpec(
                    name="num_return_sequences",
                    type=ParamType.INTEGER,
                    label="Number of Generations",
                    default=3,
                    description="How many texts to generate"
                )
            ],
            cache_policy=CachePolicy.MANUAL
        ))
    
    async def run(self, context: NodeContext) -> NodeResult:
        """Generate text."""
        try:
            try:
                from transformers import pipeline
                import torch
            except ImportError:
                return NodeResult(
                    error="Missing dependencies. Install: pip install transformers torch"
                )
            
            model_id = context.inputs.get("model")
            
            # Retrieve model from cache
            if not hasattr(FineTuneLLMNode, '_model_cache') or model_id not in FineTuneLLMNode._model_cache:
                return NodeResult(error="Model not found. Please run Fine-tune LLM first.")
            
            model_data = FineTuneLLMNode._model_cache[model_id]
            model = model_data["model"]
            tokenizer = model_data["tokenizer"]
            
            prompt = context.params.get("prompt", "Once upon a time")
            max_length = int(context.params.get("max_length", 100))
            temperature = float(context.params.get("temperature", 0.7))
            top_p = float(context.params.get("top_p", 0.9))
            num_sequences = int(context.params.get("num_return_sequences", 3))
            
            # Generate
            generator = pipeline(
                "text-generation",
                model=model,
                tokenizer=tokenizer,
                device=-1  # CPU
            )
            
            results = generator(
                prompt,
                max_length=max_length,
                temperature=temperature,
                top_p=top_p,
                num_return_sequences=num_sequences,
                do_sample=True
            )
            
            # Build result dataframe
            generated_texts = [r["generated_text"] for r in results]
            df = pd.DataFrame({
                "prompt": [prompt] * len(generated_texts),
                "generated_text": generated_texts,
                "length": [len(t.split()) for t in generated_texts]
            })
            
            preview = {
                "type": "table",
                "columns": list(df.columns),
                "head": df.to_dict(orient="records"),
                "shape": df.shape,
                "message": f"✅ Generated {len(df)} texts"
            }
            
            return NodeResult(
                outputs={"generated": df},
                metadata={"n_generated": len(df)},
                preview=preview
            )
            
        except Exception as e:
            return NodeResult(error=f"Failed to generate text: {str(e)}")


@register_node
class LLMEvaluatorNode(NodeExecutor):
    """Evaluate LLM quality with perplexity and other metrics."""
    
    def __init__(self):
        super().__init__(NodeSpec(
            type="llm.evaluate",
            label="LLM Evaluator",
            category="llm",
            description="Evaluate language model with perplexity and loss",
            icon="📊",
            color="#F38181",
            inputs=[
                PortSpec(name="model", type=PortType.MODEL, label="Model"),
                PortSpec(name="test_data", type=PortType.TABLE, label="Test Data")
            ],
            outputs=[
                PortSpec(name="metrics", type=PortType.METRICS, label="Metrics"),
                PortSpec(name="perplexity_plot", type=PortType.PARAMS, label="Perplexity Plot")
            ],
            params=[
                ParamSpec(
                    name="text_column",
                    type=ParamType.COLUMN,
                    label="Text Column",
                    description="Column with text to evaluate",
                    required=True
                )
            ],
            cache_policy=CachePolicy.MANUAL
        ))
    
    async def run(self, context: NodeContext) -> NodeResult:
        """Evaluate model."""
        try:
            try:
                import torch
                from torch.nn import CrossEntropyLoss
            except ImportError:
                return NodeResult(error="Missing torch. Install: pip install torch")
            
            model_data = context.inputs.get("model")
            model = model_data["model"]
            tokenizer = model_data["tokenizer"]
            df = context.inputs.get("test_data")
            text_col = context.params.get("text_column")
            
            # Calculate perplexity
            texts = df[text_col].tolist()
            total_loss = 0
            n_samples = 0
            
            model.eval()
            with torch.no_grad():
                for text in texts[:50]:  # Limit to 50 for speed
                    inputs = tokenizer(text, return_tensors="pt", truncation=True, max_length=128)
                    outputs = model(**inputs, labels=inputs["input_ids"])
                    total_loss += outputs.loss.item()
                    n_samples += 1
            
            avg_loss = total_loss / n_samples
            perplexity = np.exp(avg_loss)
            
            metrics = {
                "perplexity": float(perplexity),
                "avg_loss": float(avg_loss),
                "n_samples": n_samples
            }
            
            # Simple plot
            import plotly.graph_objects as go
            fig = go.Figure()
            fig.add_trace(go.Bar(
                x=["Perplexity", "Loss"],
                y=[perplexity, avg_loss],
                marker_color=['#4ECDC4', '#FF6B6B']
            ))
            fig.update_layout(
                title='Model Evaluation',
                template='plotly_white'
            )
            
            return NodeResult(
                outputs={
                    "metrics": metrics,
                    "perplexity_plot": json.dumps(fig.to_dict())
                },
                metadata=metrics,
                preview={
                    "type": "metrics",
                    "data": metrics,
                    "message": f"✅ Perplexity: {perplexity:.2f}"
                }
            )
            
        except Exception as e:
            return NodeResult(error=f"Failed to evaluate: {str(e)}")


# Global cache for loaded models (not serializable)
_MODEL_CACHE = {}

@register_node
class LLMModelLoaderNode(NodeExecutor):
    """Load pre-trained LLM for inference."""
    
    def __init__(self):
        super().__init__(NodeSpec(
            type="llm.model_loader",
            label="LLM Model",
            category="llm",
            description="Load pre-trained language model for chat and text generation",
            icon="🤖",
            color="#6366F1",
            inputs=[],
            outputs=[
                PortSpec(name="model", type=PortType.MODEL, label="Loaded Model")
            ],
            params=[
                ParamSpec(
                    name="model_name",
                    type=ParamType.SELECT,
                    label="Model",
                    options=[
                        # Recommended models for chat
                        "microsoft/phi-2",
                        "Qwen/Qwen2.5-1.5B",
                        "Qwen/Qwen2.5-7B",
                        "TinyLlama/TinyLlama-1.1B-Chat-v1.0",
                        "HuggingFaceTB/SmolLM-1.7B",
                        # Smaller models
                        "gpt2",
                        "distilgpt2",
                    ],
                    default="microsoft/phi-2",
                    description="Pre-trained model to load. Phi-2 recommended for RTX 4090"
                ),
                ParamSpec(
                    name="use_4bit",
                    type=ParamType.BOOLEAN,
                    label="Use 4-bit Quantization",
                    default=True,
                    description="Load model in 4-bit to save VRAM (requires bitsandbytes)"
                ),
                ParamSpec(
                    name="use_8bit",
                    type=ParamType.BOOLEAN,
                    label="Use 8-bit Quantization",
                    default=False,
                    description="Load model in 8-bit (alternative to 4-bit)"
                ),
                ParamSpec(
                    name="device",
                    type=ParamType.SELECT,
                    label="Device",
                    options=["auto", "cuda", "cpu"],
                    default="auto",
                    description="Device to load model on"
                )
            ],
            cache_policy=CachePolicy.MANUAL
        ))
    
    async def run(self, context: NodeContext) -> NodeResult:
        """Load LLM model."""
        try:
            from transformers import AutoModelForCausalLM, AutoTokenizer
            import torch
            
            model_name = context.params.get("model_name", "microsoft/phi-2")
            use_4bit = context.params.get("use_4bit", True)
            use_8bit = context.params.get("use_8bit", False)
            device = context.params.get("device", "auto")
            
            print(f"\n🤖 Loading LLM Model: {model_name}")
            
            # Check if bitsandbytes is available
            quantization_config = None
            quantization_type = "full"
            try:
                if use_4bit or use_8bit:
                    from transformers import BitsAndBytesConfig
                    
                    if use_4bit:
                        quantization_config = BitsAndBytesConfig(
                            load_in_4bit=True,
                            bnb_4bit_compute_dtype=torch.float16,
                            bnb_4bit_use_double_quant=True,
                            bnb_4bit_quant_type="nf4"
                        )
                        quantization_type = "4-bit"
                    elif use_8bit:
                        quantization_config = BitsAndBytesConfig(
                            load_in_8bit=True
                        )
                        quantization_type = "8-bit"
            except ImportError:
                print("⚠️  bitsandbytes not installed, loading in full precision")
                print("   Install with: pip install bitsandbytes")
                quantization_config = None
                quantization_type = "full"
            
            print(f"   Quantization: {quantization_type}")
            print(f"   Device: {device}")
            
            # Load tokenizer
            tokenizer = AutoTokenizer.from_pretrained(model_name)
            if tokenizer.pad_token is None:
                tokenizer.pad_token = tokenizer.eos_token
            
            # Load model
            model = AutoModelForCausalLM.from_pretrained(
                model_name,
                quantization_config=quantization_config,
                device_map=device if device != "auto" else "auto",
                trust_remote_code=True,
                torch_dtype=torch.float16 if not (use_4bit or use_8bit) else None
            )
            
            model.eval()
            
            # Get model info
            total_params = sum(p.numel() for p in model.parameters())
            trainable_params = sum(p.numel() for p in model.parameters() if p.requires_grad)
            
            print(f"✅ Model loaded successfully!")
            print(f"   Total parameters: {total_params:,}")
            print(f"   Trainable parameters: {trainable_params:,}")
            
            # Store model in global cache (not serializable)
            model_id = f"{context.node_id}_{model_name}"
            _MODEL_CACHE[model_id] = {
                "model": model,
                "tokenizer": tokenizer,
                "model_name": model_name,
                "quantization": quantization_type
            }
            
            # Return only serializable model reference
            model_reference = {
                "model_id": model_id,
                "model_name": model_name,
                "quantization": quantization_type,
                "total_params": int(total_params)
            }
            
            return NodeResult(
                outputs={"model": model_reference},
                metadata={
                    "model_name": model_name,
                    "total_params": int(total_params),
                    "trainable_params": int(trainable_params),
                    "quantization": quantization_type,
                    "device": str(model.device),
                    "model_id": model_id
                },
                preview={
                    "type": "model_info",
                    "model_name": model_name,
                    "parameters": f"{total_params:,}",
                    "quantization": quantization_type
                }
            )
            
        except Exception as e:
            import traceback
            traceback.print_exc()
            return NodeResult(error=f"Failed to load model: {str(e)}")


@register_node  
class ChatNode(NodeExecutor):
    """Interactive chat with LLM."""
    
    def __init__(self):
        super().__init__(NodeSpec(
            type="llm.chat",
            label="Chat",
            category="llm",
            description="Interactive chat interface with loaded LLM model",
            icon="💬",
            color="#8B5CF6",
            inputs=[
                PortSpec(name="model", type=PortType.MODEL, label="LLM Model"),
                PortSpec(name="context", type=PortType.TABLE, label="Context Data", required=False)
            ],
            outputs=[
                PortSpec(name="conversation", type=PortType.TABLE, label="Chat History")
            ],
            params=[
                ParamSpec(
                    name="system_prompt",
                    type=ParamType.STRING,
                    label="System Prompt",
                    default="You are a helpful AI assistant.",
                    description="System instructions for the model"
                ),
                ParamSpec(
                    name="temperature",
                    type=ParamType.SLIDER,
                    label="Temperature",
                    default=0.7,
                    min=0.1,
                    max=2.0,
                    step=0.1,
                    description="Sampling temperature (higher = more creative)"
                ),
                ParamSpec(
                    name="max_new_tokens",
                    type=ParamType.INTEGER,
                    label="Max New Tokens",
                    default=512,
                    min=50,
                    max=2048,
                    description="Maximum tokens to generate in response"
                ),
                ParamSpec(
                    name="top_p",
                    type=ParamType.SLIDER,
                    label="Top P",
                    default=0.9,
                    min=0.1,
                    max=1.0,
                    step=0.05,
                    description="Nucleus sampling threshold"
                ),
                ParamSpec(
                    name="chat_history",
                    type=ParamType.STRING,
                    label="Chat History (Internal)",
                    default="[]",
                    description="Internal storage for conversation history"
                )
            ],
            cache_policy=CachePolicy.NEVER
        ))
        self.conversations = {}  # Store conversations per node instance
    
    async def run(self, context: NodeContext) -> NodeResult:
        """Generate chat response."""
        try:
            import torch
            import json
            
            # Get model reference from input
            model_reference = context.inputs.get("model")
            if not model_reference or not isinstance(model_reference, dict):
                return NodeResult(error="No model connected. Connect an LLM Model node.")
            
            # Retrieve actual model from cache
            model_id = model_reference.get("model_id")
            if not model_id or model_id not in _MODEL_CACHE:
                return NodeResult(error=f"Model not found in cache. Please re-run the LLM Model node.")
            
            model_package = _MODEL_CACHE[model_id]
            model = model_package["model"]
            tokenizer = model_package["tokenizer"]
            model_name = model_package.get("model_name", "unknown")
            
            # Get parameters
            system_prompt = context.params.get("system_prompt", "You are a helpful AI assistant.")
            temperature = float(context.params.get("temperature", 0.7))
            max_new_tokens = int(context.params.get("max_new_tokens", 512))
            top_p = float(context.params.get("top_p", 0.9))
            
            # Load chat history
            node_id = context.node_id
            if node_id not in self.conversations:
                self.conversations[node_id] = []
            
            # For now, return empty conversation (will be populated by frontend)
            # The actual chat interaction will happen through a separate API endpoint
            
            return NodeResult(
                outputs={"conversation": pd.DataFrame(self.conversations[node_id])},
                metadata={
                    "model_name": model_name,
                    "system_prompt": system_prompt,
                    "temperature": temperature,
                    "max_new_tokens": max_new_tokens,
                    "messages_count": len(self.conversations[node_id])
                },
                preview={
                    "type": "chat",
                    "model_name": model_name,
                    "system_prompt": system_prompt,
                    "conversation": self.conversations[node_id],
                    "editable": True  # Flag to show chat interface
                }
            )
            
        except Exception as e:
            import traceback
            traceback.print_exc()
            return NodeResult(error=f"Chat failed: {str(e)}")
