"""Machine learning nodes: regression, classification, evaluation."""

import pandas as pd
import numpy as np
from sklearn.linear_model import LinearRegression, Ridge, Lasso, LogisticRegression
from sklearn.ensemble import RandomForestRegressor, RandomForestClassifier, GradientBoostingRegressor, GradientBoostingClassifier
from sklearn.svm import SVR, SVC
from sklearn.neighbors import KNeighborsRegressor, KNeighborsClassifier
from sklearn.naive_bayes import GaussianNB, MultinomialNB
from sklearn.feature_extraction.text import TfidfVectorizer, CountVectorizer
from sklearn.metrics import (
    mean_absolute_error, mean_squared_error, r2_score,
    accuracy_score, precision_score, recall_score, f1_score,
    confusion_matrix, classification_report, roc_auc_score, roc_curve
)
from sklearn.model_selection import cross_val_score
import plotly.graph_objects as go
import plotly.express as px
from typing import Optional, Dict, Any
import json

from core.types import (
    NodeSpec, PortSpec, ParamSpec, PortType, ParamType,
    NodeContext, NodeResult, CachePolicy
)
from core.registry import NodeExecutor, register_node


@register_node
class RegressionNode(NodeExecutor):
    """Train regression models."""
    
    def __init__(self):
        super().__init__(NodeSpec(
            type="ml.regression",
            label="Regression",
            category="machine_learning",
            description="Train regression models (Linear, Ridge, Lasso, RF, GBM, SVR)",
            icon="📉",
            color="#673AB7",
            inputs=[
                PortSpec(name="train", type=PortType.TABLE, label="Training Data")
            ],
            outputs=[
                PortSpec(name="model", type=PortType.MODEL, label="Trained Model"),
                PortSpec(name="metrics", type=PortType.METRICS, label="Metrics"),
                PortSpec(name="predictions", type=PortType.TABLE, label="Predictions")
            ],
            params=[
                ParamSpec(
                    name="algorithm",
                    type=ParamType.SELECT,
                    label="Algorithm",
                    default="linear",
                    options=["linear", "ridge", "lasso", "random_forest", "gradient_boosting", "svr", "knn"]
                ),
                ParamSpec(
                    name="target_column",
                    type=ParamType.COLUMN,
                    label="Target Column",
                    required=True
                ),
                ParamSpec(
                    name="feature_columns",
                    type=ParamType.MULTI_SELECT,
                    label="Feature Columns (empty = all except target)",
                    default=[]
                ),
                ParamSpec(
                    name="alpha",
                    type=ParamType.SLIDER,
                    label="Alpha (Ridge/Lasso)",
                    default=1.0,
                    min=0.01,
                    max=10.0,
                    step=0.1
                ),
                ParamSpec(
                    name="n_estimators",
                    type=ParamType.INTEGER,
                    label="N Estimators (RF/GBM)",
                    default=100,
                    min=10,
                    max=500
                ),
                ParamSpec(
                    name="max_depth",
                    type=ParamType.INTEGER,
                    label="Max Depth (RF/GBM)",
                    default=5,
                    min=1,
                    max=20
                ),
                ParamSpec(
                    name="cv_folds",
                    type=ParamType.INTEGER,
                    label="Cross-Validation Folds",
                    default=5,
                    min=2,
                    max=10
                )
            ],
            cache_policy=CachePolicy.AUTO
        ))
    
    async def run(self, context: NodeContext) -> NodeResult:
        """Train regression model."""
        df = context.inputs.get("train")
        algorithm = context.params.get("algorithm", "linear")
        target_col = context.params.get("target_column")
        feature_cols = context.params.get("feature_columns", [])
        alpha = context.params.get("alpha", 1.0)
        n_estimators = context.params.get("n_estimators", 100)
        max_depth = context.params.get("max_depth", 5)
        cv_folds = context.params.get("cv_folds", 5)
        
        try:
            # Prepare data
            if not feature_cols:
                feature_cols = [col for col in df.columns if col != target_col]
            
            X = df[feature_cols]
            y = df[target_col]
            
            # Select model
            if algorithm == "linear":
                model = LinearRegression()
            elif algorithm == "ridge":
                model = Ridge(alpha=alpha)
            elif algorithm == "lasso":
                model = Lasso(alpha=alpha)
            elif algorithm == "random_forest":
                model = RandomForestRegressor(n_estimators=n_estimators, max_depth=max_depth, random_state=42)
            elif algorithm == "gradient_boosting":
                model = GradientBoostingRegressor(n_estimators=n_estimators, max_depth=max_depth, random_state=42)
            elif algorithm == "svr":
                model = SVR()
            elif algorithm == "knn":
                model = KNeighborsRegressor()
            else:
                return NodeResult(error=f"Unknown algorithm: {algorithm}")
            
            # Train model
            model.fit(X, y)
            
            # Make predictions
            y_pred = model.predict(X)
            
            # Calculate metrics
            mae = mean_absolute_error(y, y_pred)
            mse = mean_squared_error(y, y_pred)
            rmse = np.sqrt(mse)
            r2 = r2_score(y, y_pred)
            
            # Cross-validation
            cv_scores = cross_val_score(model, X, y, cv=cv_folds, scoring='r2')
            
            metrics = {
                "mae": float(mae),
                "mse": float(mse),
                "rmse": float(rmse),
                "r2": float(r2),
                "cv_r2_mean": float(cv_scores.mean()),
                "cv_r2_std": float(cv_scores.std())
            }
            
            # Create predictions table
            pred_df = df.copy()
            pred_df['prediction'] = y_pred
            pred_df['residual'] = y - y_pred
            
            # Create residual plot
            fig = go.Figure()
            fig.add_trace(go.Scatter(
                x=y_pred,
                y=y - y_pred,
                mode='markers',
                name='Residuals',
                marker=dict(color='blue', opacity=0.6)
            ))
            fig.add_hline(y=0, line_dash="dash", line_color="red")
            fig.update_layout(
                title="Residual Plot",
                xaxis_title="Predicted Values",
                yaxis_title="Residuals",
                template='plotly_white'
            )
            
            preview = {
                "algorithm": algorithm,
                "metrics": metrics,
                "n_samples": len(df),
                "n_features": len(feature_cols),
                "residual_plot": fig.to_json()
            }
            
            return NodeResult(
                outputs={
                    "model": model,
                    "metrics": metrics,
                    "predictions": pred_df
                },
                metadata=metrics,
                preview=preview
            )
            
        except Exception as e:
            return NodeResult(error=f"Failed to train regression model: {str(e)}")


@register_node
class ClassificationNode(NodeExecutor):
    """Train classification models."""
    
    def __init__(self):
        super().__init__(NodeSpec(
            type="ml.classification",
            label="Classification",
            category="machine_learning",
            description="Train classification models (Logistic, RF, GBM, SVC, KNN, Naive Bayes)",
            icon="🎯",
            color="#3F51B5",
            inputs=[
                PortSpec(name="train", type=PortType.TABLE, label="Training Data")
            ],
            outputs=[
                PortSpec(name="model", type=PortType.MODEL, label="Trained Model"),
                PortSpec(name="metrics", type=PortType.METRICS, label="Metrics"),
                PortSpec(name="predictions", type=PortType.TABLE, label="Predictions")
            ],
            params=[
                ParamSpec(
                    name="algorithm",
                    type=ParamType.SELECT,
                    label="Algorithm",
                    default="logistic",
                    options=["logistic", "random_forest", "gradient_boosting", "svc", "knn", "naive_bayes"]
                ),
                ParamSpec(
                    name="target_column",
                    type=ParamType.COLUMN,
                    label="Target Column",
                    required=True
                ),
                ParamSpec(
                    name="feature_columns",
                    type=ParamType.MULTI_SELECT,
                    label="Feature Columns (empty = all except target)",
                    default=[]
                ),
                ParamSpec(
                    name="n_estimators",
                    type=ParamType.INTEGER,
                    label="N Estimators (RF/GBM)",
                    default=100,
                    min=10,
                    max=500
                ),
                ParamSpec(
                    name="max_depth",
                    type=ParamType.INTEGER,
                    label="Max Depth (RF/GBM)",
                    default=5,
                    min=1,
                    max=20
                ),
                ParamSpec(
                    name="cv_folds",
                    type=ParamType.INTEGER,
                    label="Cross-Validation Folds",
                    default=5,
                    min=2,
                    max=10
                )
            ],
            cache_policy=CachePolicy.AUTO
        ))
    
    async def run(self, context: NodeContext) -> NodeResult:
        """Train classification model."""
        df = context.inputs.get("train")
        algorithm = context.params.get("algorithm", "logistic")
        target_col = context.params.get("target_column")
        feature_cols = context.params.get("feature_columns", [])
        n_estimators = context.params.get("n_estimators", 100)
        max_depth = context.params.get("max_depth", 5)
        cv_folds = context.params.get("cv_folds", 5)
        
        try:
            # Prepare data
            if not feature_cols:
                feature_cols = [col for col in df.columns if col != target_col]
            
            X = df[feature_cols]
            y = df[target_col]
            
            # Select model
            if algorithm == "logistic":
                model = LogisticRegression(max_iter=1000, random_state=42)
            elif algorithm == "random_forest":
                model = RandomForestClassifier(n_estimators=n_estimators, max_depth=max_depth, random_state=42)
            elif algorithm == "gradient_boosting":
                model = GradientBoostingClassifier(n_estimators=n_estimators, max_depth=max_depth, random_state=42)
            elif algorithm == "svc":
                model = SVC(probability=True, random_state=42)
            elif algorithm == "knn":
                model = KNeighborsClassifier()
            elif algorithm == "naive_bayes":
                model = GaussianNB()
            else:
                return NodeResult(error=f"Unknown algorithm: {algorithm}")
            
            # Train model
            model.fit(X, y)
            
            # Make predictions
            y_pred = model.predict(X)
            y_proba = model.predict_proba(X) if hasattr(model, 'predict_proba') else None
            
            # Calculate metrics
            accuracy = accuracy_score(y, y_pred)
            
            # Handle binary vs multiclass
            n_classes = len(np.unique(y))
            average = 'binary' if n_classes == 2 else 'weighted'
            
            precision = precision_score(y, y_pred, average=average, zero_division=0)
            recall = recall_score(y, y_pred, average=average, zero_division=0)
            f1 = f1_score(y, y_pred, average=average, zero_division=0)
            
            # Confusion matrix
            cm = confusion_matrix(y, y_pred)
            
            # Cross-validation
            cv_scores = cross_val_score(model, X, y, cv=cv_folds, scoring='accuracy')
            
            metrics = {
                "accuracy": float(accuracy),
                "precision": float(precision),
                "recall": float(recall),
                "f1_score": float(f1),
                "cv_accuracy_mean": float(cv_scores.mean()),
                "cv_accuracy_std": float(cv_scores.std()),
                "confusion_matrix": cm.tolist()
            }
            
            # Add ROC AUC for binary classification
            if n_classes == 2 and y_proba is not None:
                roc_auc = roc_auc_score(y, y_proba[:, 1])
                metrics["roc_auc"] = float(roc_auc)
            
            # Create predictions table
            pred_df = df.copy()
            pred_df['prediction'] = y_pred
            pred_df['correct'] = (y == y_pred)
            
            if y_proba is not None:
                for i, class_label in enumerate(model.classes_):
                    pred_df[f'proba_class_{class_label}'] = y_proba[:, i]
            
            # Create confusion matrix plot
            fig = px.imshow(
                cm,
                labels=dict(x="Predicted", y="Actual", color="Count"),
                x=model.classes_,
                y=model.classes_,
                title="Confusion Matrix",
                color_continuous_scale='Blues',
                text_auto=True
            )
            
            preview = {
                "algorithm": algorithm,
                "metrics": metrics,
                "n_samples": len(df),
                "n_features": len(feature_cols),
                "n_classes": n_classes,
                "confusion_matrix_plot": fig.to_json()
            }
            
            return NodeResult(
                outputs={
                    "model": model,
                    "metrics": metrics,
                    "predictions": pred_df
                },
                metadata=metrics,
                preview=preview
            )
            
        except Exception as e:
            return NodeResult(error=f"Failed to train classification model: {str(e)}")


@register_node
class PredictNode(NodeExecutor):
    """Apply trained model to new data."""
    
    def __init__(self):
        super().__init__(NodeSpec(
            type="ml.predict",
            label="Predict",
            category="machine_learning",
            description="Apply a trained model to make predictions on new data",
            icon="🔮",
            color="#009688",
            inputs=[
                PortSpec(name="model", type=PortType.MODEL, label="Trained Model"),
                PortSpec(name="data", type=PortType.TABLE, label="Input Data")
            ],
            outputs=[
                PortSpec(name="predictions", type=PortType.TABLE, label="Predictions")
            ],
            params=[],
            cache_policy=CachePolicy.AUTO
        ))
    
    async def run(self, context: NodeContext) -> NodeResult:
        """Make predictions."""
        model = context.inputs.get("model")
        df = context.inputs.get("data")
        
        try:
            # Get feature columns from model
            if hasattr(model, 'feature_names_in_'):
                feature_cols = model.feature_names_in_
            else:
                # Assume all columns are features
                feature_cols = df.columns.tolist()
            
            X = df[feature_cols]
            
            # Make predictions
            y_pred = model.predict(X)
            
            # Create output table
            result_df = df.copy()
            result_df['prediction'] = y_pred
            
            # Add probabilities if available
            if hasattr(model, 'predict_proba'):
                y_proba = model.predict_proba(X)
                for i, class_label in enumerate(model.classes_):
                    result_df[f'proba_class_{class_label}'] = y_proba[:, i]
            
            preview = {
                "n_predictions": len(result_df),
                "head": result_df.head(10).to_dict(orient="records")
            }
            
            return NodeResult(
                outputs={"predictions": result_df},
                metadata={"n_predictions": len(result_df)},
                preview=preview
            )
            
        except Exception as e:
            return NodeResult(error=f"Failed to make predictions: {str(e)}")


@register_node
class TextClassificationNode(NodeExecutor):
    """Text classification with automatic vectorization."""
    
    def __init__(self):
        super().__init__(NodeSpec(
            type="ml.text_classification",
            label="Text Classification",
            category="machine_learning",
            description="Train text classifiers with TF-IDF/Count vectorization",
            icon="📝",
            color="#9C27B0",
            inputs=[
                PortSpec(name="train", type=PortType.TABLE, label="Training Data")
            ],
            outputs=[
                PortSpec(name="model", type=PortType.MODEL, label="Trained Model"),
                PortSpec(name="vectorizer", type=PortType.MODEL, label="Vectorizer"),
                PortSpec(name="metrics", type=PortType.METRICS, label="Metrics"),
                PortSpec(name="confusion_matrix", type=PortType.PARAMS, label="Confusion Matrix"),
                PortSpec(name="word_importance", type=PortType.PARAMS, label="Word Importance")
            ],
            params=[
                ParamSpec(
                    name="text_column",
                    type=ParamType.COLUMN,
                    label="Text Column",
                    description="Column containing text data",
                    required=True
                ),
                ParamSpec(
                    name="target",
                    type=ParamType.COLUMN,
                    label="Target Column",
                    description="Column with class labels",
                    required=True
                ),
                ParamSpec(
                    name="vectorizer",
                    type=ParamType.SELECT,
                    label="Vectorizer",
                    options=["tfidf", "count"],
                    default="tfidf",
                    description="Text vectorization method"
                ),
                ParamSpec(
                    name="algorithm",
                    type=ParamType.SELECT,
                    label="Algorithm",
                    options=["naive_bayes", "logistic", "random_forest", "svm"],
                    default="naive_bayes",
                    description="Classification algorithm"
                ),
                ParamSpec(
                    name="max_features",
                    type=ParamType.INTEGER,
                    label="Max Features",
                    default=1000,
                    description="Maximum number of features to extract"
                ),
                ParamSpec(
                    name="ngram_range",
                    type=ParamType.SELECT,
                    label="N-gram Range",
                    options=["1,1", "1,2", "1,3"],
                    default="1,2",
                    description="N-gram range (unigrams, bigrams, etc.)"
                ),
                ParamSpec(
                    name="test_size",
                    type=ParamType.SLIDER,
                    label="Test Size",
                    default=0.2,
                    min=0.1,
                    max=0.5,
                    step=0.05,
                    description="Proportion of data for testing"
                )
            ],
            cache_policy=CachePolicy.MANUAL
        ))
    
    async def run(self, context: NodeContext) -> NodeResult:
        """Train text classification model."""
        try:
            df = context.inputs.get("train")
            text_col = context.params.get("text_column")
            target_col = context.params.get("target")
            vectorizer_type = context.params.get("vectorizer", "tfidf")
            algorithm = context.params.get("algorithm", "naive_bayes")
            max_features = int(context.params.get("max_features", 1000))
            ngram_str = context.params.get("ngram_range", "1,2")
            test_size = float(context.params.get("test_size", 0.2))
            
            # Parse ngram range
            ngram_range = tuple(map(int, ngram_str.split(',')))
            
            # Split data
            from sklearn.model_selection import train_test_split
            X_train, X_test, y_train, y_test = train_test_split(
                df[text_col], df[target_col],
                test_size=test_size, random_state=42
            )
            
            # Vectorize text
            if vectorizer_type == "tfidf":
                vectorizer = TfidfVectorizer(
                    max_features=max_features,
                    ngram_range=ngram_range,
                    stop_words='english'
                )
            else:
                vectorizer = CountVectorizer(
                    max_features=max_features,
                    ngram_range=ngram_range,
                    stop_words='english'
                )
            
            X_train_vec = vectorizer.fit_transform(X_train)
            X_test_vec = vectorizer.transform(X_test)
            
            # Train model
            if algorithm == "naive_bayes":
                model = MultinomialNB()
            elif algorithm == "logistic":
                model = LogisticRegression(max_iter=1000)
            elif algorithm == "random_forest":
                model = RandomForestClassifier(n_estimators=100, random_state=42)
            else:  # svm
                model = SVC(kernel='linear', probability=True)
            
            model.fit(X_train_vec, y_train)
            
            # Predictions
            y_pred = model.predict(X_test_vec)
            y_pred_proba = model.predict_proba(X_test_vec) if hasattr(model, 'predict_proba') else None
            
            # Metrics
            accuracy = accuracy_score(y_test, y_pred)
            precision = precision_score(y_test, y_pred, average='weighted', zero_division=0)
            recall = recall_score(y_test, y_pred, average='weighted', zero_division=0)
            f1 = f1_score(y_test, y_pred, average='weighted', zero_division=0)
            
            # Confusion Matrix
            cm = confusion_matrix(y_test, y_pred)
            labels = sorted(df[target_col].unique())
            
            fig_cm = go.Figure(data=go.Heatmap(
                z=cm,
                x=labels,
                y=labels,
                colorscale='Blues',
                text=cm,
                texttemplate='%{text}',
                textfont={"size": 16}
            ))
            fig_cm.update_layout(
                title='Confusion Matrix',
                xaxis_title='Predicted',
                yaxis_title='Actual',
                template='plotly_white'
            )
            
            # Word Importance (for linear models)
            word_importance_plot = None
            if hasattr(model, 'coef_'):
                feature_names = vectorizer.get_feature_names_out()
                if len(model.coef_.shape) == 1:
                    coef = model.coef_
                else:
                    coef = model.coef_[0]  # First class for binary
                
                # Top 20 most important words
                top_indices = np.argsort(np.abs(coef))[-20:]
                top_words = [feature_names[i] for i in top_indices]
                top_coefs = coef[top_indices]
                
                fig_words = go.Figure(go.Bar(
                    x=top_coefs,
                    y=top_words,
                    orientation='h',
                    marker_color=['red' if c < 0 else 'green' for c in top_coefs]
                ))
                fig_words.update_layout(
                    title='Top 20 Important Words',
                    xaxis_title='Coefficient',
                    yaxis_title='Word',
                    template='plotly_white',
                    height=600
                )
                word_importance_plot = json.dumps(fig_words.to_dict())
            
            metrics = {
                "accuracy": float(accuracy),
                "precision": float(precision),
                "recall": float(recall),
                "f1_score": float(f1),
                "n_train": len(X_train),
                "n_test": len(X_test),
                "n_features": X_train_vec.shape[1]
            }
            
            return NodeResult(
                outputs={
                    "model": model,
                    "vectorizer": vectorizer,
                    "metrics": metrics,
                    "confusion_matrix": json.dumps(fig_cm.to_dict()),
                    "word_importance": word_importance_plot
                },
                metadata=metrics,
                preview={
                    "type": "plot",
                    "plot_json": json.dumps(fig_cm.to_dict()),
                    "metrics": metrics,
                    "word_importance": word_importance_plot,
                    "message": f"✅ Model trained: {accuracy:.1%} accuracy ({len(X_train)} train, {len(X_test)} test)"
                }
            )
            
        except Exception as e:
            return NodeResult(error=f"Failed to train text classifier: {str(e)}")


@register_node
class TextPredictNode(NodeExecutor):
    """Train on one dataset, predict on another."""
    
    def __init__(self):
        super().__init__(NodeSpec(
            type="ml.text_predict",
            label="Text Predict",
            category="machine_learning",
            description="Train on training data, predict on new data",
            icon="🔮",
            color="#E91E63",
            inputs=[
                PortSpec(name="train", type=PortType.TABLE, label="Training Data"),
                PortSpec(name="predict", type=PortType.TABLE, label="Data to Predict")
            ],
            outputs=[
                PortSpec(name="predictions", type=PortType.TABLE, label="Predictions")
            ],
            params=[
                ParamSpec(
                    name="text_column",
                    type=ParamType.COLUMN,
                    label="Text Column",
                    description="Column with text to classify",
                    required=True
                ),
                ParamSpec(
                    name="target_column",
                    type=ParamType.COLUMN,
                    label="Target Column (training only)",
                    description="Column with labels in training data",
                    required=True
                )
            ],
            cache_policy=CachePolicy.MANUAL
        ))
    
    async def run(self, context: NodeContext) -> NodeResult:
        """Train and predict."""
        try:
            train_df = context.inputs.get("train")
            predict_df = context.inputs.get("predict")
            text_col = context.params.get("text_column")
            target_col = context.params.get("target_column")
            
            # Train model
            vectorizer = TfidfVectorizer(max_features=500, stop_words='english')
            X_train = vectorizer.fit_transform(train_df[text_col])
            y_train = train_df[target_col]
            
            model = MultinomialNB()
            model.fit(X_train, y_train)
            
            # Predict on new data
            X_pred = vectorizer.transform(predict_df[text_col])
            predictions = model.predict(X_pred)
            proba = model.predict_proba(X_pred)
            
            # Build result
            result_df = predict_df.copy()
            result_df['predicted_class'] = predictions
            
            classes = model.classes_
            for i, cls in enumerate(classes):
                result_df[f'prob_{cls}'] = proba[:, i]
            
            preview = {
                "type": "table",
                "columns": list(result_df.columns),
                "head": result_df.head(100).to_dict(orient="records"),
                "shape": result_df.shape,
                "message": f"✅ Predicted {len(result_df)} texts"
            }
            
            return NodeResult(
                outputs={"predictions": result_df},
                metadata={"n_predictions": len(result_df)},
                preview=preview
            )
            
        except Exception as e:
            return NodeResult(error=f"Failed to predict: {str(e)}")
