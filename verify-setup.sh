#!/bin/bash

# DataFlow Platform Setup Verification Script

echo "======================================"
echo "DataFlow Platform Setup Verification"
echo "======================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check functions
check_command() {
    if command -v $1 &> /dev/null; then
        echo -e "${GREEN}✓${NC} $1 is installed"
        return 0
    else
        echo -e "${RED}✗${NC} $1 is NOT installed"
        return 1
    fi
}

check_version() {
    local cmd=$1
    local version=$2
    local min_version=$3
    
    if [ "$version" \< "$min_version" ]; then
        echo -e "${YELLOW}⚠${NC} $cmd version $version (minimum: $min_version)"
        return 1
    else
        echo -e "${GREEN}✓${NC} $cmd version $version"
        return 0
    fi
}

check_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✓${NC} $1 exists"
        return 0
    else
        echo -e "${RED}✗${NC} $1 is missing"
        return 1
    fi
}

check_dir() {
    if [ -d "$1" ]; then
        echo -e "${GREEN}✓${NC} $1/ exists"
        return 0
    else
        echo -e "${RED}✗${NC} $1/ is missing"
        return 1
    fi
}

# Check prerequisites
echo "Checking Prerequisites..."
echo "-------------------------"

check_command python3
PYTHON_VERSION=$(python3 --version 2>&1 | awk '{print $2}')
check_version "Python" "$PYTHON_VERSION" "3.10.0"

check_command node
NODE_VERSION=$(node --version 2>&1 | sed 's/v//')
check_version "Node.js" "$NODE_VERSION" "18.0.0"

check_command npm
NPM_VERSION=$(npm --version 2>&1)
echo -e "${GREEN}✓${NC} npm version $NPM_VERSION"

check_command cargo
if [ $? -eq 0 ]; then
    RUST_VERSION=$(cargo --version 2>&1 | awk '{print $2}')
    echo -e "${GREEN}✓${NC} Rust version $RUST_VERSION"
fi

echo ""

# Check project structure
echo "Checking Project Structure..."
echo "-----------------------------"

check_dir "backend"
check_dir "backend/core"
check_dir "backend/nodes"
check_dir "frontend"
check_dir "frontend/src"
check_dir "frontend/src-tauri"
check_dir "docs"
check_dir "examples"

echo ""

# Check key files
echo "Checking Key Files..."
echo "---------------------"

check_file "backend/main.py"
check_file "backend/requirements.txt"
check_file "backend/core/types.py"
check_file "backend/core/executor.py"
check_file "backend/nodes/sources.py"
check_file "backend/nodes/ml.py"
check_file "frontend/package.json"
check_file "frontend/src/App.tsx"
check_file "frontend/src/store/workflowStore.ts"
check_file "README.md"
check_file "GETTING_STARTED.md"

echo ""

# Check Python dependencies
echo "Checking Python Dependencies..."
echo "-------------------------------"

if [ -d "backend/venv" ]; then
    echo -e "${GREEN}✓${NC} Virtual environment exists"
    
    source backend/venv/bin/activate 2>/dev/null
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓${NC} Virtual environment activated"
        
        # Check key packages
        python3 -c "import fastapi" 2>/dev/null && echo -e "${GREEN}✓${NC} fastapi installed" || echo -e "${YELLOW}⚠${NC} fastapi not installed"
        python3 -c "import pandas" 2>/dev/null && echo -e "${GREEN}✓${NC} pandas installed" || echo -e "${YELLOW}⚠${NC} pandas not installed"
        python3 -c "import sklearn" 2>/dev/null && echo -e "${GREEN}✓${NC} scikit-learn installed" || echo -e "${YELLOW}⚠${NC} scikit-learn not installed"
        python3 -c "import plotly" 2>/dev/null && echo -e "${GREEN}✓${NC} plotly installed" || echo -e "${YELLOW}⚠${NC} plotly not installed"
        
        deactivate 2>/dev/null
    fi
else
    echo -e "${YELLOW}⚠${NC} Virtual environment not created yet"
    echo "   Run: cd backend && python3 -m venv venv && source venv/bin/activate && pip install -r requirements.txt"
fi

echo ""

# Check Node dependencies
echo "Checking Node Dependencies..."
echo "-----------------------------"

if [ -d "frontend/node_modules" ]; then
    echo -e "${GREEN}✓${NC} node_modules exists"
    
    # Check key packages
    [ -d "frontend/node_modules/react" ] && echo -e "${GREEN}✓${NC} react installed" || echo -e "${YELLOW}⚠${NC} react not installed"
    [ -d "frontend/node_modules/reactflow" ] && echo -e "${GREEN}✓${NC} reactflow installed" || echo -e "${YELLOW}⚠${NC} reactflow not installed"
    [ -d "frontend/node_modules/@tauri-apps" ] && echo -e "${GREEN}✓${NC} tauri installed" || echo -e "${YELLOW}⚠${NC} tauri not installed"
else
    echo -e "${YELLOW}⚠${NC} node_modules not installed yet"
    echo "   Run: cd frontend && npm install"
fi

echo ""

# Check ports
echo "Checking Port Availability..."
echo "-----------------------------"

if lsof -Pi :8765 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo -e "${YELLOW}⚠${NC} Port 8765 is in use (backend may be running)"
else
    echo -e "${GREEN}✓${NC} Port 8765 is available"
fi

if lsof -Pi :1420 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo -e "${YELLOW}⚠${NC} Port 1420 is in use (frontend may be running)"
else
    echo -e "${GREEN}✓${NC} Port 1420 is available"
fi

echo ""

# Summary
echo "======================================"
echo "Verification Summary"
echo "======================================"
echo ""

if command -v python3 &> /dev/null && command -v node &> /dev/null; then
    echo -e "${GREEN}✓${NC} All required tools are installed"
    echo ""
    echo "Next steps:"
    echo "1. Install Python dependencies:"
    echo "   cd backend && python3 -m venv venv && source venv/bin/activate && pip install -r requirements.txt"
    echo ""
    echo "2. Install Node dependencies:"
    echo "   cd frontend && npm install"
    echo ""
    echo "3. Start the application:"
    echo "   ./start-dev.sh"
    echo ""
    echo "Or read GETTING_STARTED.md for detailed instructions."
else
    echo -e "${RED}✗${NC} Some required tools are missing"
    echo ""
    echo "Please install:"
    command -v python3 &> /dev/null || echo "  - Python 3.10+"
    command -v node &> /dev/null || echo "  - Node.js 18+"
    echo ""
    echo "See GETTING_STARTED.md for installation instructions."
fi

echo ""
