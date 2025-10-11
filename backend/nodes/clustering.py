"""Clustering nodes for unsupervised learning."""

import pandas as pd
import numpy as np
from sklearn.cluster import KMeans, DBSCAN, AgglomerativeClustering
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import silhouette_score, davies_bouldin_score
import plotly.graph_objects as go
import plotly.express as px

from core.types import (
    NodeSpec, PortSpec, ParamSpec, PortType, ParamType,
    NodeContext, NodeResult, CachePolicy
)
from core.registry import NodeExecutor, register_node


@register_node
class KMeansClusteringNode(NodeExecutor):
    """K-Means clustering with automatic K optimization."""
    
    def __init__(self):
        super().__init__(NodeSpec(
            type="ml.kmeans_clustering",
            label="K-Means Clustering",
            category="machine_learning",
            description="K-Means clustering with elbow method and silhouette analysis",
            icon="🎯",
            color="#9C27B0",
            inputs=[
                PortSpec(name="table", type=PortType.TABLE, label="Input Data")
            ],
            outputs=[
                PortSpec(name="table", type=PortType.TABLE, label="Clustered Data")
            ],
            params=[
                ParamSpec(
                    name="feature_columns",
                    type=ParamType.MULTI_SELECT,
                    label="Feature Columns",
                    required=True,
                    description="Columns to use for clustering"
                ),
                ParamSpec(
                    name="n_clusters",
                    type=ParamType.SLIDER,
                    label="Number of Clusters (K)",
                    default=3,
                    min=2,
                    max=10,
                    step=1,
                    description="Number of clusters to create"
                ),
                ParamSpec(
                    name="auto_k",
                    type=ParamType.BOOLEAN,
                    label="Auto-detect K",
                    default=False,
                    description="Automatically find optimal K using elbow method"
                ),
                ParamSpec(
                    name="max_k_search",
                    type=ParamType.INTEGER,
                    label="Max K for Auto-search",
                    default=10,
                    min=3,
                    max=20,
                    description="Maximum K to test when auto-detecting"
                ),
                ParamSpec(
                    name="normalize",
                    type=ParamType.BOOLEAN,
                    label="Normalize Features",
                    default=True,
                    description="Standardize features before clustering"
                ),
                ParamSpec(
                    name="plot_x",
                    type=ParamType.COLUMN,
                    label="Plot X-axis",
                    description="Column for X-axis in scatter plot (optional, uses first features if empty)"
                ),
                ParamSpec(
                    name="plot_y",
                    type=ParamType.COLUMN,
                    label="Plot Y-axis",
                    description="Column for Y-axis in scatter plot"
                ),
                ParamSpec(
                    name="plot_z",
                    type=ParamType.COLUMN,
                    label="Plot Z-axis (3D)",
                    description="Column for Z-axis to create 3D plot (optional)"
                ),
                ParamSpec(
                    name="random_state",
                    type=ParamType.INTEGER,
                    label="Random Seed",
                    default=42,
                    min=0
                )
            ],
            cache_policy=CachePolicy.AUTO
        ))
    
    async def run(self, context: NodeContext) -> NodeResult:
        """Perform K-Means clustering."""
        df = context.inputs.get("table")
        
        feature_columns = context.params.get("feature_columns", [])
        if isinstance(feature_columns, str):
            feature_columns = [col.strip() for col in feature_columns.split(",") if col.strip()]
        
        if not feature_columns:
            return NodeResult(error="No feature columns selected")
        
        # Validate columns exist
        missing_cols = set(feature_columns) - set(df.columns)
        if missing_cols:
            return NodeResult(error=f"Columns not found: {missing_cols}")
        
        n_clusters = context.params.get("n_clusters", 3)
        auto_k = context.params.get("auto_k", False)
        max_k_search = context.params.get("max_k_search", 10)
        normalize = context.params.get("normalize", True)
        plot_x = context.params.get("plot_x")
        plot_y = context.params.get("plot_y")
        plot_z = context.params.get("plot_z")
        random_state = context.params.get("random_state", 42)
        
        try:
            # Extract features
            X = df[feature_columns].copy()
            
            # Handle missing values
            if X.isnull().any().any():
                X = X.fillna(X.mean())
            
            # Normalize if requested
            if normalize:
                scaler = StandardScaler()
                X_scaled = scaler.fit_transform(X)
            else:
                X_scaled = X.values
            
            # Auto-detect K if requested
            if auto_k:
                print(f"\n{'='*60}")
                print(f"🔍 AUTO-DETECTING OPTIMAL K...")
                print(f"   Testing K from 2 to {max_k_search}")
                print(f"{'='*60}\n")
                
                inertias = []
                silhouettes = []
                k_range = range(2, min(max_k_search + 1, len(df)))
                
                for k in k_range:
                    kmeans_temp = KMeans(n_clusters=k, random_state=random_state, n_init=10)
                    labels_temp = kmeans_temp.fit_predict(X_scaled)
                    inertias.append(kmeans_temp.inertia_)
                    
                    if len(set(labels_temp)) > 1:
                        sil_score = silhouette_score(X_scaled, labels_temp)
                        silhouettes.append(sil_score)
                    else:
                        silhouettes.append(0)
                    
                    print(f"   K={k}: Inertia={kmeans_temp.inertia_:.2f}, Silhouette={silhouettes[-1]:.3f}")
                
                # Find elbow using rate of change
                if len(inertias) >= 3:
                    diffs = np.diff(inertias)
                    diffs2 = np.diff(diffs)
                    elbow_idx = np.argmax(diffs2) + 2  # +2 because of double diff
                    optimal_k_elbow = list(k_range)[elbow_idx]
                else:
                    optimal_k_elbow = 3
                
                # Find best silhouette
                optimal_k_silhouette = list(k_range)[np.argmax(silhouettes)]
                
                # Use silhouette as primary metric
                n_clusters = optimal_k_silhouette
                
                print(f"\n{'='*60}")
                print(f"✅ OPTIMAL K DETECTED")
                print(f"   Elbow method suggests: K={optimal_k_elbow}")
                print(f"   Best silhouette score: K={optimal_k_silhouette}")
                print(f"   Using K={n_clusters}")
                print(f"{'='*60}\n")
            
            # Perform K-Means clustering
            print(f"🎯 Performing K-Means clustering with K={n_clusters}...")
            kmeans = KMeans(n_clusters=n_clusters, random_state=random_state, n_init=10)
            cluster_labels = kmeans.fit_predict(X_scaled)
            
            # Calculate metrics
            silhouette = silhouette_score(X_scaled, cluster_labels) if len(set(cluster_labels)) > 1 else 0
            davies_bouldin = davies_bouldin_score(X_scaled, cluster_labels)
            
            print(f"   Silhouette Score: {silhouette:.3f}")
            print(f"   Davies-Bouldin Index: {davies_bouldin:.3f}")
            print(f"   Inertia: {kmeans.inertia_:.2f}")
            
            # Add cluster labels to dataframe
            result_df = df.copy()
            result_df['cluster'] = cluster_labels
            result_df['cluster'] = result_df['cluster'].astype(str)  # Convert to string for categorical
            
            # Create output table with only feature columns + cluster
            output_df = result_df[feature_columns + ['cluster']].copy()
            
            # Create scatter plot (2D or 3D)
            # Determine if 3D plot
            is_3d = plot_z and plot_z in feature_columns
            
            # Determine plot columns - must be from feature columns
            if plot_x and plot_y:
                if plot_x not in feature_columns or plot_y not in feature_columns:
                    print(f"⚠️  Plot axes must be from feature columns. Using first features instead.")
                    print(f"   Selected: {plot_x}, {plot_y}")
                    print(f"   Available: {feature_columns}")
                    x_col = feature_columns[0]
                    y_col = feature_columns[1] if len(feature_columns) >= 2 else feature_columns[0]
                else:
                    x_col = plot_x
                    y_col = plot_y
            elif len(feature_columns) >= 2:
                x_col = feature_columns[0]
                y_col = feature_columns[1]
            else:
                return NodeResult(error="Need at least 2 feature columns for plotting")
            
            # Set Z column for 3D
            if is_3d:
                z_col = plot_z
                if len(feature_columns) >= 3 and not plot_z:
                    z_col = feature_columns[2]
                    is_3d = True
            else:
                z_col = None
            
            # Create vibrant color palette
            color_palettes = {
                2: ['#FF6B6B', '#4ECDC4'],
                3: ['#FF6B6B', '#4ECDC4', '#FFE66D'],
                4: ['#FF6B6B', '#4ECDC4', '#FFE66D', '#A8E6CF'],
                5: ['#FF6B6B', '#4ECDC4', '#FFE66D', '#A8E6CF', '#C7CEEA'],
            }
            colors = color_palettes.get(n_clusters, px.colors.qualitative.Bold[:n_clusters])
            
            fig = go.Figure()
            
            # Calculate cluster sizes for legend
            cluster_sizes = result_df['cluster'].value_counts().to_dict()
            
            # Plot each cluster (2D or 3D)
            for i in range(n_clusters):
                cluster_data = result_df[result_df['cluster'] == str(i)]
                cluster_size = len(cluster_data)
                
                if is_3d:
                    # 3D Scatter
                    fig.add_trace(go.Scatter3d(
                        x=cluster_data[x_col],
                        y=cluster_data[y_col],
                        z=cluster_data[z_col],
                        mode='markers',
                        name=f'Cluster {i} ({cluster_size} pts)',
                        marker=dict(
                            size=6,
                            color=colors[i % len(colors)],
                            line=dict(width=0.5, color='white'),
                            opacity=0.8
                        ),
                        text=[f"<b>Cluster {i}</b><br>" + "<br>".join([f"{col}: {row[col]:.2f}" if isinstance(row[col], (int, float)) else f"{col}: {row[col]}" 
                              for col in feature_columns[:4]]) 
                              for _, row in cluster_data.iterrows()],
                        hovertemplate='%{text}<extra></extra>'
                    ))
                else:
                    # 2D Scatter
                    fig.add_trace(go.Scatter(
                        x=cluster_data[x_col],
                        y=cluster_data[y_col],
                        mode='markers',
                        name=f'Cluster {i} ({cluster_size} pts)',
                        marker=dict(
                            size=10,
                            color=colors[i % len(colors)],
                            line=dict(width=1.5, color='white'),
                            opacity=0.8
                        ),
                        text=[f"<b>Cluster {i}</b><br>" + "<br>".join([f"{col}: {row[col]:.2f}" if isinstance(row[col], (int, float)) else f"{col}: {row[col]}" 
                              for col in feature_columns[:4]]) 
                              for _, row in cluster_data.iterrows()],
                        hovertemplate='%{text}<extra></extra>'
                    ))
            
            # Add centroids
            if normalize:
                centroids_original = scaler.inverse_transform(kmeans.cluster_centers_)
            else:
                centroids_original = kmeans.cluster_centers_
            
            centroids_df = pd.DataFrame(centroids_original, columns=feature_columns)
            
            # Add centroids with labels (2D or 3D)
            for i in range(n_clusters):
                if is_3d:
                    fig.add_trace(go.Scatter3d(
                        x=[centroids_df[x_col].iloc[i]],
                        y=[centroids_df[y_col].iloc[i]],
                        z=[centroids_df[z_col].iloc[i]],
                        mode='markers+text',
                        name=f'Centroid {i}',
                        marker=dict(
                            size=12,
                            color=colors[i % len(colors)],
                            symbol='diamond',
                            line=dict(width=2, color='black')
                        ),
                        text=[f'C{i}'],
                        textposition='middle center',
                        textfont=dict(color='black', size=10, family='Arial Black'),
                        showlegend=False,
                        hovertemplate=f'<b>Centroid {i}</b><br>' + 
                                     '<br>'.join([f'{col}: {centroids_df[col].iloc[i]:.2f}' for col in feature_columns[:4]]) +
                                     '<extra></extra>'
                    ))
                else:
                    fig.add_trace(go.Scatter(
                        x=[centroids_df[x_col].iloc[i]],
                        y=[centroids_df[y_col].iloc[i]],
                        mode='markers+text',
                        name=f'Centroid {i}',
                        marker=dict(
                            size=20,
                            color=colors[i % len(colors)],
                            symbol='diamond',
                            line=dict(width=3, color='black')
                        ),
                        text=[f'C{i}'],
                        textposition='middle center',
                        textfont=dict(color='black', size=10, family='Arial Black'),
                        showlegend=False,
                        hovertemplate=f'<b>Centroid {i}</b><br>' + 
                                     '<br>'.join([f'{col}: {centroids_df[col].iloc[i]:.2f}' for col in feature_columns[:4]]) +
                                     '<extra></extra>'
                    ))
            
            # Quality score emoji
            quality_emoji = '🟢' if silhouette > 0.5 else '🟡' if silhouette > 0.3 else '🔴'
            
            # Layout configuration
            layout_config = {
                'title': dict(
                    text=f'<b>K-Means Clustering {"3D" if is_3d else "2D"}</b> (K={n_clusters})<br>' +
                         f'<sub>{quality_emoji} Silhouette: {silhouette:.3f} | Davies-Bouldin: {davies_bouldin:.3f} | Inertia: {kmeans.inertia_:.0f}</sub>',
                    x=0.5,
                    xanchor='center'
                ),
                'hovermode': 'closest',
                'template': 'plotly_white',
                'height': 700 if is_3d else 600,
                'showlegend': True,
                'legend': dict(
                    title=dict(text='<b>Clusters</b>', font=dict(size=12)),
                    yanchor="top",
                    y=0.98,
                    xanchor="right",
                    x=0.98,
                    bgcolor='rgba(255,255,255,0.95)',
                    bordercolor='#ddd',
                    borderwidth=1
                ),
                'paper_bgcolor': 'white'
            }
            
            if is_3d:
                # 3D specific layout
                layout_config['scene'] = dict(
                    xaxis=dict(title=f'<b>{x_col}</b>', backgroundcolor='#fafafa', gridcolor='#e0e0e0'),
                    yaxis=dict(title=f'<b>{y_col}</b>', backgroundcolor='#fafafa', gridcolor='#e0e0e0'),
                    zaxis=dict(title=f'<b>{z_col}</b>', backgroundcolor='#fafafa', gridcolor='#e0e0e0'),
                    camera=dict(
                        eye=dict(x=1.5, y=1.5, z=1.3),
                        center=dict(x=0, y=0, z=0)
                    ),
                    aspectmode='cube'
                )
            else:
                # 2D specific layout
                layout_config['xaxis'] = dict(
                    title=dict(text=f'<b>{x_col}</b>', font=dict(size=14)),
                    gridcolor='#f0f0f0',
                    showgrid=True
                )
                layout_config['yaxis'] = dict(
                    title=dict(text=f'<b>{y_col}</b>', font=dict(size=14)),
                    gridcolor='#f0f0f0',
                    showgrid=True
                )
                layout_config['plot_bgcolor'] = '#fafafa'
            
            fig.update_layout(**layout_config)
            
            plot_json = fig.to_json()
            
            preview = {
                "plot_json": plot_json,
                "head": output_df.head(10).to_dict(orient="records"),
                "columns": output_df.columns.tolist(),
                "shape": output_df.shape,
                "show_table": True  # Flag to show table alongside plot
            }
            
            metadata = {
                "n_clusters": n_clusters,
                "silhouette_score": float(silhouette),
                "davies_bouldin_index": float(davies_bouldin),
                "inertia": float(kmeans.inertia_),
                "feature_columns": feature_columns,
                "cluster_sizes": output_df['cluster'].value_counts().to_dict(),
                "auto_detected": auto_k
            }
            
            return NodeResult(
                outputs={"table": output_df},
                metadata=metadata,
                preview=preview
            )
            
        except Exception as e:
            import traceback
            traceback.print_exc()
            return NodeResult(error=f"Clustering failed: {str(e)}")
