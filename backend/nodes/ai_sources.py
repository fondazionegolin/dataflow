"""AI-powered data source nodes using OpenAI."""

import pandas as pd
import numpy as np
from typing import Optional, List
import os
from openai import OpenAI
import json
import re
import hashlib
from pathlib import Path

from core.types import (
    NodeSpec, PortSpec, ParamSpec, PortType, ParamType,
    NodeContext, NodeResult, CachePolicy
)
from core.registry import NodeExecutor, register_node
from storage.sessions import DatasetStorage

# Global cache directory
CACHE_DIR = Path(__file__).parent.parent / ".cache" / "ai_datasets"
CACHE_DIR.mkdir(parents=True, exist_ok=True)


@register_node
class OpenAIDatasetNode(NodeExecutor):
    """Generate dataset using OpenAI based on natural language description."""
    
    def __init__(self):
        super().__init__(NodeSpec(
            type="ai.generate_dataset",
            label="AI Generate Dataset",
            category="sources",
            description="Generate realistic dataset using OpenAI based on natural language description",
            icon="🤖",
            color="#10B981",
            inputs=[],
            outputs=[
                PortSpec(
                    name="table",
                    type=PortType.TABLE,
                    label="Generated Table"
                )
            ],
            params=[
                ParamSpec(
                    name="template",
                    type=ParamType.SELECT,
                    label="Template (optional)",
                    default="custom",
                    options=[
                        "custom",
                        "classification_iris",
                        "classification_customer_churn",
                        "regression_house_prices",
                        "regression_car_performance",
                        "nlp_sentiment_reviews",
                        "nlp_spam_detection",
                        "timeseries_sales",
                        "clustering_customer_segments"
                    ],
                    description="Select a predefined template or use custom"
                ),
                ParamSpec(
                    name="n_rows",
                    type=ParamType.INTEGER,
                    label="Number of Rows",
                    default=100,
                    min=10,
                    max=10000,
                    description="Number of rows to generate"
                ),
                ParamSpec(
                    name="columns",
                    type=ParamType.STRING,
                    label="Column Names",
                    default="cilindrata,consumo",
                    description="Comma-separated column names (e.g., 'cilindrata,consumo,potenza')"
                ),
                ParamSpec(
                    name="description",
                    type=ParamType.STRING,
                    label="Dataset Description",
                    default="",
                    description="Describe in natural language what the dataset should represent and the relationships between columns"
                ),
                ParamSpec(
                    name="seed",
                    type=ParamType.INTEGER,
                    label="Random Seed",
                    default=42,
                    description="Seed for reproducibility"
                ),
                ParamSpec(
                    name="dataset_name",
                    type=ParamType.STRING,
                    label="Dataset Name (optional)",
                    default="",
                    description="Custom name for saved dataset (auto-generated if empty)"
                ),
                ParamSpec(
                    name="force_regenerate",
                    type=ParamType.BOOLEAN,
                    label="Force Regenerate",
                    default=False,
                    description="Force regeneration even if cached (costs API credits)"
                )
            ],
            cache_policy=CachePolicy.AUTO  # Cache based on params
        ))
    
    def _get_template_config(self, template: str) -> dict:
        """Get predefined template configuration."""
        templates = {
            "classification_iris": {
                "name": "Iris Flowers Classification",
                "columns": "sepal_length,sepal_width,petal_length,petal_width,species",
                "description": "Generate iris flower measurements dataset for classification. Include sepal_length (4.0-8.0 cm), sepal_width (2.0-4.5 cm), petal_length (1.0-7.0 cm), petal_width (0.1-2.5 cm) as numeric features. Species should be one of: setosa, versicolor, or virginica. Setosa has smaller petals, versicolor medium, virginica larger. Create realistic correlations between measurements and species."
            },
            "classification_customer_churn": {
                "name": "Customer Churn Prediction",
                "columns": "customer_id,age,tenure_months,monthly_charges,total_charges,contract_type,payment_method,internet_service,tech_support,churn",
                "description": "Generate customer churn dataset. Age (18-80), tenure_months (1-72), monthly_charges (20-120 euros), total_charges (calculated from tenure*monthly_charges with some variation). Contract_type: Month-to-month, One year, Two year. Payment_method: Electronic check, Mailed check, Bank transfer, Credit card. Internet_service: DSL, Fiber optic, No. Tech_support: Yes, No. Churn: Yes/No (higher churn for month-to-month contracts, lower tenure, no tech support)."
            },
            "regression_house_prices": {
                "name": "House Price Prediction",
                "columns": "square_meters,bedrooms,bathrooms,age_years,distance_center_km,garage,garden,price_euros",
                "description": "Generate house price dataset. Square_meters (50-300), bedrooms (1-5), bathrooms (1-3), age_years (0-50), distance_center_km (0-30). Garage: Yes/No, Garden: Yes/No. Price_euros should correlate positively with square_meters, bedrooms, bathrooms, garage, garden and negatively with age and distance. Base price around 100k-800k euros with realistic relationships."
            },
            "regression_car_performance": {
                "name": "Car Performance Analysis",
                "columns": "engine_cc,cylinders,horsepower,weight_kg,fuel_type,transmission,acceleration_0_100,fuel_consumption_l_100km",
                "description": "Generate car performance dataset. Engine_cc (1000-6000), cylinders (3,4,6,8), horsepower (60-500), weight_kg (800-2500). Fuel_type: Gasoline, Diesel, Hybrid, Electric. Transmission: Manual, Automatic. Acceleration_0_100 (seconds, 4-15, inversely related to horsepower/weight ratio). Fuel_consumption_l_100km (3-15, higher for larger engines and weight, lower for hybrids/electric)."
            },
            "nlp_sentiment_reviews": {
                "name": "Product Reviews Sentiment",
                "columns": "review_id,product_category,review_text,rating,helpful_votes",
                "description": "Generate product reviews dataset. Product_category: Electronics, Books, Clothing, Home, Sports. Review_text: realistic product reviews (50-200 words) with varying sentiment. Rating (1-5 stars, correlated with sentiment). Helpful_votes (0-100, higher for detailed reviews). Positive reviews (4-5 stars) should have positive language, negative reviews (1-2 stars) negative language, neutral (3 stars) mixed."
            },
            "nlp_spam_detection": {
                "name": "Email Spam Detection",
                "columns": "email_id,subject,body,sender_domain,has_links,has_attachments,is_spam",
                "description": "Generate email spam detection dataset. Subject: realistic email subjects. Body: email content (50-150 words). Sender_domain: legitimate domains (gmail.com, company.com) or suspicious (random.xyz, promo123.net). Has_links: Yes/No, Has_attachments: Yes/No. Is_spam: Yes/No. Spam emails have suspicious domains, excessive links, promotional language, urgency words. Legitimate emails have professional tone, known domains."
            },
            "timeseries_sales": {
                "name": "Monthly Sales Timeseries",
                "columns": "date,product_category,units_sold,revenue_euros,marketing_spend,season",
                "description": "Generate monthly sales timeseries (24 months). Date: YYYY-MM format. Product_category: Electronics, Clothing, Food, Books. Units_sold (100-5000), revenue_euros (calculated from units with realistic prices). Marketing_spend (1000-20000 euros). Season: Spring, Summer, Fall, Winter. Show seasonal patterns (higher sales in winter for electronics, summer for clothing), correlation between marketing spend and sales, growth trend over time."
            },
            "clustering_customer_segments": {
                "name": "Customer Segmentation",
                "columns": "customer_id,age,annual_income_euros,spending_score,purchase_frequency,avg_transaction_euros,loyalty_years",
                "description": "Generate customer segmentation dataset with distinct clusters. Age (18-70), annual_income_euros (15000-150000), spending_score (1-100), purchase_frequency (1-50 per year), avg_transaction_euros (20-500), loyalty_years (0-15). Create 3-4 natural clusters: 1) Young low-income frequent small purchases, 2) Middle-age high-income high spending, 3) Senior moderate-income loyal customers, 4) Young high-income occasional large purchases."
            }
        }
        return templates.get(template)
    
    async def run(self, context: NodeContext) -> NodeResult:
        print("[AIDataset] Starting AI dataset generation...")
        template = context.params.get("template", "custom")
        n_rows = context.params.get("n_rows", 100)
        columns_str = context.params.get("columns", "cilindrata,consumo")
        description = context.params.get("description", "")
        seed = context.params.get("seed", 42)
        force_regenerate = context.params.get("force_regenerate", False)
        dataset_name = context.params.get("dataset_name", "")
        
        print(f"[AIDataset] Template: {template}, Rows: {n_rows}, Columns: {columns_str}")
        print(f"[AIDataset] Description: {description[:100] if description else 'EMPTY'}")
        
        # Apply template if selected
        if template != "custom":
            template_config = self._get_template_config(template)
            if template_config:
                columns_str = template_config["columns"]
                description = template_config["description"]
                if not dataset_name:
                    dataset_name = template_config["name"]
                print(f"📋 Applied template: {template}")
                print(f"   Columns: {columns_str}")
                print(f"   Description: {description[:100]}...")
        
        # Parse column names
        columns = [col.strip() for col in columns_str.split(",") if col.strip()]
        print(f"[AIDataset] Parsed columns: {columns}")
        
        if not columns:
            print("[AIDataset] ERROR: No columns specified")
            return NodeResult(error="No columns specified")
        
        if not description:
            print("[AIDataset] ERROR: No description provided")
            return NodeResult(error="No description provided")
        
        print("[AIDataset] Validation passed, checking cache...")
        
        # Create cache key from parameters
        cache_key_str = f"{columns_str}_{n_rows}_{seed}_{description}"
        cache_key = hashlib.md5(cache_key_str.encode()).hexdigest()
        cache_file = CACHE_DIR / f"{cache_key}.json"
        
        # Check persistent cache first
        if cache_file.exists() and not force_regenerate:
            try:
                print(f"\n{'='*60}")
                print(f"✅ Using PERSISTENT cached AI dataset")
                print(f"   Cache Key: {cache_key[:16]}...")
                print(f"   Columns: {columns_str}")
                print(f"   Rows: {n_rows}")
                print(f"   Description: {description[:100]}...")
                print(f"   💡 Dataset NOT regenerated - loaded from disk cache")
                print(f"{'='*60}\n")
                
                # Load from cache file
                with open(cache_file, 'r') as f:
                    cached_data = json.load(f)
                
                # Reconstruct DataFrame
                df = pd.DataFrame(cached_data['data'])
                
                # Return cached result
                return NodeResult(
                    outputs={"table": df},
                    metadata=cached_data['metadata'],
                    preview=cached_data['preview']
                )
            except Exception as e:
                print(f"⚠️  Cache read failed: {e}, regenerating...")
                # Continue to regeneration if cache read fails
        
        # Check for OpenAI API key
        print("[AIDataset] Checking for OpenAI API key...")
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            print("[AIDataset] ERROR: OpenAI API key not found")
            return NodeResult(
                error="OpenAI API key not found. Please set OPENAI_API_KEY in backend/.env file"
            )
        print(f"[AIDataset] API key found: {api_key[:10]}...")
        
        # Log start of generation
        print(f"\n{'='*60}")
        print(f"🤖 Starting AI dataset generation...")
        print(f"   Columns: {columns}")
        print(f"   Rows: {n_rows}")
        print(f"   Seed: {seed}")
        print(f"   Description: {description}")
        print(f"   Cache Key: {cache_key}")
        print(f"{'='*60}\n")
        
        try:
            # Initialize OpenAI client
            client = OpenAI(api_key=api_key)
            
            # Create prompt for OpenAI
            prompt = f"""You must generate EXACTLY {n_rows} rows of data.

Dataset specification:
- Columns: {', '.join(columns)}
- Number of rows: {n_rows} (MANDATORY - generate all {n_rows} rows)

Description: {description}

CRITICAL REQUIREMENTS:
1. Generate EXACTLY {n_rows} rows - not less, not more
2. Return ONLY a valid JSON array of objects
3. Each object must have these keys: {', '.join(columns)}
4. Follow the described patterns and relationships
5. Add natural variation to make data realistic
6. Use seed {seed} for consistency

Output format (JSON array with {n_rows} objects):
[
  {{"column1": value1, "column2": value2}},
  {{"column1": value3, "column2": value4}},
  ... ({n_rows} total objects)
]

IMPORTANT: Generate ALL {n_rows} rows. Do not stop early. Return ONLY the JSON array."""

            # Call OpenAI API with streaming
            print(f"🤖 Calling OpenAI API (gpt-4o-mini) with streaming...")
            
            # Calculate required tokens (rough estimate: 30 tokens per row per column)
            estimated_tokens = n_rows * len(columns) * 30
            # Add 20% buffer and cap at 16000
            max_tokens = min(16000, max(6000, int(estimated_tokens * 1.2)))
            print(f"   Estimated tokens needed: {estimated_tokens}")
            print(f"   Using max_tokens: {max_tokens} (with 20% buffer)")
            
            full_response = ""
            token_count = 0
            
            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {
                        "role": "system",
                        "content": "You are a data generation assistant. Generate realistic datasets based on user descriptions. Always return valid JSON arrays only, no markdown, no explanations."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                temperature=0.7,
                max_tokens=max_tokens,
                stream=True  # Enable streaming
            )
            
            # Collect streamed response
            print(f"📡 Streaming response from OpenAI...")
            print(f"   Progress: ", end='', flush=True)
            
            last_print = 0
            for chunk in response:
                if chunk.choices[0].delta.content:
                    content = chunk.choices[0].delta.content
                    full_response += content
                    token_count += len(content.split())
                    
                    # Print progress bar every 100 tokens
                    if token_count - last_print >= 100:
                        print(f"█", end='', flush=True)
                        last_print = token_count
            
            print(f"\n")
            print(f"{'='*60}")
            print(f"✅ STREAMING COMPLETED!")
            print(f"   📊 Total tokens received: ~{token_count}")
            print(f"   📝 Total characters: {len(full_response):,}")
            print(f"   💰 Estimated cost: ~${(token_count * 0.00015 / 1000):.4f}")
            print(f"{'='*60}")
            
            # Remove markdown code blocks if present
            generated_text = full_response
            generated_text = re.sub(r'```json\s*', '', generated_text)
            generated_text = re.sub(r'```\s*', '', generated_text)
            generated_text = generated_text.strip()
            
            # Parse JSON
            print(f"📝 Parsing JSON response...")
            try:
                data = json.loads(generated_text)
                print(f"✅ JSON parsed successfully! Got {len(data)} rows")
            except json.JSONDecodeError as e:
                print(f"❌ JSON parsing failed!")
                print(f"   Error: {str(e)}")
                print(f"   Response preview: {generated_text[:500]}...")
                return NodeResult(
                    error=f"Failed to parse OpenAI response as JSON: {str(e)}\n\nResponse preview: {generated_text[:500]}"
                )
            
            # Validate data structure
            if not isinstance(data, list):
                return NodeResult(error="OpenAI did not return a list of objects")
            
            if len(data) == 0:
                return NodeResult(error="OpenAI returned empty dataset")
            
            # Create DataFrame
            df = pd.DataFrame(data)
            
            # Ensure all specified columns exist
            missing_cols = set(columns) - set(df.columns)
            if missing_cols:
                return NodeResult(
                    error=f"OpenAI did not generate all requested columns. Missing: {missing_cols}"
                )
            
            # Select only requested columns in correct order
            df = df[columns]
            
            # Convert to numeric where possible
            for col in df.columns:
                try:
                    df[col] = pd.to_numeric(df[col])
                except:
                    pass  # Keep as is if not numeric
            
            # Check row count
            actual_rows = len(df)
            if actual_rows > n_rows:
                print(f"⚠️  OpenAI generated {actual_rows} rows, trimming to {n_rows}")
                df = df.head(n_rows)
            elif actual_rows < n_rows:
                print(f"⚠️  WARNING: OpenAI generated only {actual_rows} rows instead of {n_rows}")
                print(f"   This may be due to max_tokens limit or model constraints")
                print(f"   Try reducing the number of rows or columns")
            
            metadata = {
                "rows": len(df),
                "columns": len(df.columns),
                "column_names": df.columns.tolist(),
                "dtypes": {col: str(dtype) for col, dtype in df.dtypes.items()},
                "generated_by": "OpenAI GPT-4o-mini",
                "description": description[:100],
                "cached": False,
                "generation_timestamp": pd.Timestamp.now().isoformat()
            }
            
            preview = {
                "head": df.head(10).to_dict(orient="records"),
                "shape": df.shape,
                "columns": df.columns.tolist(),
                "dtypes": {col: str(dtype) for col, dtype in df.dtypes.items()}
            }
            
            result = NodeResult(
                outputs={"table": df},
                metadata=metadata,
                preview=preview
            )
            
            # Save to persistent cache
            try:
                cache_data = {
                    'data': df.to_dict(orient='records'),
                    'metadata': metadata,
                    'preview': preview
                }
                with open(cache_file, 'w') as f:
                    json.dump(cache_data, f)
                print(f"💾 Saved to PERSISTENT cache (key: {cache_key[:16]}...)")
                print(f"   Cache file: {cache_file.name}")
            except Exception as e:
                print(f"⚠️  Failed to save cache: {e}")
            
            # Always save to database (with auto-generated name if not provided)
            from datetime import datetime
            
            if not dataset_name or dataset_name.strip() == "":
                # Auto-generate name with timestamp
                timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
                dataset_name = f"AI_Dataset_{timestamp}"
                print(f"📝 Auto-generated dataset name: {dataset_name}")
            
            try:
                saved_dataset = DatasetStorage.save_dataset(
                    name=dataset_name,
                    data=df.to_dict(orient='records'),
                    metadata={
                        "rows": len(df),
                        "columns": df.columns.tolist(),
                        "description": description[:200] if description else "AI generated dataset",
                        "generated_by": "OpenAI GPT-4o-mini",
                        "column_types": {col: str(dtype) for col, dtype in df.dtypes.items()},
                        "auto_generated_name": not dataset_name or dataset_name.strip() == ""
                    }
                )
                print(f"\n{'='*60}")
                print(f"💾 SAVED TO DATABASE")
                print(f"   Dataset ID: {saved_dataset['id']}")
                print(f"   Name: {saved_dataset['name']}")
                print(f"   Rows: {len(df)}")
                print(f"   Columns: {', '.join(df.columns.tolist())}")
                print(f"{'='*60}\n")
                
                # Add info to metadata
                metadata['saved_to_database'] = True
                metadata['dataset_id'] = saved_dataset['id']
                metadata['dataset_name'] = saved_dataset['name']
            except Exception as e:
                print(f"⚠️  Failed to save to database: {e}")
                import traceback
                traceback.print_exc()
            
            return result
            
        except Exception as e:
            return NodeResult(error=f"OpenAI API error: {str(e)}")


@register_node
class LoadAIDatasetNode(NodeExecutor):
    """Load a previously saved AI-generated dataset."""
    
    def __init__(self):
        super().__init__(NodeSpec(
            type="ai.load_dataset",
            label="Load AI Dataset",
            category="sources",
            description="Load a previously saved AI-generated dataset from database",
            icon="📂",
            color="#4CAF50",
            inputs=[],
            outputs=[
                PortSpec(name="table", type=PortType.TABLE, label="Output Table")
            ],
            params=[
                ParamSpec(
                    name="dataset_id",
                    type=ParamType.SELECT,
                    label="Dataset",
                    required=True,
                    options=[],  # Will be populated dynamically
                    description="Select a saved dataset to load"
                )
            ],
            cache_policy=CachePolicy.AUTO
        ))
    
    async def run(self, context: NodeContext) -> NodeResult:
        dataset_id = context.params.get("dataset_id")
        
        if not dataset_id:
            return NodeResult(error="No dataset selected")
        
        try:
            # Load dataset from storage
            dataset = DatasetStorage.get_dataset(dataset_id)
            
            if not dataset:
                return NodeResult(error=f"Dataset '{dataset_id}' not found")
            
            # Convert to DataFrame
            df = pd.DataFrame(dataset['data'])
            
            print(f"\n{'='*60}")
            print(f"📂 Loaded AI Dataset from DATABASE")
            print(f"   Name: {dataset['name']}")
            print(f"   Rows: {len(df)}")
            print(f"   Columns: {', '.join(df.columns.tolist())}")
            print(f"   Created: {dataset['created_at']}")
            print(f"{'='*60}\n")
            
            preview = {
                "head": df.head(10).to_dict(orient="records"),
                "shape": df.shape,
                "columns": df.columns.tolist(),
                "dtypes": {col: str(dtype) for col, dtype in df.dtypes.items()}
            }
            
            return NodeResult(
                outputs={"table": df},
                metadata={
                    "dataset_name": dataset['name'],
                    "dataset_id": dataset_id,
                    "rows": len(df),
                    "columns": len(df.columns),
                    "column_names": df.columns.tolist(),
                    "loaded_from": "database",
                    "created_at": dataset['created_at']
                },
                preview=preview
            )
            
        except Exception as e:
            return NodeResult(error=f"Failed to load dataset: {str(e)}")
