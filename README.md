# DataFlow Platform - Local Node-Based Data Science

A 100% local desktop application for building, executing, and sharing node-based workflows for data science, featuring synthetic dataset generation, real-time visualizations, and machine learning capabilities.

## Features

- **🔒 100% Local**: No cloud dependencies, all processing happens on your machine
- **🎨 Visual Workflows**: Drag-and-drop node-based interface with typed connections
- **📊 Real-time Visualizations**: 2D/3D plots that update automatically
- **🤖 Machine Learning**: Regression and classification with popular algorithms
- **🎲 Synthetic Data Generation**: Built-in generators for educational and testing purposes
- **♻️ Reproducible**: Seed control, pipeline versioning, and state saving
- **🔌 Extensible**: Plugin system for custom nodes

## Architecture

- **Frontend**: Tauri + React + TypeScript + React Flow
- **Backend**: FastAPI (Python) embedded in Tauri
- **Data Processing**: pandas, numpy, scikit-learn, plotly
- **Communication**: HTTP localhost + Arrow/Feather for efficient data transfer

## Project Structure

```
dataflow-platform/
├── backend/                 # Python FastAPI backend
│   ├── core/               # Core engine (DAG, scheduler, cache)
│   ├── nodes/              # Node implementations
│   ├── api/                # FastAPI routes
│   └── sdk/                # Plugin SDK
├── frontend/               # Tauri + React frontend
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── hooks/         # Custom hooks
│   │   ├── lib/           # Utilities
│   │   └── types/         # TypeScript types
│   └── src-tauri/         # Tauri configuration
└── docs/                   # Documentation

```

## Getting Started

### Prerequisites

- Python 3.10+
- Node.js 18+
- Rust (for Tauri)

### Installation

```bash
# Install Python dependencies
cd backend
pip install -r requirements.txt

# Install frontend dependencies
cd ../frontend
npm install

# Run development server
npm run tauri dev
```

## Node Categories

### 1. Data Sources
- **CSV Load**: Import CSV files with configurable parsing
- **Synthetic Generator**: Create datasets with various distributions and patterns

### 2. Data Transformation
- **View/Edit Table**: Interactive data grid with filtering and editing
- **Select Columns**: Column selection and filtering
- **Transform Columns**: Scaling, encoding, feature engineering
- **Filter Rows**: Expression-based row filtering
- **Train/Test Split**: Dataset splitting with stratification

### 3. Visualizations
- **2D Plot**: Interactive scatter plots with color/size mapping
- **3D Plot**: 3D scatter plots with rotation and zoom

### 4. Machine Learning
- **Regression**: Linear, Ridge, Lasso, Random Forest, Gradient Boosting, SVR
- **Classification**: Logistic, Random Forest, Gradient Boosting, SVC, Naive Bayes
- **Model Evaluation**: Metrics and diagnostic plots
- **Predict**: Apply trained models to new data

## 🎉 Project Status

**Version**: 0.1.0 - MVP Complete ✅  
**Status**: Ready for Development Testing  
**Date**: September 30, 2025

### What's Included
- ✅ 13 functional nodes (sources, transform, visualization, ML)
- ✅ Complete backend with execution engine and caching
- ✅ Modern React frontend with Tauri desktop support
- ✅ Comprehensive documentation (11 files)
- ✅ Example workflows and test suite
- ✅ Plugin system for extensibility

### Quick Stats
- **42 source files** (~4,000 lines of code)
- **13 ML algorithms** (regression + classification)
- **6 port types** for type-safe connections
- **12 parameter types** for flexible configuration
- **100% local** - no cloud dependencies

See `PROJECT_STATS.md` and `IMPLEMENTATION_COMPLETE.md` for full details.

## License

MIT License - See LICENSE file for details.

## Contributing

Contributions welcome! Please read CONTRIBUTING.md for guidelines.

## Support

- **Documentation**: Check `docs/` directory
- **Quick Start**: See `GETTING_STARTED.md`
- **Quick Reference**: See `QUICK_REFERENCE.md`
- **Examples**: Browse `examples/` directory
- **Issues**: Report bugs on GitHub
- **Questions**: Use GitHub Discussions
