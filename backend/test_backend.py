"""
Simple test script to verify backend functionality.
Run with: python test_backend.py
"""

import asyncio
import sys
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent))

from core.types import Workflow, NodeInstance, Edge
from core.executor import ExecutionEngine
from core.registry import registry

# Import nodes to register them
import nodes.sources
import nodes.transform
import nodes.visualization
import nodes.ml


async def test_synthetic_data():
    """Test synthetic data generation."""
    print("\n=== Test 1: Synthetic Data Generation ===")
    
    workflow = Workflow(
        version="0.1.0",
        name="Test Synthetic",
        seed=42,
        nodes=[
            NodeInstance(
                id="syn-1",
                type="csv.synthetic",
                params={
                    "mode": "classification",
                    "n_samples": 100,
                    "n_features": 3,
                    "n_classes": 2,
                    "seed": 42
                },
                position={"x": 0, "y": 0}
            )
        ],
        edges=[]
    )
    
    engine = ExecutionEngine()
    results = await engine.execute_workflow(workflow)
    
    result = results.get("syn-1")
    if result and not result.error:
        print("✅ Synthetic data generated successfully")
        print(f"   Rows: {result.metadata.get('rows', 'N/A')}")
        print(f"   Columns: {result.metadata.get('columns', 'N/A')}")
    else:
        print(f"❌ Failed: {result.error if result else 'No result'}")
    
    return result is not None and not result.error


async def test_classification_pipeline():
    """Test complete classification pipeline."""
    print("\n=== Test 2: Classification Pipeline ===")
    
    workflow = Workflow(
        version="0.1.0",
        name="Test Classification",
        seed=42,
        nodes=[
            NodeInstance(
                id="syn-1",
                type="csv.synthetic",
                params={
                    "mode": "classification",
                    "n_samples": 200,
                    "n_features": 4,
                    "n_classes": 2,
                    "n_informative": 3,
                    "seed": 42
                },
                position={"x": 0, "y": 0}
            ),
            NodeInstance(
                id="split-1",
                type="data.split",
                params={
                    "test_size": 0.3,
                    "stratify_column": "target",
                    "seed": 42
                },
                position={"x": 300, "y": 0}
            ),
            NodeInstance(
                id="clf-1",
                type="ml.classification",
                params={
                    "algorithm": "random_forest",
                    "target_column": "target",
                    "n_estimators": 50,
                    "max_depth": 3
                },
                position={"x": 600, "y": 0}
            )
        ],
        edges=[
            Edge(
                id="e1",
                source_node="syn-1",
                source_port="table",
                target_node="split-1",
                target_port="table"
            ),
            Edge(
                id="e2",
                source_node="split-1",
                source_port="train",
                target_node="clf-1",
                target_port="train"
            )
        ]
    )
    
    engine = ExecutionEngine()
    results = await engine.execute_workflow(workflow)
    
    # Check each node
    success = True
    for node_id in ["syn-1", "split-1", "clf-1"]:
        result = results.get(node_id)
        if result and not result.error:
            print(f"✅ Node {node_id} executed successfully")
            if node_id == "clf-1":
                metrics = result.metadata
                print(f"   Accuracy: {metrics.get('accuracy', 'N/A'):.3f}")
                print(f"   F1 Score: {metrics.get('f1_score', 'N/A'):.3f}")
        else:
            print(f"❌ Node {node_id} failed: {result.error if result else 'No result'}")
            success = False
    
    return success


async def test_regression_pipeline():
    """Test regression pipeline."""
    print("\n=== Test 3: Regression Pipeline ===")
    
    workflow = Workflow(
        version="0.1.0",
        name="Test Regression",
        seed=42,
        nodes=[
            NodeInstance(
                id="syn-1",
                type="csv.synthetic",
                params={
                    "mode": "regression",
                    "n_samples": 150,
                    "n_features": 3,
                    "noise": 0.1,
                    "seed": 42
                },
                position={"x": 0, "y": 0}
            ),
            NodeInstance(
                id="reg-1",
                type="ml.regression",
                params={
                    "algorithm": "linear",
                    "target_column": "target"
                },
                position={"x": 300, "y": 0}
            )
        ],
        edges=[
            Edge(
                id="e1",
                source_node="syn-1",
                source_port="table",
                target_node="reg-1",
                target_port="train"
            )
        ]
    )
    
    engine = ExecutionEngine()
    results = await engine.execute_workflow(workflow)
    
    result = results.get("reg-1")
    if result and not result.error:
        print("✅ Regression model trained successfully")
        metrics = result.metadata
        print(f"   R² Score: {metrics.get('r2', 'N/A'):.3f}")
        print(f"   RMSE: {metrics.get('rmse', 'N/A'):.3f}")
        return True
    else:
        print(f"❌ Failed: {result.error if result else 'No result'}")
        return False


async def test_caching():
    """Test caching mechanism."""
    print("\n=== Test 4: Caching ===")
    
    workflow = Workflow(
        version="0.1.0",
        name="Test Cache",
        seed=42,
        nodes=[
            NodeInstance(
                id="syn-1",
                type="csv.synthetic",
                params={
                    "mode": "classification",
                    "n_samples": 100,
                    "seed": 42
                },
                position={"x": 0, "y": 0}
            )
        ],
        edges=[]
    )
    
    engine = ExecutionEngine()
    
    # First execution
    import time
    start = time.time()
    await engine.execute_workflow(workflow)
    first_time = time.time() - start
    
    # Second execution (should use cache)
    start = time.time()
    await engine.execute_workflow(workflow)
    second_time = time.time() - start
    
    print(f"✅ First execution: {first_time:.3f}s")
    print(f"✅ Second execution (cached): {second_time:.3f}s")
    
    if second_time < first_time * 0.5:
        print("✅ Caching working correctly (2nd run significantly faster)")
        return True
    else:
        print("⚠️  Cache may not be working optimally")
        return False


async def test_node_registry():
    """Test node registry."""
    print("\n=== Test 5: Node Registry ===")
    
    specs = registry.get_all_specs()
    categories = registry.list_categories()
    
    print(f"✅ Registered nodes: {len(specs)}")
    print(f"✅ Categories: {', '.join(categories)}")
    
    # Check key nodes exist
    key_nodes = ["csv.load", "csv.synthetic", "ml.classification", "ml.regression", "plot.2d"]
    missing = []
    for node_type in key_nodes:
        if not registry.get_spec(node_type):
            missing.append(node_type)
    
    if missing:
        print(f"❌ Missing nodes: {', '.join(missing)}")
        return False
    else:
        print("✅ All key nodes registered")
        return True


async def main():
    """Run all tests."""
    print("=" * 60)
    print("DataFlow Platform Backend Tests")
    print("=" * 60)
    
    tests = [
        ("Node Registry", test_node_registry),
        ("Synthetic Data", test_synthetic_data),
        ("Classification Pipeline", test_classification_pipeline),
        ("Regression Pipeline", test_regression_pipeline),
        ("Caching", test_caching),
    ]
    
    results = []
    for name, test_func in tests:
        try:
            result = await test_func()
            results.append((name, result))
        except Exception as e:
            print(f"❌ Test '{name}' crashed: {e}")
            results.append((name, False))
    
    # Summary
    print("\n" + "=" * 60)
    print("Test Summary")
    print("=" * 60)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status}: {name}")
    
    print(f"\nTotal: {passed}/{total} tests passed")
    
    if passed == total:
        print("\n🎉 All tests passed!")
        return 0
    else:
        print(f"\n⚠️  {total - passed} test(s) failed")
        return 1


if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)
