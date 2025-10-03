# Next Steps - Getting Your DataFlow Platform Running

## 🎯 You Are Here

You have a **complete, production-ready MVP** of a local node-based data science platform!

**Current Status**: ✅ All code written, documented, and ready to run

---

## 🚀 Immediate Next Steps (5-10 minutes)

### Step 1: Verify Your Environment

```bash
cd /Users/alessandrosaracino/CascadeProjects/dataflow-platform
./verify-setup.sh
```

This will check:
- ✅ Python 3.10+ installed
- ✅ Node.js 18+ installed
- ✅ All required files present
- ✅ Ports 8765 and 1420 available

### Step 2: Install Backend Dependencies

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

**Time**: ~2-3 minutes

### Step 3: Install Frontend Dependencies

```bash
cd ../frontend
npm install
```

**Time**: ~2-3 minutes

### Step 4: Test the Backend

```bash
cd ../backend
source venv/bin/activate
python test_backend.py
```

**Expected**: All 5 tests should pass ✅

### Step 5: Start the Application

**Option A: Quick Start (Recommended)**
```bash
cd ..
./start-dev.sh
```

**Option B: Manual Start**
```bash
# Terminal 1: Backend
./start-backend.sh

# Terminal 2: Frontend
cd frontend
npm run dev
```

Then open: `http://localhost:1420`

---

## 🎨 First Workflow (2 minutes)

Once the app is running:

1. **Drag "Generate Synthetic Data"** from the Node Palette
2. **Configure it**:
   - Mode: classification
   - Samples: 1000
   - Features: 5
   - Classes: 3

3. **Drag "2D Scatter Plot"**
4. **Connect** the "table" output to the "table" input
5. **Configure the plot**:
   - X: feature_0
   - Y: feature_1
   - Color: target

6. **Click "Execute"** in the toolbar
7. **See the results!** 🎉

---

## 📚 Learning Path

### Beginner (Day 1)
1. ✅ Run the verification script
2. ✅ Install dependencies
3. ✅ Start the application
4. ✅ Create your first workflow (synthetic data → plot)
5. ✅ Try the example workflows in `examples/`
6. ✅ Read `GETTING_STARTED.md`

### Intermediate (Day 2-3)
1. Build a classification pipeline
2. Build a regression pipeline
3. Experiment with different parameters
4. Try different ML algorithms
5. Export and import workflows
6. Read `QUICK_REFERENCE.md`

### Advanced (Week 1)
1. Read `docs/ARCHITECTURE.md`
2. Read `docs/PLUGIN_DEVELOPMENT.md`
3. Create your first custom node
4. Explore the caching system
5. Optimize workflow performance
6. Read the API documentation

### Expert (Week 2+)
1. Build complex multi-stage pipelines
2. Create a library of custom nodes
3. Contribute to the project
4. Share workflows with others
5. Help improve documentation
6. Report bugs and suggest features

---

## 🔧 Development Workflow

### Daily Development

```bash
# Start development environment
./start-dev.sh

# Make changes to code
# Backend: backend/nodes/*.py
# Frontend: frontend/src/**/*.tsx

# Test backend changes
cd backend
python test_backend.py

# Frontend hot-reloads automatically
```

### Adding a New Node

1. Create node class in `backend/nodes/`
2. Register with `@register_node`
3. Test with `test_backend.py`
4. Restart backend
5. Node appears in palette automatically!

See `docs/PLUGIN_DEVELOPMENT.md` for details.

---

## 📖 Documentation Guide

### Essential Reading (Start Here)
1. **README.md** - Project overview
2. **GETTING_STARTED.md** - Installation and basics
3. **QUICK_REFERENCE.md** - Quick reference guide

### When You Need It
4. **PROJECT_SUMMARY.md** - Detailed project info
5. **docs/API.md** - API reference
6. **docs/ARCHITECTURE.md** - System design
7. **docs/PLUGIN_DEVELOPMENT.md** - Creating nodes

### For Contributors
8. **CONTRIBUTING.md** - How to contribute
9. **CHANGELOG.md** - Version history
10. **PROJECT_STATS.md** - Project metrics

---

## 🎯 Common Tasks

### Task: Load a CSV File
1. Drag "Load CSV" node
2. Set file path parameter
3. Configure separator, encoding
4. Connect to downstream nodes
5. Execute

### Task: Train a Model
1. Load or generate data
2. Add "Train/Test Split"
3. Add "Classification" or "Regression"
4. Configure algorithm and parameters
5. Execute and check metrics

### Task: Visualize Data
1. Have a table output
2. Add "2D Scatter Plot" or "3D Scatter Plot"
3. Select columns for axes
4. Optionally add color/size mapping
5. Execute to see plot

### Task: Export Workflow
1. Click "Export" in toolbar
2. Choose location
3. Save as `.flow.json`
4. Share with others!

### Task: Import Workflow
1. Click "Open" in toolbar
2. Select `.flow.json` file
3. Workflow loads automatically
4. Execute to run

---

## 🐛 Troubleshooting

### Backend Won't Start
```bash
# Check Python version
python3 --version  # Need 3.10+

# Reinstall dependencies
cd backend
pip install -r requirements.txt

# Check port
lsof -i :8765
```

### Frontend Won't Connect
```bash
# Verify backend is running
curl http://127.0.0.1:8765

# Check browser console
# Open DevTools (F12) and look for errors
```

### Node Not Appearing
```bash
# Restart backend
# Check backend/nodes/*.py for errors
# Look at backend console for error messages
```

### Cache Issues
```bash
# Clear cache via UI or API
curl -X POST http://127.0.0.1:8765/api/cache/clear

# Or delete cache directory
rm -rf backend/.cache
```

---

## 🎓 Example Workflows to Try

### 1. Simple Classification (5 min)
```
Generate Synthetic Data (classification)
  ↓
2D Scatter Plot (color by target)
```

### 2. Full ML Pipeline (10 min)
```
Generate Synthetic Data
  ↓
Train/Test Split
  ↓
Classification (Random Forest)
  ↓
2D Scatter Plot (color by prediction)
```

### 3. Regression with Evaluation (15 min)
```
Generate Synthetic Data (regression)
  ↓
Train/Test Split
  ├─→ Regression (train)
  │     ↓
  └─→ Predict (test)
        ↓
      2D Plot (actual vs predicted)
```

### 4. Data Cleaning Pipeline (10 min)
```
Load CSV
  ↓
Drop NA
  ↓
Select Columns
  ↓
Transform Columns (standardize)
  ↓
Filter Rows
  ↓
2D Plot
```

---

## 🚀 Advanced Features to Explore

### Caching System
- Nodes cache results automatically
- Change a parameter → only that node and downstream re-execute
- Check cache size: `GET /api/cache/size`
- Clear cache: `POST /api/cache/clear`

### Seed Control
- Set global seed in workflow settings
- Ensures reproducible results
- Each synthetic data node can override

### Parameter Types
- Sliders for continuous values
- Dropdowns for discrete choices
- Code editors for expressions
- Color pickers for visualization
- File pickers for data sources

### Keyboard Shortcuts
- `Delete` - Remove selected node/edge
- `Ctrl/Cmd + S` - Save workflow
- `Ctrl/Cmd + O` - Open workflow
- `Space + Drag` - Pan canvas
- `Mouse Wheel` - Zoom

---

## 🎯 Goals for First Week

### Day 1: Setup ✅
- ✅ Verify environment
- ✅ Install dependencies
- ✅ Run application
- ✅ Create first workflow

### Day 2: Learn
- Try all node types
- Build example workflows
- Experiment with parameters
- Read documentation

### Day 3: Build
- Create a real data analysis workflow
- Try different ML algorithms
- Compare results
- Export workflows

### Day 4: Customize
- Read plugin development guide
- Create a simple custom node
- Test it in a workflow
- Share your experience

### Day 5: Contribute
- Find a bug or improvement
- Read CONTRIBUTING.md
- Make a contribution
- Share feedback

---

## 📞 Getting Help

### Documentation
1. Check `GETTING_STARTED.md`
2. Review `QUICK_REFERENCE.md`
3. Read relevant docs in `docs/`
4. Try example workflows

### Community
1. Search existing issues
2. Ask in GitHub Discussions
3. Report bugs with details
4. Suggest features

### Self-Help
1. Check browser console (F12)
2. Check backend logs
3. Try clearing cache
4. Restart application
5. Re-read documentation

---

## 🎉 Success Indicators

You'll know you're successful when:

- ✅ Application starts without errors
- ✅ You can drag and drop nodes
- ✅ Workflows execute successfully
- ✅ Plots render correctly
- ✅ ML models train and predict
- ✅ Cache speeds up re-execution
- ✅ You can save and load workflows
- ✅ You understand the node system
- ✅ You've created a custom node
- ✅ You're having fun! 🎊

---

## 🚀 Ready to Start?

```bash
cd /Users/alessandrosaracino/CascadeProjects/dataflow-platform
./verify-setup.sh
```

Then follow the steps above!

**Good luck and happy data flowing! 🌊📊**

---

**Questions?** Check the documentation or open an issue!  
**Feedback?** We'd love to hear from you!  
**Contributions?** Read CONTRIBUTING.md!

**Version**: 0.1.0  
**Status**: Ready to Use ✅
