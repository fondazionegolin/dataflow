/**
 * Visual equation input with mathematical symbol keyboard and LaTeX preview
 */

import React, { useState, useRef, useEffect } from 'react';
import { X, Calculator, Sigma, Eye, EyeOff } from 'lucide-react';

interface EquationInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  darkMode?: boolean;
  showLatex?: boolean;
  onKeyboardToggle?: (isOpen: boolean) => void;
}

// Convert Python/SymPy syntax to LaTeX for preview
const convertToLatex = (expr: string): string => {
  let latex = expr;
  
  // Replace ** with ^
  latex = latex.replace(/\*\*/g, '^');
  
  // Replace * with \cdot for multiplication
  latex = latex.replace(/\*/g, '\\cdot ');
  
  // Functions
  latex = latex.replace(/sqrt\(([^)]+)\)/g, '\\sqrt{$1}');
  latex = latex.replace(/exp\(([^)]+)\)/g, 'e^{$1}');
  latex = latex.replace(/log\(([^)]+)\)/g, '\\ln($1)');
  latex = latex.replace(/log10\(([^)]+)\)/g, '\\log_{10}($1)');
  latex = latex.replace(/abs\(([^)]+)\)/g, '|$1|');
  
  // Trigonometric
  latex = latex.replace(/sin\(/g, '\\sin(');
  latex = latex.replace(/cos\(/g, '\\cos(');
  latex = latex.replace(/tan\(/g, '\\tan(');
  
  // Constants
  latex = latex.replace(/\bpi\b/g, '\\pi');
  latex = latex.replace(/\bE\b/g, 'e');
  
  return latex;
};

// Symbol categories defined outside component for better performance
const symbolCategories = {
  basic: [
    { label: 'x²', value: '**2', description: 'Square' },
    { label: 'x³', value: '**3', description: 'Cube' },
    { label: 'xⁿ', value: '**', description: 'Power' },
    { label: '√x', value: 'sqrt()', description: 'Square root' },
    { label: 'x/y', value: '/', description: 'Fraction' },
    { label: '()', value: '()', description: 'Parentheses' },
  ],
  functions: [
    { label: 'eˣ', value: 'exp()', description: 'Exponential' },
    { label: 'ln(x)', value: 'log()', description: 'Natural log' },
    { label: 'log₁₀', value: 'log10()', description: 'Log base 10' },
    { label: '|x|', value: 'abs()', description: 'Absolute value' },
  ],
  trig: [
    { label: 'sin', value: 'sin()', description: 'Sine' },
    { label: 'cos', value: 'cos()', description: 'Cosine' },
    { label: 'tan', value: 'tan()', description: 'Tangent' },
  ],
  constants: [
    { label: 'π', value: 'pi', description: 'Pi constant' },
    { label: 'e', value: 'E', description: 'Euler number' },
    { label: '∞', value: 'oo', description: 'Infinity' },
  ]
};

export const EquationInput: React.FC<EquationInputProps> = ({
  value,
  onChange,
  placeholder = "Enter equation...",
  darkMode = false,
  showLatex = true,
  onKeyboardToggle
}) => {
  const [showKeyboard, setShowKeyboard] = useState(false);
  
  // Notify parent when keyboard opens/closes
  useEffect(() => {
    onKeyboardToggle?.(showKeyboard);
  }, [showKeyboard, onKeyboardToggle]);
  const [showPreview, setShowPreview] = useState(true);
  const [latexPreview, setLatexPreview] = useState('');
  const [activeCategory, setActiveCategory] = useState<keyof typeof symbolCategories>('basic');
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Update LaTeX preview when value changes
  useEffect(() => {
    if (value && showLatex) {
      setLatexPreview(convertToLatex(value));
    }
  }, [value, showLatex]);

  const insertSymbol = (symbol: string) => {
    if (!inputRef.current) return;

    const input = inputRef.current;
    const start = input.selectionStart || 0;
    const end = input.selectionEnd || 0;
    const text = value;

    // Insert symbol at cursor position
    const before = text.substring(0, start);
    const after = text.substring(end);
    
    // For functions with (), place cursor inside
    let newValue = before + symbol + after;
    let cursorPos = start + symbol.length;
    
    if (symbol.includes('()')) {
      cursorPos = start + symbol.indexOf('(') + 1;
    }

    onChange(newValue);

    // Set cursor position after update
    setTimeout(() => {
      input.focus();
      input.setSelectionRange(cursorPos, cursorPos);
    }, 0);
  };

  return (
    <div className="relative w-full">
      {/* Input field */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setShowKeyboard(true)}
          placeholder={placeholder}
          className={`w-full px-3 py-2 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400/50 transition-all font-mono ${
            darkMode 
              ? 'bg-[#1e1e1e] text-gray-100 border-gray-700' 
              : 'bg-gray-50 text-gray-900 border-gray-300'
          }`}
        />
        {showKeyboard && (
          <button
            onClick={() => setShowKeyboard(false)}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* LaTeX Preview */}
      {showLatex && value && latexPreview && (
        <div className={`mt-2 p-3 rounded-xl border ${
          darkMode 
            ? 'bg-[#2d2d2d] border-gray-700' 
            : 'bg-blue-50 border-blue-200'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs font-medium text-gray-600 dark:text-gray-400 flex items-center gap-1">
              <Calculator className="w-3 h-3" />
              Preview
            </div>
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
            >
              {showPreview ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
            </button>
          </div>
          {showPreview && (
            <div className={`text-center text-lg font-serif py-2 ${
              darkMode ? 'text-gray-100' : 'text-gray-800'
            }`}>
              f(x) = {latexPreview}
            </div>
          )}
        </div>
      )}

      {/* Mathematical keyboard */}
      {showKeyboard && (
        <div className={`mt-2 p-3 rounded-xl border shadow-lg w-full ${
          darkMode 
            ? 'bg-[#2d2d2d] border-gray-700' 
            : 'bg-white border-gray-200'
        }`}>
          {/* Category tabs */}
          <div className="flex gap-1 mb-3 border-b border-gray-200 dark:border-gray-700">
            {Object.keys(symbolCategories).map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat as keyof typeof symbolCategories)}
                className={`px-3 py-1.5 text-xs font-medium rounded-t-lg transition-colors ${
                  activeCategory === cat
                    ? darkMode
                      ? 'bg-[#3d3d3d] text-blue-400 border-b-2 border-blue-400'
                      : 'bg-gray-100 text-blue-600 border-b-2 border-blue-600'
                    : darkMode
                      ? 'text-gray-400 hover:text-gray-200'
                      : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {cat === 'basic' && '🔢 Base'}
                {cat === 'functions' && '📐 Funzioni'}
                {cat === 'trig' && '📊 Trigonometria'}
                {cat === 'constants' && '🔤 Costanti'}
              </button>
            ))}
          </div>
          
          {/* Symbol buttons */}
          <div className="grid grid-cols-6 gap-1.5 mb-3">
            {symbolCategories[activeCategory].map((symbol, idx) => (
              <button
                key={idx}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  insertSymbol(symbol.value);
                }}
                title={symbol.description}
                className={`px-2 py-2 rounded-lg transition-all hover:scale-105 border ${
                  darkMode
                    ? 'bg-[#3d3d3d] hover:bg-[#4d4d4d] border-gray-600'
                    : 'bg-gray-200 hover:bg-gray-300 border-gray-400'
                }`}
                type="button"
                style={{ 
                  minWidth: '40px', 
                  minHeight: '40px',
                  color: darkMode ? '#ffffff' : '#000000',
                  fontSize: '18px',
                  fontWeight: 'bold',
                  WebkitTextFillColor: darkMode ? '#ffffff' : '#000000'
                } as React.CSSProperties}
              >
                <span style={{ color: darkMode ? '#ffffff' : '#000000' }}>{symbol.label}</span>
              </button>
            ))}
          </div>
          
          {/* Quick examples */}
          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            <div className="text-xs font-medium mb-2 text-gray-600 dark:text-gray-400">
              Examples
            </div>
            <div className="flex flex-wrap gap-1.5">
              {[
                'x**2 + 2*x + 1',
                'sin(x) + cos(x)',
                'exp(-x**2)',
                'sqrt(x) + log(x)',
                '1/(1 + exp(-x))'
              ].map((example, idx) => (
                <button
                  key={idx}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onChange(example);
                  }}
                  className={`px-2 py-1.5 rounded-lg transition-colors border ${
                    darkMode
                      ? 'bg-blue-900/30 hover:bg-blue-900/50 border-blue-700'
                      : 'bg-blue-100 hover:bg-blue-200 border-blue-400'
                  }`}
                  type="button"
                  style={{ 
                    color: darkMode ? '#93c5fd' : '#000000',
                    fontSize: '12px',
                    fontWeight: '600',
                    WebkitTextFillColor: darkMode ? '#93c5fd' : '#000000'
                  } as React.CSSProperties}
                >
                  <span style={{ color: darkMode ? '#93c5fd' : '#000000' }}>{example}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
