# Changelog

All notable changes to DataFlow Platform will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2025-09-30

### Added

#### Core Features
- 100% local node-based workflow execution engine
- Visual drag-and-drop interface with React Flow
- Intelligent caching system with hash-based invalidation
- Incremental workflow execution (only changed nodes re-execute)
- DAG-based execution with topological sorting
- Type-safe port connections between nodes

#### Data Sources
- CSV file loader with configurable parsing options
- Synthetic data generator with multiple modes:
  - Classification datasets (make_classification, blobs, moons, circles)
  - Regression datasets
  - Custom distributions
  - Configurable noise, class separation, and missing values

#### Data Transformation
- Column selection (include/exclude modes)
- Row filtering with pandas query expressions
- Column transformations (standardize, min-max, robust scaling, log, sqrt)
- Train/test splitting with stratification support
- Missing value handling (drop NA)

#### Visualization
- Interactive 2D scatter plots with Plotly
- Interactive 3D scatter plots with rotation and zoom
- Histogram plots for distribution analysis
- Color and size mapping for data dimensions
- Real-time plot updates on parameter changes

#### Machine Learning
- **Regression algorithms:**
  - Linear Regression
  - Ridge, Lasso, Elastic Net
  - Random Forest Regressor
  - Gradient Boosting Regressor
  - Support Vector Regression (SVR)
  - K-Nearest Neighbors Regressor
- **Classification algorithms:**
  - Logistic Regression
  - Random Forest Classifier
  - Gradient Boosting Classifier
  - Support Vector Classifier (SVC)
  - K-Nearest Neighbors Classifier
  - Naive Bayes
- Model evaluation with cross-validation
- Prediction node for applying trained models
- Comprehensive metrics (accuracy, precision, recall, F1, R², RMSE, etc.)
- Confusion matrix visualization

#### User Interface
- Modern flat design with colorful accents
- Node palette with search and categorization
- Properties panel for parameter editing
- Toolbar with workflow controls (execute, save, load, clear)
- Node status indicators (idle, running, success, error, cached)
- Execution time display per node
- Minimap for large workflows

#### Developer Features
- Plugin system for custom nodes
- Comprehensive API documentation
- Example workflows (classification, regression)
- TypeScript type definitions
- Python type hints throughout

#### Documentation
- Getting Started guide
- API reference
- Architecture documentation
- Plugin development guide
- Example workflows

### Technical Details
- Backend: FastAPI 0.104, Python 3.10+
- Frontend: React 18.2, TypeScript 5.3, Tauri 1.5
- Data: pandas 2.1, numpy 1.26, scikit-learn 1.3
- Visualization: Plotly 5.18
- State Management: Zustand 4.4
- Canvas: React Flow 11.10

### Known Limitations
- Maximum recommended dataset size: 10M rows
- Some ML algorithms may be slow on very large datasets
- 3D plots can be slow with > 100k points
- No undo/redo functionality yet
- No auto-save feature yet

## [Unreleased]

### Planned for v0.2.0
- Undo/redo functionality
- Auto-save with configurable intervals
- Workflow templates library
- Additional ML algorithms (XGBoost, LightGBM)
- Time series analysis nodes
- SQL query node
- Enhanced error messages with suggestions
- Performance profiling tools

### Planned for v0.3.0
- Real-time collaboration via WebSocket
- GPU acceleration support
- Distributed execution
- Cloud sync (optional)
- Mobile companion app
- Workflow versioning and history

---

## Version History

- **0.1.0** (2025-09-30) - Initial MVP release
