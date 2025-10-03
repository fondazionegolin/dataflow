# Getting Started with DataFlow Platform

## Quick Start

### Prerequisites

1. **Python 3.10+**
   ```bash
   python3 --version
   ```

2. **Node.js 18+**
   ```bash
   node --version
   ```

3. **Rust** (for Tauri builds)
   ```bash
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   ```

### Installation

1. **Clone or navigate to the project**
   ```bash
   cd /Users/alessandrosaracino/CascadeProjects/dataflow-platform
   ```

2. **Install Python dependencies**
   ```bash
   cd backend
   python3 -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   cd ..
   ```

3. **Install Node dependencies**
   ```bash
   cd frontend
   npm install
   cd ..
   ```

### Running the Application

#### Option 1: Development Mode (Web Browser)

1. **Start the backend server:**
   ```bash
   chmod +x start-backend.sh
   ./start-backend.sh
   ```
   
   The backend will start on `http://127.0.0.1:8765`

2. **In a new terminal, start the frontend:**
   ```bash
   cd frontend
   npm run dev
   ```
   
   Open your browser to `http://localhost:1420`

#### Option 2: Tauri Desktop App (Development)

```bash
cd frontend
npm run tauri:dev
```

This will start both the backend and launch the desktop application.

#### Option 3: Quick Start Script

```bash
chmod +x start-dev.sh
./start-dev.sh
```

## Basic Usage

### Creating Your First Workflow

1. **Add a Data Source Node**
   - Drag "Generate Synthetic Data" from the Node Palette
   - Configure parameters in the Properties Panel (right side)
   - Set number of samples, features, etc.

2. **Add a Visualization Node**
   - Drag "2D Scatter Plot" onto the canvas
   - Connect the "table" output from the synthetic data node to the "table" input of the plot node
   - Configure X and Y columns in the properties

3. **Execute the Workflow**
   - Click the "Execute" button in the toolbar
   - Watch nodes turn green as they complete
   - View results in the preview panel

### Example Workflows

#### Example 1: Simple Classification Pipeline

1. **Generate Synthetic Data** (classification mode)
2. **Train/Test Split** (80/20)
3. **Classification** node (Random Forest)
4. **2D Scatter Plot** (visualize results)

#### Example 2: CSV Analysis

1. **Load CSV** (select your file)
2. **Select Columns** (choose relevant features)
3. **Transform Columns** (standardize)
4. **2D Scatter Plot** (explore relationships)

#### Example 3: Regression with Evaluation

1. **Generate Synthetic Data** (regression mode)
2. **Train/Test Split**
3. **Regression** node (connect train data)
4. **Predict** node (connect test data)
5. **Histogram** (visualize residuals)

## Node Categories

### 📁 Data Sources
- **Load CSV**: Import data from CSV files
- **Generate Synthetic Data**: Create datasets with various patterns

### 🔧 Transform
- **Select Columns**: Choose specific columns
- **Filter Rows**: Filter based on expressions
- **Transform Columns**: Scale, normalize, encode
- **Train/Test Split**: Split data for ML
- **Drop Missing Values**: Handle NA values

### 📊 Visualization
- **2D Scatter Plot**: Interactive 2D plots
- **3D Scatter Plot**: Interactive 3D plots
- **Histogram**: Distribution analysis

### 🤖 Machine Learning
- **Regression**: Train regression models
- **Classification**: Train classification models
- **Predict**: Apply trained models

## Keyboard Shortcuts

- **Delete**: Remove selected node/edge
- **Ctrl/Cmd + S**: Save workflow (export)
- **Ctrl/Cmd + O**: Open workflow (import)
- **Space + Drag**: Pan canvas
- **Mouse Wheel**: Zoom in/out

## Tips

1. **Use the cache**: Nodes cache their results automatically. Only changed nodes and their downstream dependencies will re-execute.

2. **Seed control**: Set a global seed in the workflow settings for reproducible results.

3. **Parameter tuning**: Use sliders for quick parameter exploration without typing.

4. **Error handling**: Red nodes indicate errors. Check the properties panel for details.

5. **Export workflows**: Save your workflows as `.flow.json` files for sharing and version control.

## Troubleshooting

### Backend won't start
- Check Python version: `python3 --version` (need 3.10+)
- Verify dependencies: `pip install -r backend/requirements.txt`
- Check port 8765 is not in use: `lsof -i :8765`

### Frontend won't connect
- Ensure backend is running on port 8765
- Check browser console for errors
- Verify CORS is enabled in backend

### Tauri build fails
- Install Rust: `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh`
- On macOS, install Xcode Command Line Tools: `xcode-select --install`
- On Linux, install required packages: `sudo apt install libwebkit2gtk-4.0-dev build-essential curl wget libssl-dev libgtk-3-dev libayatana-appindicator3-dev librsvg2-dev`

## Next Steps

- Explore the example workflows in the `examples/` directory
- Read the full documentation in `docs/`
- Check out the plugin SDK for creating custom nodes
- Join the community for support and sharing workflows

## Support

For issues and questions:
- GitHub Issues: [link]
- Documentation: `docs/`
- Examples: `examples/`
