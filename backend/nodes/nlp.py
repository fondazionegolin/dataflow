"""NLP nodes for text analysis and sentiment analysis."""

import pandas as pd
import numpy as np
from typing import Optional
from textblob import TextBlob

from core.types import (
    NodeSpec, PortSpec, ParamSpec, PortType, ParamType,
    NodeContext, NodeResult, CachePolicy
)
from core.registry import NodeExecutor, register_node


@register_node
class SentimentAnalysisNode(NodeExecutor):
    """Perform sentiment analysis on text data."""
    
    def __init__(self):
        super().__init__(NodeSpec(
            type="nlp.sentiment",
            label="Sentiment Analysis",
            category="transform",
            description="Analyze sentiment of text (positive/negative/neutral)",
            icon="💬",
            color="#9C27B0",
            inputs=[
                PortSpec(name="table", type=PortType.TABLE, label="Input Table")
            ],
            outputs=[
                PortSpec(name="table", type=PortType.TABLE, label="Output Table")
            ],
            params=[
                ParamSpec(
                    name="text_column",
                    type=ParamType.COLUMN,
                    label="Text Column",
                    required=True,
                    description="Column containing text to analyze"
                ),
                ParamSpec(
                    name="output_polarity",
                    type=ParamType.STRING,
                    label="Polarity Column Name",
                    default="sentiment_polarity",
                    description="Name for polarity score column (-1 to 1)"
                ),
                ParamSpec(
                    name="output_label",
                    type=ParamType.STRING,
                    label="Label Column Name",
                    default="sentiment_label",
                    description="Name for sentiment label column (positive/negative/neutral)"
                ),
                ParamSpec(
                    name="neutral_threshold",
                    type=ParamType.SLIDER,
                    label="Neutral Threshold",
                    default=0.1,
                    min=0.0,
                    max=0.5,
                    step=0.05,
                    description="Threshold for neutral sentiment (±threshold)"
                )
            ],
            cache_policy=CachePolicy.AUTO
        ))
    
    async def run(self, context: NodeContext) -> NodeResult:
        """Perform sentiment analysis."""
        df = context.inputs.get("table")
        text_column = context.params.get("text_column")
        output_polarity = context.params.get("output_polarity", "sentiment_polarity")
        output_label = context.params.get("output_label", "sentiment_label")
        neutral_threshold = context.params.get("neutral_threshold", 0.1)
        
        if text_column not in df.columns:
            return NodeResult(error=f"Column '{text_column}' not found in table")
        
        try:
            # Create result dataframe
            result_df = df.copy()
            
            # Analyze sentiment for each text
            polarities = []
            labels = []
            
            for text in df[text_column]:
                if pd.isna(text) or text == "":
                    polarities.append(0.0)
                    labels.append("neutral")
                    continue
                
                try:
                    # Use TextBlob for sentiment analysis
                    blob = TextBlob(str(text))
                    polarity = blob.sentiment.polarity
                    
                    # Determine label
                    if polarity > neutral_threshold:
                        label = "positive"
                    elif polarity < -neutral_threshold:
                        label = "negative"
                    else:
                        label = "neutral"
                    
                    polarities.append(polarity)
                    labels.append(label)
                except Exception as e:
                    print(f"Error analyzing text: {e}")
                    polarities.append(0.0)
                    labels.append("neutral")
            
            # Add sentiment columns
            result_df[output_polarity] = polarities
            result_df[output_label] = labels
            
            # Calculate statistics
            sentiment_counts = pd.Series(labels).value_counts().to_dict()
            avg_polarity = np.mean(polarities)
            
            preview = {
                "head": result_df.head(10).to_dict(orient="records"),
                "shape": result_df.shape,
                "columns": result_df.columns.tolist(),
                "sentiment_distribution": sentiment_counts,
                "average_polarity": float(avg_polarity)
            }
            
            return NodeResult(
                outputs={"table": result_df},
                metadata={
                    "rows": len(result_df),
                    "columns": len(result_df.columns),
                    "sentiment_distribution": sentiment_counts,
                    "average_polarity": float(avg_polarity)
                },
                preview=preview
            )
            
        except Exception as e:
            return NodeResult(error=f"Sentiment analysis failed: {str(e)}")


@register_node
class TextCleaningNode(NodeExecutor):
    """Clean and preprocess text data."""
    
    def __init__(self):
        super().__init__(NodeSpec(
            type="nlp.clean_text",
            label="Clean Text",
            category="transform",
            description="Clean and normalize text (lowercase, remove punctuation, etc.)",
            icon="🧹",
            color="#9C27B0",
            inputs=[
                PortSpec(name="table", type=PortType.TABLE, label="Input Table")
            ],
            outputs=[
                PortSpec(name="table", type=PortType.TABLE, label="Output Table")
            ],
            params=[
                ParamSpec(
                    name="text_column",
                    type=ParamType.COLUMN,
                    label="Text Column",
                    required=True
                ),
                ParamSpec(
                    name="output_column",
                    type=ParamType.STRING,
                    label="Output Column Name",
                    default="cleaned_text",
                    description="Name for cleaned text column"
                ),
                ParamSpec(
                    name="lowercase",
                    type=ParamType.BOOLEAN,
                    label="Convert to Lowercase",
                    default=True
                ),
                ParamSpec(
                    name="remove_punctuation",
                    type=ParamType.BOOLEAN,
                    label="Remove Punctuation",
                    default=True
                ),
                ParamSpec(
                    name="remove_numbers",
                    type=ParamType.BOOLEAN,
                    label="Remove Numbers",
                    default=False
                ),
                ParamSpec(
                    name="remove_extra_spaces",
                    type=ParamType.BOOLEAN,
                    label="Remove Extra Spaces",
                    default=True
                )
            ],
            cache_policy=CachePolicy.AUTO
        ))
    
    async def run(self, context: NodeContext) -> NodeResult:
        """Clean text data."""
        df = context.inputs.get("table")
        text_column = context.params.get("text_column")
        output_column = context.params.get("output_column", "cleaned_text")
        lowercase = context.params.get("lowercase", True)
        remove_punctuation = context.params.get("remove_punctuation", True)
        remove_numbers = context.params.get("remove_numbers", False)
        remove_extra_spaces = context.params.get("remove_extra_spaces", True)
        
        if text_column not in df.columns:
            return NodeResult(error=f"Column '{text_column}' not found in table")
        
        try:
            import re
            import string
            
            result_df = df.copy()
            cleaned_texts = []
            
            for text in df[text_column]:
                if pd.isna(text) or text == "":
                    cleaned_texts.append("")
                    continue
                
                cleaned = str(text)
                
                # Lowercase
                if lowercase:
                    cleaned = cleaned.lower()
                
                # Remove punctuation
                if remove_punctuation:
                    cleaned = cleaned.translate(str.maketrans('', '', string.punctuation))
                
                # Remove numbers
                if remove_numbers:
                    cleaned = re.sub(r'\d+', '', cleaned)
                
                # Remove extra spaces
                if remove_extra_spaces:
                    cleaned = ' '.join(cleaned.split())
                
                cleaned_texts.append(cleaned)
            
            result_df[output_column] = cleaned_texts
            
            preview = {
                "head": result_df[[text_column, output_column]].head(10).to_dict(orient="records"),
                "shape": result_df.shape,
                "columns": result_df.columns.tolist()
            }
            
            return NodeResult(
                outputs={"table": result_df},
                metadata={
                    "rows": len(result_df),
                    "columns": len(result_df.columns)
                },
                preview=preview
            )
            
        except Exception as e:
            return NodeResult(error=f"Text cleaning failed: {str(e)}")
