/**
 * Expandable node with inline configuration and preview
 */

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Handle, Position, NodeProps } from 'reactflow';
import { ChevronDown, ChevronUp, Settings, Table2, BarChart3, HelpCircle, Eye, Copy as CopyIcon, Trash2 } from 'lucide-react';
import { NodeData, ParamType } from '@/types';
import { useWorkflowStore } from '@/store/workflowStore';
import Plot from 'react-plotly.js';
import { useTranslation } from 'react-i18next';
import { TableEditor } from './TableEditor';
import { EquationInput } from './EquationInput';
import { DraggableColumnList } from './DraggableColumnList';
import { useTheme } from '@/contexts/ThemeContext';

export const ExpandableNode: React.FC<NodeProps<NodeData>> = ({ id, data, selected }) => {
  const [isExpanded, setIsExpanded] = useState(true); // Aperto di default
  const [showTooltip, setShowTooltip] = useState(false);
  const [previewSize, setPreviewSize] = useState<'normal' | 'large' | 'xlarge'>('normal');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showTableEditor, setShowTableEditor] = useState(false);
  const [generationProgress, setGenerationProgress] = useState<string>('');
  const [cameraPosition, setCameraPosition] = useState({ x: 1.5, y: 1.5, z: 1.3 });
  const [plotRevision, setPlotRevision] = useState(0);
  const [showRegressionLine, setShowRegressionLine] = useState(false);
  const [regressionType, setRegressionType] = useState<'linear' | 'polynomial' | 'exponential'>('linear');
  const [availableColumns, setAvailableColumns] = useState<string[]>([]);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  
  const { updateNodeParams, edges, executionResults, nodes, setNodes } = useWorkflowStore();
  const { spec, params, status } = data;
  const result = executionResults[id];
  const { t } = useTranslation();
  const { darkMode } = useTheme();
  
  // Get sessionId from URL
  const sessionId = window.location.pathname.split('/').pop();
  
  // Template configurations
  const templates = {
    classification_iris: {
      columns: "sepal_length,sepal_width,petal_length,petal_width,species",
      description: "Generate iris flower measurements dataset for classification. Include sepal_length (4.0-8.0 cm), sepal_width (2.0-4.5 cm), petal_length (1.0-7.0 cm), petal_width (0.1-2.5 cm) as numeric features. Species should be one of: setosa, versicolor, or virginica. Setosa has smaller petals, versicolor medium, virginica larger. Create realistic correlations between measurements and species.",
      name: "Iris Flowers Classification"
    },
    classification_customer_churn: {
      columns: "customer_id,age,tenure_months,monthly_charges,total_charges,contract_type,payment_method,internet_service,tech_support,churn",
      description: "Generate customer churn dataset. Age (18-80), tenure_months (1-72), monthly_charges (20-120 euros), total_charges (calculated from tenure*monthly_charges with some variation). Contract_type: Month-to-month, One year, Two year. Payment_method: Electronic check, Mailed check, Bank transfer, Credit card. Internet_service: DSL, Fiber optic, No. Tech_support: Yes, No. Churn: Yes/No (higher churn for month-to-month contracts, lower tenure, no tech support).",
      name: "Customer Churn Prediction"
    },
    regression_house_prices: {
      columns: "square_meters,bedrooms,bathrooms,age_years,distance_center_km,garage,garden,price_euros",
      description: "Generate house price dataset. Square_meters (50-300), bedrooms (1-5), bathrooms (1-3), age_years (0-50), distance_center_km (0-30). Garage: Yes/No, Garden: Yes/No. Price_euros should correlate positively with square_meters, bedrooms, bathrooms, garage, garden and negatively with age and distance. Base price around 100k-800k euros with realistic relationships.",
      name: "House Price Prediction"
    },
    regression_car_performance: {
      columns: "engine_cc,cylinders,horsepower,weight_kg,fuel_type,transmission,acceleration_0_100,fuel_consumption_l_100km",
      description: "Generate car performance dataset. Engine_cc (1000-6000), cylinders (3,4,6,8), horsepower (60-500), weight_kg (800-2500). Fuel_type: Gasoline, Diesel, Hybrid, Electric. Transmission: Manual, Automatic. Acceleration_0_100 (seconds, 4-15, inversely related to horsepower/weight ratio). Fuel_consumption_l_100km (3-15, higher for larger engines and weight, lower for hybrids/electric).",
      name: "Car Performance Analysis"
    },
    nlp_sentiment_reviews: {
      columns: "review_id,product_category,review_text,rating,helpful_votes",
      description: "Generate product reviews dataset. Product_category: Electronics, Books, Clothing, Home, Sports. Review_text: realistic product reviews (50-200 words) with varying sentiment. Rating (1-5 stars, correlated with sentiment). Helpful_votes (0-100, higher for detailed reviews). Positive reviews (4-5 stars) should have positive language, negative reviews (1-2 stars) negative language, neutral (3 stars) mixed.",
      name: "Product Reviews Sentiment"
    },
    nlp_spam_detection: {
      columns: "email_id,subject,body,sender_domain,has_links,has_attachments,is_spam",
      description: "Generate email spam detection dataset. Subject: realistic email subjects. Body: email content (50-150 words). Sender_domain: legitimate domains (gmail.com, company.com) or suspicious (random.xyz, promo123.net). Has_links: Yes/No, Has_attachments: Yes/No. Is_spam: Yes/No. Spam emails have suspicious domains, excessive links, promotional language, urgency words. Legitimate emails have professional tone, known domains.",
      name: "Email Spam Detection"
    },
    timeseries_sales: {
      columns: "date,product_category,units_sold,revenue_euros,marketing_spend,season",
      description: "Generate monthly sales timeseries (24 months). Date: YYYY-MM format. Product_category: Electronics, Clothing, Food, Books. Units_sold (100-5000), revenue_euros (calculated from units with realistic prices). Marketing_spend (1000-20000 euros). Season: Spring, Summer, Fall, Winter. Show seasonal patterns (higher sales in winter for electronics, summer for clothing), correlation between marketing spend and sales, growth trend over time.",
      name: "Monthly Sales Timeseries"
    },
    clustering_customer_segments: {
      columns: "customer_id,age,annual_income_euros,spending_score,purchase_frequency,avg_transaction_euros,loyalty_years",
      description: "Generate customer segmentation dataset with distinct clusters. Age (18-70), annual_income_euros (15000-150000), spending_score (1-100), purchase_frequency (1-50 per year), avg_transaction_euros (20-500), loyalty_years (0-15). Create 3-4 natural clusters: 1) Young low-income frequent small purchases, 2) Middle-age high-income high spending, 3) Senior moderate-income loyal customers, 4) Young high-income occasional large purchases.",
      name: "Customer Segmentation"
    }
  };
  
  // Watch for template changes and auto-fill fields
  useEffect(() => {
    const currentTemplate = params.template;
    if (currentTemplate && currentTemplate !== 'custom' && templates[currentTemplate as keyof typeof templates]) {
      const templateConfig = templates[currentTemplate as keyof typeof templates];
      
      // Only update if fields are empty or still have default values
      if (!params.columns || params.columns === 'cilindrata,consumo') {
        handleParamChange('columns', templateConfig.columns);
      }
      if (!params.description || params.description === '') {
        handleParamChange('description', templateConfig.description);
      }
      if (!params.dataset_name || params.dataset_name === '') {
        handleParamChange('dataset_name', templateConfig.name);
      }
    }
  }, [params.template]);
  
  // Mostra sempre preview se ci sono risultati
  const showPreview = result && (result.preview?.plot_json || result.preview?.head || result.metadata);

  // Separa parametri base e avanzati
  const advancedParamNames = ['opacity', 'marker_size', 'seed', 'test_size', 'random_state', 'fill_value', 'bins', 'color', 'force_regenerate'];
  const baseParams = spec.params.filter(p => !advancedParamNames.includes(p.name));
  const advancedParams = spec.params.filter(p => advancedParamNames.includes(p.name));

  // Get input node to fetch available columns
  const inputEdge = edges.find((e) => e.target === id);
  const inputNodeId = inputEdge?.source;

  // Load available columns from input node - REACTIVE to connections
  useEffect(() => {
    const loadColumnsFromInput = async () => {
      if (!inputNodeId) {
        setAvailableColumns([]);
        return;
      }

      // First try: Check if input node has been executed
      if (executionResults[inputNodeId]) {
        const inputResult = executionResults[inputNodeId];
        let cols: string[] = [];
        
        if (inputResult.preview?.columns) {
          cols = inputResult.preview.columns;
        } else if (inputResult.preview?.head && inputResult.preview.head.length > 0) {
          cols = Object.keys(inputResult.preview.head[0]);
        }
        
        if (cols.length > 0) {
          console.log(`[${id}] Loaded ${cols.length} columns from executed input:`, cols);
          setAvailableColumns(cols);
          return;
        }
      }

      // Second try: Infer columns from input node's spec
      const inputNode = edges.find(e => e.source === inputNodeId);
      if (inputNode) {
        // For now, show a message that execution is needed
        // In future, we could infer from node spec
        console.log(`[${id}] Input node connected but not executed yet`);
        setAvailableColumns([]);
      }
    };

    loadColumnsFromInput();
  }, [inputNodeId, executionResults, id, edges]);

  // Listen for table updates from popup window
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'UPDATE_NODE_DATA' && event.data.nodeId === id) {
        console.log('Received table update from popup:', event.data);
        
        // Update execution results
        const { updateExecutionResult } = useWorkflowStore.getState();
        if (result) {
          updateExecutionResult(id, {
            ...result,
            preview: {
              ...result.preview,
              head: event.data.data,
              columns: event.data.columns
            }
          });
        }
        
        // If this is a Custom Table node, update the table_data parameter
        if (spec.type === 'data.custom_input') {
          const tableData = JSON.stringify({
            columns: event.data.columns,
            data: event.data.data
          });
          updateNodeParams(id, { table_data: tableData });
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [id, result, spec.type, updateNodeParams]);

  const handleParamChange = (paramName: string, value: any) => {
    updateNodeParams(id, { [paramName]: value });
  };

  const handleRunNode = async () => {
    // Execute this node
    const { executeNode } = useWorkflowStore.getState();
    try {
      await executeNode(id);
    } catch (error) {
      console.error('Node execution failed:', error);
    }
  };

  const getNodeExample = () => {
    const examples: Record<string, string> = {
      'ai.generate_dataset': 'Columns: "name,age" → Description: "10 people aged 20-60" → Generates realistic data',
      'csv.synthetic': 'Mode: classification → Features: 5 → Generates sklearn dataset',
      'data.select': 'Select columns: [feature_0, target] → Keeps only selected columns',
      'data.transform': 'Method: standardize → Scales data to mean=0, std=1',
      'plot.2d': 'X: feature_0, Y: feature_1 → Creates interactive scatter plot',
      'plot.3d': 'X, Y, Z axes → Creates 3D scatter plot with rotation',
      'ml.regression': 'Algorithm: linear → Trains model → Outputs metrics (R², RMSE)',
      'ml.predict': 'Connect trained model + new data → Predicts values for unknown data',
    };
    return examples[spec.type] || 'Connect nodes and configure parameters';
  };

  const getCategoryColor = () => {
    const category = spec.category;
    const baseColors: Record<string, { border: string; bg: string; gradient: string; hex: string }> = {
      sources: { 
        border: 'border-green-500', 
        bg: 'bg-green-50',
        gradient: 'from-green-500 to-green-600',
        hex: '#22c55e'
      },
      transform: { 
        border: 'border-blue-500', 
        bg: 'bg-blue-50',
        gradient: 'from-blue-500 to-blue-600',
        hex: '#3b82f6'
      },
      visualization: { 
        border: 'border-orange-500', 
        bg: 'bg-orange-50',
        gradient: 'from-orange-500 to-orange-600',
        hex: '#f97316'
      },
      machine_learning: { 
        border: 'border-purple-500', 
        bg: 'bg-purple-50',
        gradient: 'from-purple-500 to-purple-600',
        hex: '#a855f7'
      },
      mathematics: { 
        border: 'border-yellow-400', 
        bg: 'bg-yellow-50',
        gradient: 'from-yellow-400 to-yellow-500',
        hex: '#facc15'
      },
    };
    
    return baseColors[category] || { border: 'border-gray-300', bg: 'bg-white', gradient: 'from-gray-500 to-gray-600', hex: '#6b7280' };
  };

  const getStatusColor = () => {
    const categoryColors = getCategoryColor();
    
    switch (status) {
      case 'success':
        return `${categoryColors.border} ${categoryColors.bg}`;
      case 'error':
        return 'border-red-500 bg-red-50';
      case 'running':
        return `${categoryColors.border} ${categoryColors.bg} animate-pulse`;
      default:
        return `${categoryColors.border} bg-white`;
    }
  };

  const renderParamInput = (param: any) => {
    const value = params[param.name] ?? param.default;

    // Handle COLUMN type - always show dropdown with available columns
    if (param.type === 'column') {
      if (availableColumns.length > 0) {
        return (
          <select
            value={value || ''}
            onChange={(e) => handleParamChange(param.name, e.target.value)}
            className="w-full px-3 py-2 text-sm border-0 bg-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400/50 transition-all"
          >
            <option value="">Select column...</option>
            {availableColumns.map((col) => (
              <option key={col} value={col}>
                {col}
              </option>
            ))}
          </select>
        );
      } else {
        return (
          <div className="w-full px-2 py-1 text-sm border border-orange-300 bg-orange-50 rounded text-orange-700">
            ⚠️ Connect input node and execute first
          </div>
        );
      }
    }

    // For column selection params with STRING type, use dropdown with available columns
    // BUT exclude params that define column names (like in AI dataset generation)
    const isColumnDefinition = 
      param.name === 'columns' && 
      param.description?.toLowerCase().includes('comma-separated');
    
    const isColumnParam = 
      !isColumnDefinition &&
      (param.name.toLowerCase().includes('column') || 
       param.name.toLowerCase() === 'x' || 
       param.name.toLowerCase() === 'y' || 
       param.name.toLowerCase() === 'z' ||
       param.name.toLowerCase().includes('color') ||
       param.name.toLowerCase().includes('size') ||
       param.label?.toLowerCase().includes('column') ||
       param.label?.toLowerCase().includes('axis'));

    if (isColumnParam && param.type === ParamType.STRING) {
      if (availableColumns.length > 0) {
        return (
          <select
            value={value || ''}
            onChange={(e) => handleParamChange(param.name, e.target.value)}
            className="w-full px-3 py-2 text-sm border-0 bg-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400/50 transition-all"
          >
            <option value="">Select column...</option>
            {availableColumns.map((col) => (
              <option key={col} value={col}>
                {col}
              </option>
            ))}
          </select>
        );
      } else {
        return (
          <div className="w-full px-2 py-1 text-sm border border-orange-300 bg-orange-50 rounded text-orange-700">
            ⚠️ Connect input node and execute first
          </div>
        );
      }
    }

    // Special handling for equation input (math.equation node)
    if (param.name === 'equation_str' && spec.type === 'math.equation') {
      return (
        <EquationInput
          value={value || ''}
          onChange={(val: string) => handleParamChange(param.name, val)}
          placeholder={param.description || 'Enter equation...'}
          darkMode={darkMode}
          showLatex={true}
        />
      );
    }

    switch (param.type) {
      case ParamType.STRING:
        return (
          <input
            type="text"
            value={value || ''}
            onChange={(e) => handleParamChange(param.name, e.target.value)}
            className="w-full px-3 py-2 text-sm border-0 bg-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400/50 transition-all"
            placeholder={param.description}
          />
        );

      case ParamType.NUMBER:
      case ParamType.INTEGER:
        return (
          <input
            type="number"
            value={value ?? ''}
            onChange={(e) => {
              const val = param.type === ParamType.INTEGER
                ? parseInt(e.target.value)
                : parseFloat(e.target.value);
              handleParamChange(param.name, isNaN(val) ? param.default : val);
            }}
            min={param.min}
            max={param.max}
            step={param.step || (param.type === ParamType.INTEGER ? 1 : 0.1)}
            className="w-full px-3 py-2 text-sm border-0 bg-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400/50 transition-all"
          />
        );

      case ParamType.BOOLEAN:
        return (
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={value || false}
              onChange={(e) => handleParamChange(param.name, e.target.checked)}
              className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
            />
            <span className="ml-2 text-sm text-gray-700">
              {value ? 'Enabled' : 'Disabled'}
            </span>
          </label>
        );

      case ParamType.SELECT:
        return (
          <select
            value={value || ''}
            onChange={(e) => handleParamChange(param.name, e.target.value)}
            className="w-full px-3 py-2 text-sm border-0 bg-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400/50 transition-all"
          >
            {param.options?.map((option: any) => {
              // Handle both string options and object options {value, label}
              const optionValue = typeof option === 'object' ? option.value : option;
              const optionLabel = typeof option === 'object' ? option.label : option;
              
              // Try to translate template options
              const translationKey = param.name === 'template' ? `templates.${optionValue}` : optionLabel;
              const displayText = param.name === 'template' ? t(translationKey, optionLabel) : optionLabel;
              
              return (
                <option key={optionValue} value={optionValue}>
                  {displayText}
                </option>
              );
            })}
          </select>
        );

      case ParamType.MULTI_SELECT:
        // For column_order parameter, use draggable list
        if (param.name === 'column_order' && availableColumns.length > 0) {
          const selectedValues = Array.isArray(value) ? value : [];
          return (
            <div className="space-y-2">
              <DraggableColumnList
                columns={availableColumns}
                value={selectedValues.length > 0 ? selectedValues : availableColumns}
                onChange={(newOrder) => handleParamChange(param.name, newOrder)}
              />
              <div className="text-xs text-gray-500 text-center">
                Drag columns to reorder • {availableColumns.length} columns
              </div>
            </div>
          );
        }
        
        // For other multi-select with available columns
        if (availableColumns.length > 0) {
          const selectedValues = Array.isArray(value) ? value : [];
          return (
            <div className="space-y-2">
              <div className="max-h-48 overflow-y-auto border-0 bg-gray-100 rounded-xl p-3">
                {availableColumns.map((col) => (
                  <label key={col} className="flex items-center py-1.5 cursor-pointer hover:bg-gray-200/50 px-2 rounded-lg transition-colors">
                    <input
                      type="checkbox"
                      checked={selectedValues.includes(col)}
                      onChange={(e) => {
                        const newValue = e.target.checked
                          ? [...selectedValues, col]
                          : selectedValues.filter((v) => v !== col);
                        handleParamChange(param.name, newValue);
                      }}
                      className="mr-2"
                    />
                    <span className="text-sm">{col}</span>
                  </label>
                ))}
              </div>
              <div className="text-xs text-gray-600">
                Selected: {selectedValues.length} / {availableColumns.length}
              </div>
            </div>
          );
        } else {
          return (
            <div className="w-full px-2 py-1 text-sm border border-orange-300 bg-orange-50 rounded text-orange-700">
              ⚠️ Connect input node and execute first
            </div>
          );
        }

      case ParamType.CODE:
        return (
          <textarea
            value={value || ''}
            onChange={(e) => handleParamChange(param.name, e.target.value)}
            rows={3}
            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary font-mono"
            placeholder={param.description}
          />
        );

      default:
        return (
          <input
            type="text"
            value={value || ''}
            onChange={(e) => handleParamChange(param.name, e.target.value)}
            className="w-full px-3 py-2 text-sm border-0 bg-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400/50 transition-all"
          />
        );
    }
  };

  const getPreviewHeight = () => {
    switch (previewSize) {
      case 'large':
        return 'h-[500px]';
      case 'xlarge':
        return 'h-[700px]';
      default:
        return 'h-[400px]'; // Aumentato da 256px a 400px
    }
  };

  const renderPreview = () => {
    if (!result) {
      return (
        <div className="p-4 text-center text-gray-500 text-sm">
          Execute to see preview
        </div>
      );
    }
    // Calculate regression
    const calculateRegression = (xData: number[], yData: number[], type: 'linear' | 'polynomial' | 'exponential') => {
      const n = xData.length;
      
      if (type === 'linear') {
        const sumX = xData.reduce((a, b) => a + b, 0);
        const sumY = yData.reduce((a, b) => a + b, 0);
        const sumXY = xData.reduce((sum, x, i) => sum + x * yData[i], 0);
        const sumX2 = xData.reduce((sum, x) => sum + x * x, 0);
        
        const m = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
        const b = (sumY - m * sumX) / n;
        
        const xMin = Math.min(...xData);
        const xMax = Math.max(...xData);
        const xRange = Array.from({length: 100}, (_, i) => xMin + (xMax - xMin) * i / 99);
        const yRange = xRange.map(x => m * x + b);
        
        return { x: xRange, y: yRange, equation: `y = ${m.toFixed(3)}x + ${b.toFixed(3)}` };
      } else if (type === 'polynomial') {
        // Polynomial regression using matrix method (more stable)
        // Build matrices for normal equations: X^T * X * coeffs = X^T * y
        const n = xData.length;
        
        // Build design matrix X = [1, x, x²]
        const X: number[][] = xData.map(x => [1, x, x * x]);
        
        // Compute X^T * X
        const XtX = [
          [n, 0, 0],
          [0, 0, 0],
          [0, 0, 0]
        ];
        
        for (let i = 0; i < n; i++) {
          for (let row = 0; row < 3; row++) {
            for (let col = 0; col < 3; col++) {
              XtX[row][col] += X[i][row] * X[i][col];
            }
          }
        }
        
        // Compute X^T * y
        const Xty = [0, 0, 0];
        for (let i = 0; i < n; i++) {
          for (let row = 0; row < 3; row++) {
            Xty[row] += X[i][row] * yData[i];
          }
        }
        
        // Solve using Gaussian elimination (simplified for 3x3)
        // This is a basic implementation - for production use a proper linear algebra library
        const A = XtX.map((row, i) => [...row, Xty[i]]);
        
        // Forward elimination
        for (let i = 0; i < 3; i++) {
          for (let j = i + 1; j < 3; j++) {
            const factor = A[j][i] / A[i][i];
            for (let k = i; k < 4; k++) {
              A[j][k] -= factor * A[i][k];
            }
          }
        }
        
        // Back substitution
        const coeffs = [0, 0, 0];
        for (let i = 2; i >= 0; i--) {
          coeffs[i] = A[i][3];
          for (let j = i + 1; j < 3; j++) {
            coeffs[i] -= A[i][j] * coeffs[j];
          }
          coeffs[i] /= A[i][i];
        }
        
        const [c, b, a] = coeffs;
        
        const xMin = Math.min(...xData);
        const xMax = Math.max(...xData);
        const xRange = Array.from({length: 100}, (_, i) => xMin + (xMax - xMin) * i / 99);
        const yRange = xRange.map(x => a * x * x + b * x + c);
        
        return { x: xRange, y: yRange, equation: `y = ${a.toFixed(3)}x² + ${b.toFixed(3)}x + ${c.toFixed(3)}` };
      } else {
        const lnY = yData.map(y => Math.log(Math.max(y, 0.0001)));
        const sumX = xData.reduce((a, b) => a + b, 0);
        const sumLnY = lnY.reduce((a, b) => a + b, 0);
        const sumXLnY = xData.reduce((sum, x, i) => sum + x * lnY[i], 0);
        const sumX2 = xData.reduce((sum, x) => sum + x * x, 0);
        
        const b = (n * sumXLnY - sumX * sumLnY) / (n * sumX2 - sumX * sumX);
        const lnA = (sumLnY - b * sumX) / n;
        const a = Math.exp(lnA);
        
        const xMin = Math.min(...xData);
        const xMax = Math.max(...xData);
        const xRange = Array.from({length: 100}, (_, i) => xMin + (xMax - xMin) * i / 99);
        const yRange = xRange.map(x => a * Math.exp(b * x));
        
        return { x: xRange, y: yRange, equation: `y = ${a.toFixed(3)}e^(${b.toFixed(3)}x)` };
      }
    };
  
    // Render plot
    if (result.preview?.plot_json) {
      try {
        const plotData = JSON.parse(result.preview.plot_json);
        const is2D = !plotData.data?.some((trace: any) => trace.type === 'scatter3d');
        
        console.log('[ExpandableNode] Rendering plot:', { 
          nodeType: spec.type, 
          is2D, 
          dataLength: plotData.data?.length,
          hasLayout: !!plotData.layout 
        });
        
        if (!plotData.data || plotData.data.length === 0) {
          return <div className="p-4 text-red-500 text-sm">No plot data available</div>;
        }
        
        // Add regression line if enabled
        let enhancedData = [...plotData.data];
        let regressionEquation = '';
        
        if (showRegressionLine && is2D && plotData.data[0]) {
          try {
            console.log('🔍 Full plot data[0]:', plotData.data[0]);
            
            // Check if data exists
            if (!plotData.data[0].x || !plotData.data[0].y) {
              console.warn('No x or y data in plot');
              // Continue without regression
            } else {
              console.log('🔍 X raw:', plotData.data[0].x);
              console.log('🔍 Y raw:', plotData.data[0].y);
              console.log('🔍 X is array?', Array.isArray(plotData.data[0].x));
              console.log('🔍 X constructor:', plotData.data[0].x.constructor.name);
              
              // Convert to arrays - handle different types
              let xData: any[];
              let yData: any[];
              
              // Decode Plotly compressed data
              const decodeCompressedData = (data: any): number[] => {
                if (!data || typeof data !== 'object') return [];
                
                // Check if it's Plotly's compressed format {dtype: "i2", bdata: "..."}
                if (data.dtype && data.bdata) {
                  try {
                    // Decode base64
                    const binaryString = atob(data.bdata);
                    const bytes = new Uint8Array(binaryString.length);
                    for (let i = 0; i < binaryString.length; i++) {
                      bytes[i] = binaryString.charCodeAt(i);
                    }
                    
                    // Convert based on dtype
                    let result: number[] = [];
                    if (data.dtype === 'i1') {
                      // int8
                      result = Array.from(new Int8Array(bytes.buffer));
                    } else if (data.dtype === 'i2') {
                      // int16
                      result = Array.from(new Int16Array(bytes.buffer));
                    } else if (data.dtype === 'i4') {
                      // int32
                      result = Array.from(new Int32Array(bytes.buffer));
                    } else if (data.dtype === 'f4') {
                      // float32
                      result = Array.from(new Float32Array(bytes.buffer));
                    } else if (data.dtype === 'f8') {
                      // float64
                      result = Array.from(new Float64Array(bytes.buffer));
                    }
                    
                    return result;
                  } catch (error) {
                    console.error('Failed to decode compressed data:', error);
                    return [];
                  }
                } else if (Array.isArray(data)) {
                  return data;
                } else if (typeof data === 'object') {
                  return Object.values(data);
                }
                return [];
              };
              
              xData = decodeCompressedData(plotData.data[0].x);
              yData = decodeCompressedData(plotData.data[0].y);
              
              console.log('🔍 X data length:', xData.length, 'sample:', xData.slice(0, 5));
              console.log('🔍 Y data length:', yData.length, 'sample:', yData.slice(0, 5));
              
              // Convert strings to numbers if needed
              const numericXData = xData.map((x: any) => typeof x === 'string' ? parseFloat(x) : x);
              const numericYData = yData.map((y: any) => typeof y === 'string' ? parseFloat(y) : y);
              
              // Filter out non-numeric values
              const validIndices = numericXData.map((x: any, i: number) => 
                typeof x === 'number' && typeof numericYData[i] === 'number' && !isNaN(x) && !isNaN(numericYData[i]) ? i : -1
              ).filter((i: number) => i !== -1);
              
              const cleanXData = validIndices.map((i: number) => numericXData[i]);
              const cleanYData = validIndices.map((i: number) => numericYData[i]);
              
              if (cleanXData.length >= 3) {
                const regression = calculateRegression(cleanXData, cleanYData, regressionType);
                regressionEquation = regression.equation;
                
                enhancedData.push({
                  x: regression.x,
                  y: regression.y,
                  type: 'scatter',
                  mode: 'lines',
                  name: `${regressionType.charAt(0).toUpperCase() + regressionType.slice(1)} Regression`,
                  line: { color: 'red', width: 2, dash: 'dash' }
                });
              } else {
                console.warn('Not enough valid data points for regression:', cleanXData.length);
              }
            }
          } catch (error) {
            console.error('Error calculating regression:', error);
          }
        }
        
        return (
          <div style={{ width: '100%', height: '700px', display: 'flex', flexDirection: 'column' }}>
            {is2D && plotData.data[0]?.x && plotData.data[0]?.y && (
              <div className="flex items-center gap-2 px-4 pt-2 pb-2">
                <label className="flex items-center gap-1 text-xs font-medium">
                  <input
                    type="checkbox"
                    checked={showRegressionLine}
                    onChange={(e) => setShowRegressionLine(e.target.checked)}
                    className="rounded"
                  />
                  Regression
                </label>
                {showRegressionLine && (
                  <>
                    <select
                      value={regressionType}
                      onChange={(e) => setRegressionType(e.target.value as any)}
                      className="text-xs border rounded px-2 py-1 bg-white"
                    >
                      <option value="linear">Linear</option>
                      <option value="polynomial">Polynomial</option>
                      <option value="exponential">Exponential</option>
                    </select>
                  </>
                )}
              </div>
            )}
            <div 
              style={{ width: '100%', height: '100%', position: 'relative' }}
              className="nodrag"
            >
              <Plot
                data={enhancedData}
                layout={{
                  ...plotData.layout,
                  width: undefined,
                  height: undefined,
                  autosize: true,
                  legend: {
                    orientation: 'h',
                    yanchor: 'top',
                    y: -0.08,
                    xanchor: 'center',
                    x: 0.5
                  },
                  margin: { l: 50, r: 50, t: 40, b: 60 },
                  scene: !is2D ? {
                    ...plotData.layout?.scene,
                    camera: {
                      eye: { x: 1.5, y: 1.5, z: 1.3 },
                      center: { x: 0, y: 0, z: 0 },
                      up: { x: 0, y: 0, z: 1 }
                    },
                    dragmode: 'turntable'
                  } : undefined,
                  dragmode: !is2D ? 'turntable' : 'zoom',
                  hovermode: 'closest'
                }}
                config={{
                  responsive: true,
                  displayModeBar: false,
                  displaylogo: false,
                  scrollZoom: true,
                  doubleClick: 'reset'
                }}
                style={{ width: '100%', height: '100%' }}
                useResizeHandler={true}
                divId={`plot-${id}`}
              />
            </div>
            {showRegressionLine && regressionEquation && (
              <div className="px-4 pb-2 text-xs text-gray-600 font-mono text-center">
                {regressionEquation}
              </div>
            )}
          </div>
        );
      } catch (e) {
        console.error('[ExpandableNode] Error rendering plot:', e);
        return <div className="p-4 text-red-500 text-sm">Error rendering plot: {e instanceof Error ? e.message : String(e)}</div>;
      }
    }

    // Render images
    if (result.preview?.type === 'images' && result.preview?.images) {
      return (
        <div className="p-4 space-y-3">
          <div className="grid grid-cols-1 gap-3">
            {result.preview.images.map((imgSrc: string, idx: number) => (
              <div key={idx} className="relative">
                <img 
                  src={imgSrc} 
                  alt={`Generated ${idx + 1}`}
                  className="w-full h-auto rounded-lg shadow-md"
                />
                {result.preview.data && (
                  <div className="mt-2 text-xs text-gray-600 space-y-1">
                    {result.preview.data.prompt && (
                      <div><strong>Prompt:</strong> {result.preview.data.prompt}</div>
                    )}
                    {result.preview.data.seed && (
                      <div><strong>Seed:</strong> {result.preview.data.seed}</div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      );
    }

    // Render data table
    if (result.preview?.head && result.preview.head.length > 0) {
      const columns = Object.keys(result.preview.head[0]);
      const rows = result.preview.head; // Show all rows, not just first 5

      return (
        <div className="overflow-auto max-h-96">
          <table className="min-w-full divide-y divide-gray-200 text-xs">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                {columns.map((col) => (
                  <th
                    key={col}
                    className="px-2 py-1 text-left text-xs font-medium text-gray-500"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {rows.map((row: any, idx: number) => (
                <tr key={idx} className="hover:bg-gray-50">
                  {columns.map((col) => (
                    <td key={col} className="px-2 py-1 text-gray-900">
                      {typeof row[col] === 'number'
                        ? row[col].toFixed(3)
                        : String(row[col])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          {result.preview.shape && (
            <div className="px-2 py-1 bg-gray-50 text-xs text-gray-600 border-t">
              {result.preview.shape[0]} rows × {result.preview.shape[1]} columns
            </div>
          )}
        </div>
      );
    }

    // Render metrics
    if (result.metadata && Object.keys(result.metadata).length > 0) {
      return (
        <div className="p-3 space-y-2">
          {Object.entries(result.metadata)
            .filter(([_, value]) => typeof value !== 'object')
            .map(([key, value]) => (
              <div
                key={key}
                className="flex justify-between items-center py-1 border-b border-gray-100"
              >
                <span className="text-xs text-gray-600 uppercase">{key}</span>
                <span className="text-sm font-bold text-gray-900">
                  {typeof value === 'number' ? value.toFixed(4) : String(value)}
                </span>
              </div>
            ))}
        </div>
      );
    }

    return (
      <div className="p-4 text-center text-gray-500 text-sm">
        No preview available
      </div>
    );
  };

  const getNodeWidth = () => {
    if (isExpanded && showPreview) {
      // Layout affiancato: Config (1/3) + Results (2/3)
      if (result?.preview?.plot_json) {
        // Grafici sempre grandi con ampia colonna destra
        return 'w-[1400px]';
      }
      // Tabelle - calcola larghezza in base al numero di colonne
      if (result?.preview?.head) {
        const numColumns = result.preview.columns?.length || Object.keys(result.preview.head[0] || {}).length;
        if (numColumns >= 8) {
          return 'w-[1400px]'; // Molte colonne
        } else if (numColumns >= 6) {
          return 'w-[1100px]'; // Medie colonne
        } else if (numColumns >= 4) {
          return 'w-[900px]'; // Poche colonne
        }
      }
      return 'w-[700px]';
    }
    // Solo config
    return 'w-[300px]';
  };

  const getBorderColor = () => {
    if (status === 'error') return '#ef4444';
    return getCategoryColor().hex;
  };

  // Context menu handlers
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const menuWidth = 150;
    const menuHeight = 100;
    
    // Use the native event for accurate coordinates
    const x = e.nativeEvent.clientX;
    const y = e.nativeEvent.clientY;
    
    // Adjust if menu would go off screen
    let finalX = x;
    let finalY = y;
    
    if (x + menuWidth > window.innerWidth) {
      finalX = x - menuWidth;
    }
    if (y + menuHeight > window.innerHeight) {
      finalY = y - menuHeight;
    }
    
    setContextMenu({ x: finalX, y: finalY });
  };

  const handleDuplicateNode = () => {
    const nodeToDuplicate = nodes.find(n => n.id === id);
    if (nodeToDuplicate) {
      const newNode = {
        ...nodeToDuplicate,
        id: `${nodeToDuplicate.data.spec.type}-${Date.now()}`,
        position: {
          x: nodeToDuplicate.position.x + 100,
          y: nodeToDuplicate.position.y + 100,
        },
        selected: false,
      };
      setNodes([...nodes, newNode]);
    }
    setContextMenu(null);
  };

  const handleDeleteNode = () => {
    setNodes(nodes.filter(n => n.id !== id));
    setContextMenu(null);
  };

  // Close context menu on click outside
  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    if (contextMenu) {
      document.addEventListener('click', handleClick);
      return () => document.removeEventListener('click', handleClick);
    }
  }, [contextMenu]);

  return (
    <>
    <div 
      className={`${getNodeWidth()} rounded-lg relative`} 
      data-category={spec.category}
      onContextMenu={handleContextMenu}
    >
      {/* Main content area - no border */}
      <div 
        className={`relative rounded-lg ${getStatusColor()} shadow-lg transition-all duration-300`}
        style={{
          pointerEvents: 'auto',
          boxShadow: data.isExecuting
            ? '0 0 0 4px #3b82f6, 0 0 20px rgba(59, 130, 246, 0.5)'
            : selected 
              ? `0 0 0 3px ${darkMode ? '#ffffff' : '#000000'}`
              : undefined,
          transform: data.isExecuting ? 'scale(1.05)' : undefined,
        }}
      >
      {/* Input Handles */}
      {spec.inputs.map((input, idx) => (
        <div
          key={input.name}
          style={{
            position: 'absolute',
            left: -26,
            top: `${((idx + 1) * 100) / (spec.inputs.length + 1)}%`,
            transform: 'translateY(-50%)',
          }}
        >
          <Handle
            type="target"
            position={Position.Left}
            id={input.name}
            style={{
              position: 'relative',
              background: getCategoryColor().hex,
              width: 16,
              height: 16,
              border: '3px solid white',
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
              padding: '12px', // Invisible clickable area
            }}
          />
          <div 
            className="absolute right-full mr-3 top-1/2 -translate-y-1/2 text-xs text-gray-600 font-medium whitespace-nowrap pointer-events-none"
            style={{
              textShadow: '0 1px 2px rgba(0, 0, 0, 0.15), 0 0 4px rgba(255, 255, 255, 0.6)'
            }}
          >
            {input.label}
          </div>
        </div>
      ))}

      {/* Node Header - Draggable */}
      <div 
        className="px-3 py-2"
        style={{ 
          backgroundColor: getBorderColor(),
          borderTopLeftRadius: '0.5rem',
          borderTopRightRadius: '0.5rem'
        }}
      >
        <div className="flex items-center justify-between">
          <div
            className="cursor-pointer flex items-center gap-2 flex-1"
            onClick={() => setIsExpanded(!isExpanded)}
            onMouseDown={() => {
              // Allow dragging from header
              // Don't stop propagation here
            }}
          >
            <span className="text-lg">{spec.icon || '📦'}</span>
            <div>
              <div className="font-medium text-sm text-white">{t(`nodes.${spec.type}.label`, data.label)}</div>
              <div className="text-xs text-white/70">{t(`palette.categories.${spec.category}`, spec.category)}</div>
            </div>
          </div>
          <div className="flex items-center gap-1 nodrag">
            <div className="relative">
              <button
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
                className="p-1.5 hover:bg-white/20 rounded-full transition-colors nodrag"
                onClick={(e) => e.stopPropagation()}
              >
                <HelpCircle className="w-4 h-4 text-white" />
              </button>
              {showTooltip && (
                <div className="absolute right-0 top-6 w-64 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-xl z-50 nodrag">
                  <div className="font-semibold mb-1">{spec.label}</div>
                  <div className="mb-2 opacity-90">{spec.description}</div>
                  <div className="text-xs opacity-75 border-t border-gray-700 pt-2">
                    💡 Example: {getNodeExample()}
                  </div>
                </div>
              )}
            </div>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1.5 hover:bg-white/20 rounded-full transition-colors nodrag"
            >
              {isExpanded ? (
                <ChevronUp className="w-4 h-4 text-white" />
              ) : (
                <ChevronDown className="w-4 h-4 text-white" />
              )}
            </button>
          </div>
        </div>
        
        {/* Run Button - Always visible */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleRunNode();
          }}
          className={`w-full mt-2 px-4 py-2 text-sm font-medium rounded-xl flex items-center justify-center gap-2 transition-all nodrag ${
            status === 'running'
              ? 'bg-gradient-to-r from-red-400 via-orange-400 to-red-400 bg-[length:200%_100%] animate-gradient text-white cursor-wait'
              : status === 'success'
              ? 'bg-green-500/90 text-white hover:bg-green-500'
              : 'bg-blue-500/90 text-white hover:bg-blue-500'
          }`}
          disabled={status === 'running'}
        >
          {status === 'running' ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
              <span className="animate-pulse">{t('node.generating')}</span>
            </>
          ) : status === 'success' ? (
            <>
              ✓ {t('node.runAgain')}
            </>
          ) : (
            <>
              ▶ {t('node.run')}
            </>
          )}
        </button>
        
        {/* Generation Progress Bar */}
        {status === 'running' && spec.type === 'ai.generate_dataset' && (
          <div className="mt-2 px-2">
            <div className="text-xs text-gray-600 mb-1">
              {generationProgress || 'Inizializzazione...'}
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-500 to-purple-500 h-full rounded-full animate-pulse" 
                   style={{ width: '100%' }}></div>
            </div>
          </div>
        )}
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div 
          className="border-t border-gray-200 bg-white"
          style={{
            borderBottomLeftRadius: '0.5rem',
            borderBottomRightRadius: '0.5rem'
          }}
        >
          <div className={`flex ${showPreview ? 'divide-x divide-gray-200' : ''}`}>
            {/* Config Section - Always visible */}
            <div 
              className={`p-3 nodrag ${showPreview ? 'w-1/3 min-w-[200px]' : 'flex-1'}`}
            >
              <div className="flex items-center gap-1 mb-2">
                <Settings className="w-3 h-3 text-gray-600" />
                <span className="text-xs font-medium text-gray-700">{t('node.config')}</span>
              </div>
              <div className="space-y-3">
                {/* Base Parameters */}
                {baseParams.map((param) => (
                  <div key={param.name} className="space-y-1">
                    <label className="block text-xs font-medium text-gray-700">
                      {t(`params.${param.name}`, param.label)}
                      {param.required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    {param.description && (
                      <div className="text-xs text-gray-500 mb-1">
                        {t(`paramDescriptions.${param.name}`, param.description)}
                      </div>
                    )}
                    {renderParamInput(param)}
                  </div>
                ))}
                
                {/* Advanced Parameters Toggle */}
                {advancedParams.length > 0 && (
                  <div className="pt-2 border-t border-gray-200">
                    <button
                      onClick={() => setShowAdvanced(!showAdvanced)}
                      className="flex items-center gap-1 text-xs text-gray-600 hover:text-gray-800 transition-colors"
                    >
                      {showAdvanced ? (
                        <ChevronUp className="w-3 h-3" />
                      ) : (
                        <ChevronDown className="w-3 h-3" />
                      )}
                      <span className="font-medium">{t('node.advanced')} ({advancedParams.length})</span>
                    </button>
                    
                    {showAdvanced && (
                      <div className="mt-3 space-y-3">
                        {advancedParams.map((param) => (
                          <div key={param.name} className="space-y-1">
                            <label className="block text-xs font-medium text-gray-700">
                              {t(`params.${param.name}`, param.label)}
                              {param.required && <span className="text-red-500 ml-1">*</span>}
                            </label>
                            {param.description && (
                              <div className="text-xs text-gray-500 mb-1">
                                {t(`paramDescriptions.${param.name}`, param.description)}
                              </div>
                            )}
                            {renderParamInput(param)}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                
                {spec.params.length === 0 && (
                  <div className="text-center text-gray-500 text-sm">
                    {t('node.noParams')}
                  </div>
                )}
              </div>
            </div>

            {/* Preview Section - Side by side with config */}
            {showPreview && (
              <div 
                className={`${result?.preview?.plot_json ? 'p-0' : 'p-3'}`}
                style={result?.preview?.plot_json ? { width: '1000px', flexShrink: 0 } : { flex: 1 }}
                onMouseDown={(e) => {
                  // For plots, prevent node dragging but allow plot interaction
                  if (result?.preview?.plot_json) {
                    e.stopPropagation();
                  }
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1">
                    {result.preview?.plot_json ? (
                      <BarChart3 className="w-3 h-3 text-gray-600" />
                    ) : (
                      <Table2 className="w-3 h-3 text-gray-600" />
                    )}
                    <span className="text-xs font-medium text-gray-700">{t('node.results')}</span>
                  </div>
                  
                  {/* Edit Table Button for Custom Table only */}
                  {spec.type === 'data.custom_input' && result.preview?.head && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowTableEditor(true);
                      }}
                      className="px-2 py-1 text-xs bg-blue-500 hover:bg-blue-600 text-white rounded transition-colors flex items-center gap-1"
                    >
                      <Table2 className="w-3 h-3" />
                      Modifica Tabella
                    </button>
                  )}
                  
                  {/* View Full Table Button - Open Modal */}
                  {!result.preview?.editable && result.preview?.head && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowTableEditor(true);
                      }}
                      className="px-2 py-1 text-xs bg-green-500 hover:bg-green-600 text-white rounded transition-colors flex items-center gap-1"
                    >
                      <Table2 className="w-3 h-3" />
                      Controlla Tabella
                    </button>
                  )}
                  
                  {/* OLD: View Full Table Button in new window - DISABLED */}
                  {false && !result.preview?.editable && result.preview?.head && (
                    <button
                      onClick={async () => {
                        // Fetch full data from backend
                        try {
                          const response = await fetch(`http://127.0.0.1:8765/api/nodes/${id}/full-data`);
                          const fullDataResponse = await response.json();
                          
                          const tableData = {
                            data: fullDataResponse.data,
                            columns: fullDataResponse.columns,
                            title: `${t(`nodes.${spec.type}.label`, data.label)} (${fullDataResponse.rows} rows)`
                          };
                        
                        // Open table in new window
                        
                        // Calculate optimal width based on number of columns
                        const optimalWidth = Math.min(1800, Math.max(1000, tableData.columns.length * 150));
                        const newWindow = window.open('', '_blank', `width=${optimalWidth},height=800`);
                        if (newWindow) {
                          newWindow.document.write(`
                            <!DOCTYPE html>
                            <html>
                            <head>
                              <title>${tableData.title} - Table View</title>
                              <style>
                                * { margin: 0; padding: 0; box-sizing: border-box; }
                                body { 
                                  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                                  background: #f9fafb;
                                  padding: 20px;
                                }
                                .header {
                                  background: white;
                                  padding: 20px;
                                  border-radius: 12px;
                                  margin-bottom: 20px;
                                  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                                }
                                h1 { font-size: 24px; color: #1f2937; margin-bottom: 8px; }
                                .info { color: #6b7280; font-size: 14px; }
                                .table-container {
                                  background: white;
                                  border-radius: 12px;
                                  overflow: hidden;
                                  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                                }
                                table { 
                                  width: 100%; 
                                  border-collapse: collapse;
                                }
                                th {
                                  background: #f3f4f6;
                                  padding: 12px;
                                  text-align: left;
                                  font-weight: 600;
                                  font-size: 12px;
                                  color: #374151;
                                  border-bottom: 2px solid #e5e7eb;
                                  position: sticky;
                                  top: 0;
                                  z-index: 10;
                                }
                                td {
                                  padding: 12px;
                                  border-bottom: 1px solid #f3f4f6;
                                  font-size: 14px;
                                  color: #1f2937;
                                }
                                td[contenteditable] {
                                  cursor: text;
                                  outline: none;
                                }
                                td[contenteditable]:hover {
                                  background: #fef3c7;
                                }
                                td[contenteditable]:focus {
                                  background: #fef08a;
                                  box-shadow: inset 0 0 0 2px #eab308;
                                }
                                tr:hover { background: #f9fafb; }
                                .row-num {
                                  color: #9ca3af;
                                  font-family: monospace;
                                  font-size: 12px;
                                }
                              </style>
                            </head>
                            <body>
                              <div class="header">
                                <div>
                                  <h1>${tableData.title}</h1>
                                  <div class="info">${tableData.data.length} rows × ${tableData.columns.length} columns</div>
                                </div>
                                <div style="display: flex; gap: 10px; align-items: center;">
                                  <button onclick="addNewRow()" style="padding: 10px 20px; background: #10b981; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600;">
                                    ➕ Nuova Riga
                                  </button>
                                  <button onclick="addNewColumn()" style="padding: 10px 20px; background: #10b981; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600;">
                                    ➕ Nuova Colonna
                                  </button>
                                  <div style="width: 1px; height: 24px; background: #e5e7eb;"></div>
                                  <button id="deleteRowsBtn" onclick="deleteSelectedRows()" style="display: none; padding: 10px 20px; background: #ef4444; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600;">
                                    🗑️ Elimina <span id="rowCount">0</span> righe
                                  </button>
                                  <button id="deleteColsBtn" onclick="deleteSelectedColumns()" style="display: none; padding: 10px 20px; background: #ef4444; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600;">
                                    🗑️ Elimina <span id="colCount">0</span> colonne
                                  </button>
                                  <div style="width: 1px; height: 24px; background: #e5e7eb;"></div>
                                  <button onclick="saveChanges()" style="padding: 10px 20px; background: #3b82f6; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600;">
                                    💾 Salva Modifiche
                                  </button>
                                  <button onclick="exportCSV()" style="padding: 10px 20px; background: #10b981; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600;">
                                    📥 Esporta CSV
                                  </button>
                                </div>
                              </div>
                              <div class="table-container">
                                <table>
                                  <thead>
                                    <tr>
                                      <th style="width: 40px; text-align: center;">
                                        <input type="checkbox" id="selectAll" onchange="toggleSelectAll(this)" style="cursor: pointer;">
                                      </th>
                                      <th>#</th>
                                      ${tableData.columns.map((col, idx) => `
                                        <th>
                                          <div style="display: flex; align-items: center; gap: 8px;">
                                            <input type="checkbox" class="col-checkbox" data-col-idx="${idx}" onchange="toggleColumnSelection(${idx})" style="cursor: pointer;">
                                            <span contenteditable="true" onblur="renameColumn(${idx}, this.textContent)" style="cursor: text; padding: 2px 4px; border-radius: 4px;" onmouseover="this.style.background='#fef3c7'" onmouseout="this.style.background='transparent'">${col}</span>
                                          </div>
                                        </th>
                                      `).join('')}
                                    </tr>
                                  </thead>
                                  <tbody>
                                    ${tableData.data.map((row, i) => `
                                      <tr data-row-idx="${i}">
                                        <td style="text-align: center;">
                                          <input type="checkbox" class="row-checkbox" data-row-idx="${i}" onchange="updateSelection()" style="cursor: pointer;">
                                        </td>
                                        <td class="row-num">${i + 1}</td>
                                        ${tableData.columns.map(col => `<td contenteditable="true">${row[col] ?? '-'}</td>`).join('')}
                                      </tr>
                                    `).join('')}
                                  </tbody>
                                </table>
                              </div>
                              <script>
                                const nodeId = '${id}';
                                let columns = ${JSON.stringify(tableData.columns)};
                                let selectedRows = new Set();
                                let selectedColumns = new Set();
                                
                                function updateSelection() {
                                  // Update selected rows
                                  selectedRows.clear();
                                  document.querySelectorAll('.row-checkbox:checked').forEach(cb => {
                                    selectedRows.add(parseInt(cb.dataset.rowIdx));
                                  });
                                  
                                  // Update selected columns
                                  selectedColumns.clear();
                                  document.querySelectorAll('.col-checkbox:checked').forEach(cb => {
                                    selectedColumns.add(parseInt(cb.dataset.colIdx));
                                  });
                                  
                                  // Show/hide delete buttons
                                  const deleteRowsBtn = document.getElementById('deleteRowsBtn');
                                  const deleteColsBtn = document.getElementById('deleteColsBtn');
                                  const rowCount = document.getElementById('rowCount');
                                  const colCount = document.getElementById('colCount');
                                  
                                  if (selectedRows.size > 0) {
                                    deleteRowsBtn.style.display = 'block';
                                    rowCount.textContent = selectedRows.size;
                                  } else {
                                    deleteRowsBtn.style.display = 'none';
                                  }
                                  
                                  if (selectedColumns.size > 0) {
                                    deleteColsBtn.style.display = 'block';
                                    colCount.textContent = selectedColumns.size;
                                  } else {
                                    deleteColsBtn.style.display = 'none';
                                  }
                                }
                                
                                function toggleSelectAll(checkbox) {
                                  document.querySelectorAll('.row-checkbox').forEach(cb => {
                                    cb.checked = checkbox.checked;
                                  });
                                  updateSelection();
                                }
                                
                                function toggleColumnSelection(colIdx) {
                                  updateSelection();
                                }
                                
                                function deleteSelectedRows() {
                                  if (!confirm(\`Eliminare \${selectedRows.size} righe?\`)) return;
                                  
                                  const rowsToDelete = Array.from(selectedRows).sort((a, b) => b - a);
                                  rowsToDelete.forEach(idx => {
                                    const row = document.querySelector(\`tr[data-row-idx="\${idx}"]\`);
                                    if (row) row.remove();
                                  });
                                  
                                  selectedRows.clear();
                                  updateSelection();
                                  document.getElementById('selectAll').checked = false;
                                }
                                
                                function deleteSelectedColumns() {
                                  if (!confirm(\`Eliminare \${selectedColumns.size} colonne?\`)) return;
                                  
                                  const colsToDelete = Array.from(selectedColumns).sort((a, b) => b - a);
                                  
                                  // Remove column headers
                                  colsToDelete.forEach(idx => {
                                    const th = document.querySelector(\`th:nth-child(\${idx + 3})\`);
                                    if (th) th.remove();
                                  });
                                  
                                  // Remove column cells from each row
                                  document.querySelectorAll('tbody tr').forEach(row => {
                                    colsToDelete.forEach(idx => {
                                      const td = row.querySelector(\`td:nth-child(\${idx + 3})\`);
                                      if (td) td.remove();
                                    });
                                  });
                                  
                                  // Update columns array
                                  columns = columns.filter((_, idx) => !selectedColumns.has(idx));
                                  
                                  selectedColumns.clear();
                                  updateSelection();
                                }
                                
                                function addNewRow() {
                                  const tbody = document.querySelector('tbody');
                                  const newRow = document.createElement('tr');
                                  const rowIndex = document.querySelectorAll('tbody tr').length;
                                  
                                  newRow.dataset.rowIdx = rowIndex;
                                  newRow.innerHTML = \`
                                    <td style="text-align: center;">
                                      <input type="checkbox" class="row-checkbox" data-row-idx="\${rowIndex}" onchange="updateSelection()" style="cursor: pointer;">
                                    </td>
                                    <td class="row-num">\${rowIndex + 1}</td>
                                    \${columns.map(col => \`<td contenteditable="true"></td>\`).join('')}
                                  \`;
                                  tbody.appendChild(newRow);
                                }
                                
                                function addNewColumn() {
                                  const newColName = prompt('Nome nuova colonna:', 'NuovaColonna');
                                  if (!newColName) return;
                                  
                                  columns.push(newColName);
                                  const colIdx = columns.length - 1;
                                  
                                  // Add header
                                  const headerRow = document.querySelector('thead tr');
                                  const th = document.createElement('th');
                                  th.className = 'px-4 py-3 text-left border-b-2 border-gray-200 bg-gray-50 whitespace-nowrap';
                                  th.innerHTML = \`
                                    <div style="display: flex; align-items: center; gap: 8px;">
                                      <input type="checkbox" class="col-checkbox" data-col-idx="\${colIdx}" onchange="toggleColumnSelection(\${colIdx})" style="cursor: pointer;">
                                      <span contenteditable="true" onblur="renameColumn(\${colIdx}, this.textContent)" style="cursor: text; padding: 2px 4px; border-radius: 4px;" onmouseover="this.style.background='#fef3c7'" onmouseout="this.style.background='transparent'">\${newColName}</span>
                                    </div>
                                  \`;
                                  headerRow.appendChild(th);
                                  
                                  // Add cells to all rows
                                  document.querySelectorAll('tbody tr').forEach(row => {
                                    const td = document.createElement('td');
                                    td.contentEditable = 'true';
                                    td.className = 'px-4 py-2 border-b border-gray-100';
                                    row.appendChild(td);
                                  });
                                }
                                
                                function renameColumn(colIdx, newName) {
                                  if (newName && newName.trim()) {
                                    columns[colIdx] = newName.trim();
                                  }
                                }
                                
                                function saveChanges() {
                                  // Collect all data from table
                                  const rows = document.querySelectorAll('tbody tr');
                                  const data = [];
                                  
                                  rows.forEach(row => {
                                    const cells = row.querySelectorAll('td[contenteditable]');
                                    const rowData = {};
                                    cells.forEach((cell, idx) => {
                                      const value = cell.textContent.trim();
                                      rowData[columns[idx]] = isNaN(value) ? value : parseFloat(value);
                                    });
                                    data.push(rowData);
                                  });
                                  
                                  // Update parent window's node data
                                  if (window.opener && !window.opener.closed) {
                                    window.opener.postMessage({
                                      type: 'UPDATE_NODE_DATA',
                                      nodeId: nodeId,
                                      data: data,
                                      columns: columns
                                    }, '*');
                                  }
                                  
                                  alert('✅ Modifiche salvate con successo!');
                                  window.close();
                                }
                                
                                function exportCSV() {
                                  const rows = document.querySelectorAll('tbody tr');
                                  const csvRows = [];
                                  csvRows.push(columns.join(','));
                                  
                                  rows.forEach(row => {
                                    const cells = row.querySelectorAll('td[contenteditable]');
                                    const values = Array.from(cells).map(cell => {
                                      const val = cell.textContent.trim();
                                      return val.includes(',') ? '"' + val + '"' : val;
                                    });
                                    csvRows.push(values.join(','));
                                  });
                                  
                                  const csv = csvRows.join('\\n');
                                  const blob = new Blob([csv], { type: 'text/csv' });
                                  const url = URL.createObjectURL(blob);
                                  const a = document.createElement('a');
                                  a.href = url;
                                  a.download = 'data.csv';
                                  a.click();
                                  URL.revokeObjectURL(url);
                                }
                              </script>
                            </body>
                            </html>
                          `);
                          newWindow.document.close();
                        }
                        } catch (error) {
                          console.error('Failed to load full data:', error);
                          alert('Failed to load full table data. Please try again.');
                        }
                      }}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs bg-blue-500/90 text-white hover:bg-blue-500 rounded-lg transition-all"
                    >
                      <Eye className="w-3 h-3" />
                      {t('table.view')}
                    </button>
                  )}
                </div>
                {renderPreview()}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Output Handles */}
      {spec.outputs.map((output, idx) => (
        <div
          key={output.name}
          style={{
            position: 'absolute',
            right: -26,
            top: `${((idx + 1) * 100) / (spec.outputs.length + 1)}%`,
            transform: 'translateY(-50%)',
          }}
        >
          <Handle
            type="source"
            position={Position.Right}
            id={output.name}
            style={{
              position: 'relative',
              background: getCategoryColor().hex,
              width: 16,
              height: 16,
              border: '3px solid white',
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
              padding: '12px', // Invisible clickable area
            }}
          />
          <div 
            className="absolute left-full ml-3 top-1/2 -translate-y-1/2 text-xs text-gray-600 font-medium whitespace-nowrap pointer-events-none"
            style={{
              textShadow: '0 1px 2px rgba(0, 0, 0, 0.15), 0 0 4px rgba(255, 255, 255, 0.6)'
            }}
          >
            {output.label}
          </div>
        </div>
      ))}
      
      {/* Table Editor Modal */}
      {showTableEditor && result?.preview?.head && (
        <TableEditor
          data={result.preview.head}
          columns={result.preview.columns || Object.keys(result.preview.head[0] || {})}
          onClose={() => setShowTableEditor(false)}
          onSave={async (newData, newColumns) => {
            // Update the node result with new data
            if (result) {
              result.preview.head = newData;
              result.preview.columns = newColumns;
              
              // Update the table_data parameter for Custom Table nodes
              if (spec.type === 'data.custom_input') {
                const tableData = JSON.stringify({
                  columns: newColumns,
                  data: newData
                });
                updateNodeParams(id, { table_data: tableData });
              }
              
              // Trigger re-render
              setShowTableEditor(false);
            }
          }}
          nodeId={id}
          sessionId={sessionId}
          title={`${t(`nodes.${spec.type}.label`, data.label)} - ${t('table.view')}`}
          darkMode={darkMode}
        />
      )}
      </div>
    </div>

    {/* Context Menu - Portal to body to avoid transform issues */}
    {contextMenu && createPortal(
      <div
        className="fixed bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-1"
        style={{
          left: `${contextMenu.x}px`,
          top: `${contextMenu.y}px`,
          zIndex: 9999,
          position: 'fixed',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={handleDuplicateNode}
          className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
        >
          <CopyIcon className="w-4 h-4" />
          Duplica
        </button>
        <div className="border-t border-gray-200 dark:border-gray-700 my-1" />
        <button
          onClick={handleDeleteNode}
          className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 flex items-center gap-2"
        >
          <Trash2 className="w-4 h-4" />
          Cancella
        </button>
      </div>,
      document.body
    )}
    </>
  );
};
