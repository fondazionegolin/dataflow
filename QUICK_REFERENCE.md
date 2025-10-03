# DataFlow Platform - Quick Reference

## 🚀 Quick Start Commands

```bash
# Start backend only
./start-backend.sh

# Start full development environment
./start-dev.sh

# Start frontend only
cd frontend && npm run dev

# Run backend tests
cd backend && python test_backend.py

# Build desktop app
cd frontend && npm run tauri:build
```

## 📦 Installation

```bash
# Backend
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Frontend
cd frontend
npm install
```

## 🎨 Node Quick Reference

### Data Sources
| Node | Type | Purpose |
|------|------|---------|
| Load CSV | `csv.load` | Import CSV files |
| Generate Synthetic | `csv.synthetic` | Create test datasets |

### Transform
| Node | Type | Purpose |
|------|------|---------|
| Select Columns | `data.select` | Choose columns |
| Filter Rows | `data.filter` | Filter with expressions |
| Transform Columns | `data.transform` | Scale/normalize |
| Train/Test Split | `data.split` | Split datasets |
| Drop NA | `data.dropna` | Remove missing values |

### Visualization
| Node | Type | Purpose |
|------|------|---------|
| 2D Scatter | `plot.2d` | 2D scatter plots |
| 3D Scatter | `plot.3d` | 3D scatter plots |
| Histogram | `plot.histogram` | Distribution plots |

### Machine Learning
| Node | Type | Purpose |
|------|------|---------|
| Regression | `ml.regression` | Train regression models |
| Classification | `ml.classification` | Train classifiers |
| Predict | `ml.predict` | Apply models |

## 🔌 Port Types

| Type | Color | Description |
|------|-------|-------------|
| `table` | 🔵 Blue | pandas DataFrame |
| `series` | 🟢 Green | 1D array |
| `model` | 🟣 Purple | ML model |
| `metrics` | 🟠 Orange | Metrics dict |
| `params` | 🟡 Yellow | Parameters |
| `array3d` | 🩷 Pink | 3D array |

## ⚙️ Parameter Types

| Type | Widget | Example |
|------|--------|---------|
| `string` | Text input | File path |
| `number` | Number input | 0.5 |
| `integer` | Integer input | 100 |
| `boolean` | Toggle | true/false |
| `select` | Dropdown | "option1" |
| `multi_select` | Multi-select | ["a", "b"] |
| `slider` | Slider | 0.0 - 1.0 |
| `color` | Color picker | #FF0000 |
| `code` | Code editor | Python code |

## 🔧 API Endpoints

### Node Management
```
GET  /api/nodes              # Get all node specs
GET  /api/nodes/{type}       # Get specific node spec
GET  /api/nodes/categories   # Get categories
```

### Workflow Execution
```
POST /api/workflow/execute   # Execute workflow
POST /api/workflow/validate  # Validate workflow
GET  /api/workflow/result/{id}  # Get node result
```

### Cache Management
```
POST /api/cache/clear        # Clear all cache
GET  /api/cache/size         # Get cache size
POST /api/cache/invalidate/{id}  # Invalidate node cache
```

## 🎯 Common Workflows

### Classification Pipeline
```
Synthetic Data → Split → Classification → 2D Plot
```

### Regression Pipeline
```
Synthetic Data → Split → Regression → Predict → Plot
```

### CSV Analysis
```
Load CSV → Select Columns → Transform → Plot
```

### Data Cleaning
```
Load CSV → Drop NA → Transform → Filter → Export
```

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Delete` | Delete selected node/edge |
| `Ctrl/Cmd + S` | Save workflow |
| `Ctrl/Cmd + O` | Open workflow |
| `Space + Drag` | Pan canvas |
| `Mouse Wheel` | Zoom |

## 🐛 Troubleshooting

### Backend won't start
```bash
# Check Python version
python3 --version  # Need 3.10+

# Reinstall dependencies
pip install -r backend/requirements.txt

# Check port availability
lsof -i :8765
```

### Frontend won't connect
```bash
# Verify backend is running
curl http://127.0.0.1:8765

# Check browser console for errors
# Ensure CORS is enabled
```

### Cache issues
```bash
# Clear cache via API
curl -X POST http://127.0.0.1:8765/api/cache/clear

# Or delete cache directory
rm -rf backend/.cache
```

## 📊 Performance Tips

1. **Use sampling** for large datasets during exploration
2. **Enable caching** for expensive operations
3. **Set global seed** for reproducibility
4. **Monitor execution times** in node status
5. **Clear cache** periodically if disk space is limited

## 🔒 Security Notes

- All processing is **100% local**
- No data sent to external servers
- No telemetry or tracking
- File access requires explicit permission
- Safe plugin system with defined API

## 📝 File Formats

### Workflow Files (`.flow.json`)
```json
{
  "version": "0.1.0",
  "name": "My Workflow",
  "seed": 42,
  "nodes": [...],
  "edges": [...]
}
```

### Cache Files
- `.cache/*.cache` - Metadata
- `.cache/*.feather` - DataFrame data

## 🔗 Useful Links

- **Documentation**: `docs/`
- **Examples**: `examples/`
- **API Reference**: `docs/API.md`
- **Architecture**: `docs/ARCHITECTURE.md`
- **Plugin Guide**: `docs/PLUGIN_DEVELOPMENT.md`

## 💡 Tips & Tricks

### Tip 1: Quick Node Search
Press `Ctrl/Cmd + K` in the node palette to quickly search for nodes.

### Tip 2: Parameter Presets
Save common parameter combinations as workflow templates.

### Tip 3: Incremental Development
Build workflows incrementally, testing each node before adding the next.

### Tip 4: Use Synthetic Data
Test workflows with synthetic data before using real data.

### Tip 5: Monitor Cache Size
Check cache size regularly: `GET /api/cache/size`

## 🎓 Learning Path

1. **Beginner**: Start with synthetic data → plot
2. **Intermediate**: Add transformations and splits
3. **Advanced**: Build complete ML pipelines
4. **Expert**: Create custom nodes and plugins

## 📞 Getting Help

1. Check `GETTING_STARTED.md`
2. Review `docs/` directory
3. Search existing issues
4. Ask in GitHub Discussions
5. Contact maintainers

## 🎉 Quick Wins

### 5-Minute Workflow
1. Drag "Generate Synthetic Data"
2. Drag "2D Scatter Plot"
3. Connect them
4. Click "Execute"
5. See results!

### 10-Minute ML Pipeline
1. Generate synthetic classification data
2. Split into train/test
3. Train Random Forest
4. Visualize predictions
5. Check accuracy metrics

---

**Version**: 0.1.0  
**Last Updated**: 2025-09-30
