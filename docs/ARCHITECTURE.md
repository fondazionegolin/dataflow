# DataFlow Platform Architecture

## Overview

DataFlow Platform is a 100% local, node-based data science application built with:
- **Backend**: Python (FastAPI, pandas, scikit-learn)
- **Frontend**: TypeScript + React + Tauri
- **Canvas**: React Flow for node-based UI
- **Communication**: HTTP + Arrow/Feather for efficient data transfer

## System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Tauri Desktop App                     │
│  ┌───────────────────────────────────────────────────┐  │
│  │              React Frontend (Port 1420)            │  │
│  │  ┌─────────────┐  ┌──────────────┐  ┌──────────┐ │  │
│  │  │ Node Palette│  │ React Flow   │  │Properties│ │  │
│  │  │             │  │   Canvas     │  │  Panel   │ │  │
│  │  └─────────────┘  └──────────────┘  └──────────┘ │  │
│  │           │              │                │        │  │
│  │           └──────────────┴────────────────┘        │  │
│  │                      │                             │  │
│  │              Zustand State Store                   │  │
│  │                      │                             │  │
│  └──────────────────────┼─────────────────────────────┘  │
│                         │ HTTP/JSON                      │
└─────────────────────────┼─────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│          Python Backend (FastAPI, Port 8765)            │
│  ┌───────────────────────────────────────────────────┐  │
│  │                   API Layer                        │  │
│  │  /api/nodes  /api/workflow  /api/cache           │  │
│  └───────────────────┬───────────────────────────────┘  │
│                      │                                   │
│  ┌───────────────────┴───────────────────────────────┐  │
│  │              Execution Engine                      │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────────┐   │  │
│  │  │   DAG    │  │ Scheduler│  │Cache Manager │   │  │
│  │  │ Builder  │  │          │  │              │   │  │
│  │  └──────────┘  └──────────┘  └──────────────┘   │  │
│  └───────────────────┬───────────────────────────────┘  │
│                      │                                   │
│  ┌───────────────────┴───────────────────────────────┐  │
│  │              Node Registry                         │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────────┐   │  │
│  │  │ Sources  │  │Transform │  │Visualization │   │  │
│  │  │  Nodes   │  │  Nodes   │  │    Nodes     │   │  │
│  │  └──────────┘  └──────────┘  └──────────────┘   │  │
│  │  ┌──────────────────────────────────────────┐   │  │
│  │  │        Machine Learning Nodes             │   │  │
│  │  └──────────────────────────────────────────┘   │  │
│  └───────────────────────────────────────────────────┘  │
│                                                          │
│  ┌───────────────────────────────────────────────────┐  │
│  │           Data Processing Layer                    │  │
│  │  pandas | numpy | scikit-learn | plotly          │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                  Local File System                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────────┐  │
│  │Workflows │  │  Cache   │  │   User Data (CSV)    │  │
│  │  .json   │  │ .feather │  │                      │  │
│  └──────────┘  └──────────┘  └──────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

## Core Components

### 1. Frontend (React + Tauri)

#### State Management (Zustand)
- **workflowStore**: Manages workflow state, nodes, edges
- Handles node addition, deletion, parameter updates
- Coordinates with backend for execution

#### UI Components
- **Toolbar**: Workflow controls (execute, save, load)
- **NodePalette**: Draggable node library
- **Canvas**: React Flow workspace
- **PropertiesPanel**: Node parameter editor
- **CustomNode**: Visual node representation

#### Communication
- REST API calls to backend
- JSON for metadata, Arrow/Feather for large datasets
- WebSocket support (future) for real-time updates

### 2. Backend (Python + FastAPI)

#### API Layer (`main.py`)
- RESTful endpoints for workflow operations
- Node specification queries
- Cache management
- CORS enabled for local development

#### Execution Engine (`core/executor.py`)
- **DAG Builder**: Constructs directed acyclic graph from workflow
- **Topological Sorter**: Determines execution order
- **Scheduler**: Executes nodes with dependency resolution
- **Incremental Updates**: Only re-executes changed nodes and downstream

#### Cache Manager (`core/cache.py`)
- **Hash-based Caching**: Cache key = hash(inputs + params + node_type)
- **Memory + Disk**: Two-tier caching strategy
- **Feather Format**: Efficient DataFrame serialization
- **Automatic Invalidation**: Invalidates downstream on changes

#### Node Registry (`core/registry.py`)
- Central repository of node types
- Dynamic node registration via decorators
- Specification queries by type/category

#### Node Implementations (`nodes/`)
- **sources.py**: Data loading and generation
- **transform.py**: Data manipulation
- **visualization.py**: Plotting nodes
- **ml.py**: Machine learning nodes

### 3. Data Flow

```
User Action (UI)
    ↓
State Update (Zustand)
    ↓
API Request (HTTP)
    ↓
Backend Processing
    ↓
Node Execution (DAG)
    ↓
Cache Check
    ↓
Computation (if needed)
    ↓
Result Storage
    ↓
API Response
    ↓
State Update
    ↓
UI Refresh
```

## Execution Model

### Node Execution Lifecycle

1. **Validation**
   - Check required inputs present
   - Validate parameter types and ranges
   - Verify node type exists

2. **Cache Lookup**
   - Compute cache key from inputs + params
   - Check memory cache
   - Check disk cache
   - Return cached result if valid

3. **Execution**
   - Prepare execution context
   - Run node logic
   - Capture outputs and metadata
   - Handle errors gracefully

4. **Caching**
   - Store outputs (DataFrames → Feather)
   - Save metadata and preview
   - Update cache index

5. **Result Propagation**
   - Return to execution engine
   - Make available to downstream nodes
   - Update UI with status

### Incremental Execution

When a node parameter changes:

1. Identify changed node
2. Find all downstream nodes
3. Invalidate caches for affected nodes
4. Re-execute only necessary nodes
5. Preserve cached results for unaffected branches

### Parallel Execution (Future)

Independent nodes can execute in parallel:
```python
# Nodes A and B have no dependencies
# Can execute simultaneously
await asyncio.gather(
    execute_node(node_a),
    execute_node(node_b)
)
```

## Data Types and Serialization

### Port Types

| Type | Python | Serialization | Use Case |
|------|--------|---------------|----------|
| TABLE | `pd.DataFrame` | Feather | Tabular data |
| SERIES | `pd.Series` | Pickle | 1D arrays |
| MODEL | sklearn model | Pickle | ML models |
| METRICS | `dict` | JSON | Metrics/stats |
| PARAMS | `dict` | JSON | Configuration |
| ARRAY_3D | `np.ndarray` | NPY | 3D data |

### Serialization Strategy

- **Small data** (< 1MB): JSON in API response
- **Large data** (> 1MB): Feather files, reference in response
- **Models**: Pickle with joblib
- **Plots**: Plotly JSON

## Caching Strategy

### Cache Key Generation

```python
cache_key = hash(
    node_id +
    node_type +
    params +
    input_hashes
)
```

### Cache Hierarchy

1. **Memory Cache**: Fast, limited size
2. **Disk Cache**: Persistent, larger capacity
3. **No Cache**: For visualization nodes

### Cache Invalidation

- Explicit: User clears cache
- Implicit: Parameter/input changes
- Cascade: Downstream nodes invalidated

## Security Considerations

### Local-Only Design
- No external network requests
- All data stays on user's machine
- No telemetry or tracking

### File System Access
- Sandboxed through Tauri
- User must explicitly grant file access
- No automatic directory scanning

### Code Execution
- Python backend runs in controlled environment
- No arbitrary code execution from workflows
- Plugin system with defined API boundaries

## Performance Optimizations

### Frontend
- Virtual scrolling for large node lists
- Debounced parameter updates
- Lazy loading of node specifications
- Memoized React components

### Backend
- Async/await for I/O operations
- Efficient DataFrame operations (pandas)
- Arrow format for data transfer
- Connection pooling (future)

### Data Processing
- Lazy evaluation where possible
- Sampling for previews
- Chunked processing for large datasets
- Vectorized operations (NumPy)

## Extensibility

### Plugin System

1. **Node Plugins**: Add custom node types
2. **Data Source Plugins**: New data connectors
3. **Visualization Plugins**: Custom plot types
4. **ML Model Plugins**: Additional algorithms

### API Versioning

- Workflow format versioned (`version: "0.1.0"`)
- Backward compatibility maintained
- Migration tools for format changes

## Future Enhancements

### Planned Features
- [ ] Real-time collaboration (WebSocket)
- [ ] Workflow templates library
- [ ] Auto-save and version control
- [ ] Performance profiling
- [ ] GPU acceleration support
- [ ] Distributed execution
- [ ] Cloud sync (optional)
- [ ] Mobile companion app

### Technical Debt
- Add comprehensive test suite
- Implement proper logging
- Add performance monitoring
- Improve error messages
- Add input validation
- Implement undo/redo for all operations

## Development Guidelines

### Code Organization
```
backend/
  core/       # Core engine (no business logic)
  nodes/      # Node implementations (business logic)
  api/        # API routes (thin layer)
  sdk/        # Plugin development kit

frontend/
  components/ # React components
  store/      # State management
  lib/        # Utilities
  types/      # TypeScript definitions
```

### Testing Strategy
- Unit tests for node logic
- Integration tests for execution engine
- E2E tests for workflows
- UI component tests

### Performance Targets
- Node execution: < 100ms overhead
- UI responsiveness: 60 FPS
- Workflow load: < 1s for 100 nodes
- Cache hit: < 10ms

## Deployment

### Development
```bash
./start-dev.sh
```

### Production Build
```bash
cd frontend
npm run tauri:build
```

Produces platform-specific installers:
- macOS: `.dmg`, `.app`
- Windows: `.exe`, `.msi`
- Linux: `.deb`, `.AppImage`

## Monitoring and Debugging

### Logging
- Backend: Python logging to console/file
- Frontend: Browser console
- Execution: Node execution times tracked

### Debug Mode
- Verbose logging
- Cache disabled
- Source maps enabled
- React DevTools integration

## Conclusion

DataFlow Platform provides a robust, extensible architecture for local data science workflows. The separation of concerns between frontend and backend, combined with intelligent caching and incremental execution, enables a responsive user experience even with large datasets and complex workflows.
