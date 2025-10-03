# DataFlow Platform API Documentation

## Backend API Reference

Base URL: `http://127.0.0.1:8765`

### Health Check

**GET** `/`

Returns server status and version information.

**Response:**
```json
{
  "status": "ok",
  "service": "DataFlow Platform API",
  "version": "0.1.0"
}
```

---

### Node Specifications

#### Get All Node Specs

**GET** `/api/nodes`

Returns all available node type specifications.

**Response:**
```json
[
  {
    "type": "csv.load",
    "label": "Load CSV",
    "category": "sources",
    "description": "Load data from a CSV file",
    "inputs": [],
    "outputs": [
      {
        "name": "table",
        "type": "table",
        "label": "Table",
        "required": true
      }
    ],
    "params": [
      {
        "name": "path",
        "type": "file",
        "label": "File Path",
        "required": true
      }
    ],
    "icon": "📁",
    "color": "#4CAF50"
  }
]
```

#### Get Node Categories

**GET** `/api/nodes/categories`

Returns list of all node categories.

**Response:**
```json
{
  "categories": ["sources", "transform", "visualization", "machine_learning"]
}
```

#### Get Specific Node Spec

**GET** `/api/nodes/{node_type}`

Returns specification for a specific node type.

**Parameters:**
- `node_type` (path): Node type identifier (e.g., "csv.load")

---

### Workflow Execution

#### Execute Workflow

**POST** `/api/workflow/execute`

Executes a workflow and returns results.

**Request Body:**
```json
{
  "workflow": {
    "version": "0.1.0",
    "name": "My Workflow",
    "seed": 42,
    "nodes": [
      {
        "id": "node-1",
        "type": "csv.synthetic",
        "params": {
          "mode": "classification",
          "n_samples": 1000
        },
        "position": { "x": 100, "y": 100 }
      }
    ],
    "edges": []
  },
  "changed_nodes": ["node-1"]  // Optional: for incremental execution
}
```

**Response:**
```json
{
  "success": true,
  "results": {
    "node-1": {
      "outputs": {
        "table": "DataFrame(...)",
        "metadata": {...}
      },
      "metadata": {...},
      "preview": {...},
      "execution_time": 0.123
    }
  },
  "errors": {}
}
```

#### Validate Workflow

**POST** `/api/workflow/validate`

Validates a workflow without executing it.

**Request Body:**
```json
{
  "version": "0.1.0",
  "name": "My Workflow",
  "nodes": [...],
  "edges": [...]
}
```

**Response:**
```json
{
  "valid": true,
  "execution_order": ["node-1", "node-2", "node-3"]
}
```

Or if invalid:
```json
{
  "valid": false,
  "error": "Workflow contains cycles"
}
```

#### Get Node Result

**GET** `/api/workflow/result/{node_id}`

Retrieves the execution result for a specific node.

**Parameters:**
- `node_id` (path): Node identifier

**Response:**
```json
{
  "node_id": "node-1",
  "outputs": {...},
  "metadata": {...},
  "preview": {...},
  "execution_time": 0.123
}
```

---

### Cache Management

#### Clear Cache

**POST** `/api/cache/clear`

Clears all cached execution results.

**Response:**
```json
{
  "success": true,
  "message": "Cache cleared"
}
```

#### Get Cache Size

**GET** `/api/cache/size`

Returns total cache size.

**Response:**
```json
{
  "size_bytes": 1048576,
  "size_mb": 1.0
}
```

#### Invalidate Node Cache

**POST** `/api/cache/invalidate/{node_id}`

Invalidates cache for a specific node.

**Parameters:**
- `node_id` (path): Node identifier

**Response:**
```json
{
  "success": true,
  "message": "Cache invalidated for node node-1"
}
```

---

## Data Types

### Port Types

- `table`: pandas DataFrame / Arrow Table
- `series`: 1D array (numeric or categorical)
- `array3d`: 3D numpy array
- `model`: Trained ML model (sklearn)
- `metrics`: Dictionary of metrics
- `params`: Dictionary of parameters
- `any`: Accepts any type

### Parameter Types

- `string`: Text input
- `number`: Floating point number
- `integer`: Whole number
- `boolean`: True/False toggle
- `select`: Single choice dropdown
- `multi_select`: Multiple choice dropdown
- `slider`: Numeric slider
- `color`: Color picker
- `file`: File path selector
- `code`: Code editor (multi-line text)
- `column`: Column name selector
- `columns`: Multiple column selector

---

## Error Handling

All endpoints return appropriate HTTP status codes:

- `200 OK`: Successful request
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server error

Error responses include a `detail` field:
```json
{
  "detail": "Error message here"
}
```

---

## CORS

The API allows requests from any origin in development mode. In production, configure allowed origins in `main.py`.

---

## Rate Limiting

Currently no rate limiting is implemented. For production use, consider adding rate limiting middleware.
