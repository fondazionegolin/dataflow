# Contributing to DataFlow Platform

Thank you for your interest in contributing to DataFlow Platform! This document provides guidelines and instructions for contributing.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [How to Contribute](#how-to-contribute)
- [Coding Standards](#coding-standards)
- [Testing](#testing)
- [Pull Request Process](#pull-request-process)

## Code of Conduct

### Our Pledge

We are committed to providing a welcoming and inclusive environment for all contributors, regardless of experience level, background, or identity.

### Expected Behavior

- Be respectful and considerate
- Welcome newcomers and help them get started
- Focus on constructive feedback
- Accept responsibility for mistakes
- Prioritize the community's best interests

### Unacceptable Behavior

- Harassment, discrimination, or offensive comments
- Trolling or insulting remarks
- Personal or political attacks
- Publishing others' private information
- Any conduct inappropriate in a professional setting

## Getting Started

### Prerequisites

- Python 3.10 or higher
- Node.js 18 or higher
- Rust (for Tauri builds)
- Git

### Fork and Clone

1. Fork the repository on GitHub
2. Clone your fork locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/dataflow-platform.git
   cd dataflow-platform
   ```

3. Add upstream remote:
   ```bash
   git remote add upstream https://github.com/ORIGINAL_OWNER/dataflow-platform.git
   ```

## Development Setup

### Backend Setup

```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### Frontend Setup

```bash
cd frontend
npm install
```

### Running Development Environment

```bash
# Terminal 1: Backend
./start-backend.sh

# Terminal 2: Frontend
cd frontend
npm run dev
```

## How to Contribute

### Reporting Bugs

Before creating a bug report:
- Check existing issues to avoid duplicates
- Collect relevant information (OS, Python/Node versions, error messages)

When creating a bug report, include:
- Clear, descriptive title
- Steps to reproduce
- Expected vs actual behavior
- Screenshots if applicable
- Environment details

### Suggesting Enhancements

Enhancement suggestions are welcome! Include:
- Clear description of the feature
- Use cases and benefits
- Potential implementation approach
- Examples or mockups if applicable

### Contributing Code

Areas where contributions are especially welcome:

1. **New Nodes**
   - Data sources (databases, APIs, file formats)
   - Transformations (feature engineering, data cleaning)
   - Visualizations (new chart types)
   - ML algorithms (deep learning, ensemble methods)

2. **UI Improvements**
   - Better error messages
   - Keyboard shortcuts
   - Accessibility features
   - Dark mode enhancements

3. **Performance**
   - Optimization of data processing
   - Faster rendering
   - Memory usage improvements

4. **Documentation**
   - Tutorials and guides
   - API documentation
   - Code examples
   - Translation to other languages

5. **Testing**
   - Unit tests
   - Integration tests
   - E2E tests

## Coding Standards

### Python (Backend)

- Follow PEP 8 style guide
- Use type hints for all functions
- Maximum line length: 100 characters
- Use docstrings for all public functions/classes

Example:
```python
from typing import List, Optional

def process_data(
    data: pd.DataFrame,
    columns: List[str],
    threshold: Optional[float] = None
) -> pd.DataFrame:
    """
    Process data by filtering columns and applying threshold.
    
    Args:
        data: Input DataFrame
        columns: List of columns to select
        threshold: Optional threshold for filtering
        
    Returns:
        Processed DataFrame
    """
    result = data[columns]
    if threshold is not None:
        result = result[result > threshold]
    return result
```

### TypeScript (Frontend)

- Use TypeScript strict mode
- Follow Airbnb style guide
- Use functional components with hooks
- Prefer `const` over `let`

Example:
```typescript
interface NodeProps {
  id: string;
  type: string;
  params: Record<string, any>;
}

export const CustomNode: React.FC<NodeProps> = ({ id, type, params }) => {
  const [isSelected, setIsSelected] = useState(false);
  
  // Component logic
  
  return (
    <div className="custom-node">
      {/* JSX */}
    </div>
  );
};
```

### Commit Messages

Follow conventional commits format:

```
<type>(<scope>): <subject>

<body>

<footer>
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

Examples:
```
feat(nodes): add CSV export node

Add new node for exporting DataFrames to CSV files with
configurable options for separator, encoding, and compression.

Closes #123
```

```
fix(executor): resolve cache invalidation bug

Fixed issue where cache was not properly invalidated when
upstream nodes changed parameters.
```

## Testing

### Running Tests

Backend:
```bash
cd backend
python test_backend.py
```

Frontend:
```bash
cd frontend
npm test
```

### Writing Tests

#### Backend Tests

```python
import pytest
from core.types import NodeContext, NodeResult

async def test_my_node():
    """Test MyNode functionality."""
    node = MyNode()
    context = NodeContext(
        node_id="test-1",
        inputs={"data": test_dataframe},
        params={"threshold": 0.5}
    )
    
    result = await node.run(context)
    
    assert result.error is None
    assert "output" in result.outputs
    assert len(result.outputs["output"]) > 0
```

#### Frontend Tests

```typescript
import { render, screen } from '@testing-library/react';
import { CustomNode } from './CustomNode';

test('renders node with correct label', () => {
  const props = {
    id: 'test-1',
    type: 'csv.load',
    data: { label: 'Load CSV', spec: mockSpec }
  };
  
  render(<CustomNode {...props} />);
  expect(screen.getByText('Load CSV')).toBeInTheDocument();
});
```

## Pull Request Process

### Before Submitting

1. **Update from upstream:**
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

2. **Run tests:**
   ```bash
   cd backend && python test_backend.py
   cd ../frontend && npm test
   ```

3. **Check code style:**
   ```bash
   # Python
   flake8 backend/
   
   # TypeScript
   cd frontend && npm run lint
   ```

4. **Update documentation** if needed

### Submitting Pull Request

1. Push to your fork:
   ```bash
   git push origin feature/my-feature
   ```

2. Create pull request on GitHub

3. Fill out PR template with:
   - Description of changes
   - Related issue numbers
   - Testing performed
   - Screenshots (if UI changes)

4. Wait for review and address feedback

### PR Review Process

- At least one maintainer must approve
- All tests must pass
- Code must follow style guidelines
- Documentation must be updated
- No merge conflicts

### After Merge

1. Delete your branch:
   ```bash
   git branch -d feature/my-feature
   git push origin --delete feature/my-feature
   ```

2. Update your fork:
   ```bash
   git checkout main
   git pull upstream main
   git push origin main
   ```

## Adding New Nodes

See `docs/PLUGIN_DEVELOPMENT.md` for detailed guide.

Quick checklist:
- [ ] Create node class inheriting from `NodeExecutor`
- [ ] Define `NodeSpec` with inputs, outputs, params
- [ ] Implement `run()` method
- [ ] Register with `@register_node` decorator
- [ ] Add tests
- [ ] Update documentation
- [ ] Add example workflow

## Documentation

When adding features:
- Update relevant `.md` files in `docs/`
- Add JSDoc/docstrings to code
- Create example workflows if applicable
- Update `CHANGELOG.md`

## Community

- **Discussions**: Use GitHub Discussions for questions
- **Issues**: Use GitHub Issues for bugs and features
- **Discord**: [Coming soon]

## Recognition

Contributors will be:
- Listed in `CONTRIBUTORS.md`
- Mentioned in release notes
- Credited in documentation

## Questions?

If you have questions about contributing:
- Check existing documentation
- Search closed issues
- Ask in GitHub Discussions
- Contact maintainers

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to DataFlow Platform! 🎉
