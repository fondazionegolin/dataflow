import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, BookOpen, Database, Wrench, BarChart3, Brain, Search, FileText, Folder, Sparkles, Table, Filter, Columns, Split, GitMerge, Trash, TrendingUp, Target, Wand2, CircleDot, MessageSquare, Smile, Tag, Library } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ItalyFlag, UKFlag } from '../components/FlatFlags';

export const WikiPage: React.FC = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [activeSection, setActiveSection] = useState<string>('overview');

  const sections = [
    { id: 'overview', label: t('wiki.sections.overview'), icon: BookOpen },
    { id: 'sources', label: t('wiki.sections.sources'), icon: Database },
    { id: 'transform', label: t('wiki.sections.transform'), icon: Wrench },
    { id: 'visualization', label: t('wiki.sections.visualization'), icon: BarChart3 },
    { id: 'ml', label: t('wiki.sections.ml'), icon: Brain },
    { id: 'nlp', label: t('wiki.sections.nlp'), icon: FileText },
    { id: 'testing', label: 'Testing & Sentiment', icon: Target },
    { id: 'examples', label: t('wiki.sections.examples'), icon: Search },
  ];

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100/80 rounded-xl transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              Home
            </button>
            <div className="w-px h-6 bg-gray-300" />
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <BookOpen className="w-6 h-6" />
              {t('wiki.title')}
            </h1>
          </div>
          
          {/* Language Switcher */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => i18n.changeLanguage('it')}
              className={`px-2 py-1.5 rounded-xl transition-all ${
                i18n.language === 'it' ? 'bg-blue-500/10 ring-2 ring-blue-400/30' : 'hover:bg-gray-100/80'
              }`}
              title="Italiano"
            >
              <ItalyFlag />
            </button>
            <button
              onClick={() => i18n.changeLanguage('en')}
              className={`px-2 py-1.5 rounded-xl transition-all ${
                i18n.language === 'en' ? 'bg-blue-500/10 ring-2 ring-blue-400/30' : 'hover:bg-gray-100/80'
              }`}
              title="English"
            >
              <UKFlag />
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-64 bg-white border-r border-gray-200 overflow-y-auto">
          <nav className="p-4 space-y-1">
            {sections.map((section) => {
              const Icon = section.icon;
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    activeSection === section.id
                      ? 'bg-blue-500 text-white shadow-lg'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{section.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-4xl mx-auto">
            {activeSection === 'overview' && <OverviewSection />}
            {activeSection === 'sources' && <SourcesSection />}
            {activeSection === 'transform' && <TransformSection />}
            {activeSection === 'visualization' && <VisualizationSection />}
            {activeSection === 'ml' && <MLSection />}
            {activeSection === 'nlp' && <NLPSection />}
            {activeSection === 'testing' && <TestingSection />}
            {activeSection === 'examples' && <ExamplesSection />}
          </div>
        </div>
      </div>
    </div>
  );
};

const OverviewSection: React.FC = () => {
  const { t } = useTranslation();
  
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-gray-800">{t('wiki.overview.welcome')}</h2>
      <p className="text-lg text-gray-600">
        {t('wiki.overview.description')}
      </p>

      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
        <h3 className="font-semibold text-blue-900 mb-2">{t('wiki.overview.gettingStarted')}</h3>
        <ol className="list-decimal list-inside space-y-2 text-blue-800">
          <li>{t('wiki.overview.steps.1')}</li>
          <li>{t('wiki.overview.steps.2')}</li>
          <li>{t('wiki.overview.steps.3')}</li>
          <li>{t('wiki.overview.steps.4')}</li>
          <li>{t('wiki.overview.steps.5')}</li>
        </ol>
      </div>

      <h3 className="text-2xl font-bold text-gray-800 mt-8">{t('wiki.overview.categories')}</h3>
      <div className="grid grid-cols-2 gap-4">
        <NodeCategoryCardIcon
          Icon={Database}
          title={t('wiki.nodeCategories.sources.title')}
          description={t('wiki.nodeCategories.sources.description')}
        />
        <NodeCategoryCardIcon
          Icon={Wrench}
          title={t('wiki.nodeCategories.transform.title')}
          description={t('wiki.nodeCategories.transform.description')}
        />
        <NodeCategoryCardIcon
          Icon={BarChart3}
          title={t('wiki.nodeCategories.visualization.title')}
          description={t('wiki.nodeCategories.visualization.description')}
        />
        <NodeCategoryCardIcon
          Icon={Brain}
          title={t('wiki.nodeCategories.ml.title')}
          description={t('wiki.nodeCategories.ml.description')}
        />
        <NodeCategoryCardIcon
          Icon={FileText}
          title={t('wiki.nodeCategories.nlp.title')}
          description={t('wiki.nodeCategories.nlp.description')}
        />
        <NodeCategoryCardIcon
          Icon={CircleDot}
          title={t('wiki.nodeCategories.clustering.title')}
          description={t('wiki.nodeCategories.clustering.description')}
        />
      </div>
    </div>
  );
};

const NodeCategoryCardIcon: React.FC<{ Icon: React.ElementType; title: string; description: string }> = ({
  Icon,
  title,
  description,
}) => (
  <div className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-lg transition-shadow">
    <Icon className="w-8 h-8 mb-2 text-gray-700" />
    <h4 className="font-bold text-gray-800 mb-1">{title}</h4>
    <p className="text-sm text-gray-600">{description}</p>
  </div>
);

const SourcesSection: React.FC = () => {
  const { t } = useTranslation();
  
  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-2"><Database className="w-8 h-8" /> {t('wiki.sections.sources')}</h2>
    
    <NodeDoc
      Icon={Folder}
      name="CSV Loader"
      type="data.csv"
      description="Load data from CSV files with automatic type detection"
      inputs={[]}
      outputs={[{ name: 'table', type: 'TABLE', description: 'Loaded data table' }]}
      params={[
        { name: 'file_path', type: 'STRING', description: 'Path to CSV file', required: true },
        { name: 'delimiter', type: 'STRING', description: 'Column delimiter (default: ",")', default: ',' },
        { name: 'has_header', type: 'BOOLEAN', description: 'First row contains column names', default: true },
      ]}
      example="Load a CSV file with customer data for analysis"
    />

    <NodeDoc
      Icon={Sparkles}
      name="Generate Dataset"
      type="data.generate"
      description="Generate synthetic datasets for testing and prototyping"
      inputs={[]}
      outputs={[{ name: 'table', type: 'TABLE', description: 'Generated data table' }]}
      params={[
        { name: 'dataset_type', type: 'SELECT', description: 'Type of dataset to generate', options: ['random', 'linear', 'polynomial', 'sine', 'classification'] },
        { name: 'n_samples', type: 'INTEGER', description: 'Number of samples', default: 100 },
        { name: 'n_features', type: 'INTEGER', description: 'Number of features', default: 2 },
        { name: 'noise', type: 'SLIDER', description: 'Amount of noise', default: 0.1 },
      ]}
      example="Generate synthetic data to test your ML models"
    />

    <NodeDoc
      Icon={Database}
      name="AI Dataset Loader"
      type="ai.load_dataset"
      description="Load pre-configured AI/ML datasets from the database"
      inputs={[]}
      outputs={[{ name: 'table', type: 'TABLE', description: 'Dataset table' }]}
      params={[
        { name: 'dataset_name', type: 'SELECT', description: 'Select a dataset', options: ['Iris', 'Wine', 'Boston Housing', 'Custom'] },
      ]}
      example="Load the Iris dataset for classification tasks"
    />
  </div>
  );
};

const TransformSection: React.FC = () => {
  const { t } = useTranslation();
  
  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-2"><Wrench className="w-8 h-8" /> {t('wiki.sections.transform')}</h2>
    
    <NodeDoc
      Icon={Filter}
      name="Filter Rows"
      type="data.filter"
      description="Filter rows based on column values and conditions"
      inputs={[{ name: 'table', type: 'TABLE', description: 'Input data' }]}
      outputs={[{ name: 'table', type: 'TABLE', description: 'Filtered data' }]}
      params={[
        { name: 'column', type: 'COLUMN', description: 'Column to filter on', required: true },
        { name: 'operator', type: 'SELECT', description: 'Comparison operator', options: ['>', '<', '>=', '<=', '==', '!='] },
        { name: 'value', type: 'STRING', description: 'Value to compare against', required: true },
      ]}
      example="Filter houses with price > 300000"
    />

    <NodeDoc
      Icon={Columns}
      name="Select Columns"
      type="data.select"
      description="Select specific columns from your dataset"
      inputs={[{ name: 'table', type: 'TABLE', description: 'Input data' }]}
      outputs={[{ name: 'table', type: 'TABLE', description: 'Selected columns' }]}
      params={[
        { name: 'columns', type: 'STRING', description: 'Comma-separated column names', required: true },
      ]}
      example="Select only 'age', 'income', 'score' columns"
    />

    <NodeDoc
      Icon={Split}
      name="Split Data"
      type="data.split"
      description="Split dataset into training and testing sets"
      inputs={[{ name: 'table', type: 'TABLE', description: 'Input data' }]}
      outputs={[
        { name: 'train', type: 'TABLE', description: 'Training set' },
        { name: 'test', type: 'TABLE', description: 'Testing set' }
      ]}
      params={[
        { name: 'test_size', type: 'SLIDER', description: 'Proportion for test set', default: 0.2, min: 0.1, max: 0.5 },
        { name: 'random_state', type: 'INTEGER', description: 'Random seed for reproducibility', default: 42 },
      ]}
      example="Split data into 80% training and 20% testing"
    />

    <NodeDoc
      Icon={GitMerge}
      name="Join Tables"
      type="data.join"
      description="Merge two tables based on a common column"
      inputs={[
        { name: 'left', type: 'TABLE', description: 'Left table' },
        { name: 'right', type: 'TABLE', description: 'Right table' }
      ]}
      outputs={[{ name: 'table', type: 'TABLE', description: 'Merged table' }]}
      params={[
        { name: 'left_on', type: 'COLUMN', description: 'Column from left table', required: true },
        { name: 'right_on', type: 'COLUMN', description: 'Column from right table', required: true },
        { name: 'how', type: 'SELECT', description: 'Join type', options: ['inner', 'left', 'right', 'outer'], default: 'inner' },
      ]}
      example="Join customer data with purchase history"
    />

    <NodeDoc
      Icon={Trash}
      name="Clean Data"
      type="data.clean"
      description="Remove missing values and duplicates"
      inputs={[{ name: 'table', type: 'TABLE', description: 'Input data' }]}
      outputs={[{ name: 'table', type: 'TABLE', description: 'Cleaned data' }]}
      params={[
        { name: 'drop_na', type: 'BOOLEAN', description: 'Remove rows with missing values', default: true },
        { name: 'drop_duplicates', type: 'BOOLEAN', description: 'Remove duplicate rows', default: true },
        { name: 'fill_method', type: 'SELECT', description: 'Method to fill missing values', options: ['none', 'mean', 'median', 'mode', 'forward', 'backward'] },
      ]}
      example="Clean dataset by removing NaN values and duplicates"
    />
  </div>
  );
};

const VisualizationSection: React.FC = () => {
  const { t } = useTranslation();
  
  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-2"><BarChart3 className="w-8 h-8" /> {t('wiki.sections.visualization')}</h2>
    
    <NodeDoc
      Icon={BarChart3}
      name="2D Scatter Plot"
      type="plot.2d"
      description="Create interactive 2D scatter plots with optional color and size mapping. Supports regression analysis (linear, polynomial, exponential)."
      inputs={[{ name: 'table', type: 'TABLE', description: 'Data to plot' }]}
      outputs={[{ name: 'plot', type: 'PARAMS', description: 'Plot configuration' }]}
      params={[
        { name: 'x_column', type: 'COLUMN', description: 'Column for X axis', required: true },
        { name: 'y_column', type: 'COLUMN', description: 'Column for Y axis', required: true },
        { name: 'color_column', type: 'COLUMN', description: 'Column for color mapping (optional)' },
        { name: 'size_column', type: 'COLUMN', description: 'Column for size mapping (optional)' },
        { name: 'title', type: 'STRING', description: 'Plot title', default: '2D Scatter Plot' },
        { name: 'opacity', type: 'SLIDER', description: 'Marker opacity', default: 0.7 },
        { name: 'marker_size', type: 'SLIDER', description: 'Marker size', default: 5 },
      ]}
      example="Plot house prices vs square meters with regression line"
      features={['Regression analysis: Linear, Polynomial, Exponential', 'Color and size mapping', 'Interactive zoom and pan']}
    />

    <NodeDoc
      Icon={CircleDot}
      name="3D Scatter Plot"
      type="plot.3d"
      description="Create interactive 3D scatter plots with rotation and zoom capabilities"
      inputs={[{ name: 'table', type: 'TABLE', description: 'Data to plot' }]}
      outputs={[{ name: 'plot', type: 'PARAMS', description: 'Plot configuration' }]}
      params={[
        { name: 'x_column', type: 'COLUMN', description: 'Column for X axis', required: true },
        { name: 'y_column', type: 'COLUMN', description: 'Column for Y axis', required: true },
        { name: 'z_column', type: 'COLUMN', description: 'Column for Z axis', required: true },
        { name: 'color_column', type: 'COLUMN', description: 'Column for color mapping (optional)' },
        { name: 'title', type: 'STRING', description: 'Plot title', default: '3D Scatter Plot' },
      ]}
      example="Visualize Iris dataset in 3D space (sepal length, width, petal length)"
      features={['Interactive 3D rotation', 'Color by category', 'Zoom and pan']}
    />

    <NodeDoc
      Icon={BarChart3}
      name="Histogram"
      type="plot.histogram"
      description="Create histograms for data distribution analysis"
      inputs={[{ name: 'table', type: 'TABLE', description: 'Data to plot' }]}
      outputs={[{ name: 'plot', type: 'PARAMS', description: 'Plot configuration' }]}
      params={[
        { name: 'column', type: 'COLUMN', description: 'Column to plot', required: true },
        { name: 'bins', type: 'INTEGER', description: 'Number of bins', default: 30 },
        { name: 'title', type: 'STRING', description: 'Plot title', default: 'Histogram' },
        { name: 'color', type: 'COLOR', description: 'Bar color', default: '#3F51B5' },
      ]}
      example="Analyze age distribution in customer dataset"
    />
  </div>
  );
};

const MLSection: React.FC = () => {
  const { t } = useTranslation();
  
  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-2"><Brain className="w-8 h-8" /> {t('wiki.sections.ml')}</h2>
    
    <NodeDoc
      Icon={TrendingUp}
      name="Linear Regression"
      type="ml.regression"
      description="Train a linear regression model to predict continuous values"
      inputs={[{ name: 'table', type: 'TABLE', description: 'Training data' }]}
      outputs={[
        { name: 'model', type: 'MODEL', description: 'Trained model' },
        { name: 'metrics', type: 'PARAMS', description: 'Model metrics (R², MSE, MAE)' }
      ]}
      params={[
        { name: 'features', type: 'STRING', description: 'Comma-separated feature columns', required: true },
        { name: 'target', type: 'COLUMN', description: 'Target column to predict', required: true },
        { name: 'normalize', type: 'BOOLEAN', description: 'Normalize features', default: true },
      ]}
      example="Predict house prices based on size, bedrooms, and location"
      features={['Automatic feature scaling', 'R² score and error metrics', 'Coefficient analysis']}
    />

    <NodeDoc
      Icon={Target}
      name="Classification"
      type="ml.classification"
      description="Train classification models (Logistic Regression, Random Forest, SVM)"
      inputs={[{ name: 'table', type: 'TABLE', description: 'Training data' }]}
      outputs={[
        { name: 'model', type: 'MODEL', description: 'Trained classifier' },
        { name: 'metrics', type: 'PARAMS', description: 'Accuracy, precision, recall, F1' }
      ]}
      params={[
        { name: 'features', type: 'STRING', description: 'Feature columns', required: true },
        { name: 'target', type: 'COLUMN', description: 'Target class column', required: true },
        { name: 'algorithm', type: 'SELECT', description: 'Algorithm', options: ['logistic', 'random_forest', 'svm'], default: 'logistic' },
        { name: 'test_size', type: 'SLIDER', description: 'Test set size', default: 0.2 },
      ]}
      example="Classify iris species based on petal and sepal measurements"
      features={['Multiple algorithms', 'Confusion matrix', 'ROC curve']}
    />

    <NodeDoc
      Icon={Wand2}
      name="Predict"
      type="ml.predict"
      description="Make predictions using a trained model"
      inputs={[
        { name: 'model', type: 'MODEL', description: 'Trained model' },
        { name: 'table', type: 'TABLE', description: 'Data to predict on' }
      ]}
      outputs={[{ name: 'predictions', type: 'TABLE', description: 'Data with predictions' }]}
      params={[]}
      example="Apply trained model to new data for predictions"
    />

    <NodeDoc
      Icon={CircleDot}
      name="K-Means Clustering"
      type="ml.kmeans"
      description="Group data into clusters using K-Means algorithm"
      inputs={[{ name: 'table', type: 'TABLE', description: 'Data to cluster' }]}
      outputs={[
        { name: 'table', type: 'TABLE', description: 'Data with cluster labels' },
        { name: 'centroids', type: 'PARAMS', description: 'Cluster centroids' }
      ]}
      params={[
        { name: 'features', type: 'STRING', description: 'Feature columns for clustering', required: true },
        { name: 'n_clusters', type: 'INTEGER', description: 'Number of clusters', default: 3, min: 2, max: 10 },
        { name: 'max_iter', type: 'INTEGER', description: 'Maximum iterations', default: 300 },
      ]}
      example="Segment customers into groups based on behavior"
      features={['Elbow method support', 'Cluster visualization', 'Inertia metrics']}
    />
  </div>
  );
};

const NLPSection: React.FC = () => {
  const { t } = useTranslation();
  
  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-2"><FileText className="w-8 h-8" /> {t('wiki.sections.nlp')}</h2>
    
    <NodeDoc
      Icon={MessageSquare}
      name="Text Tokenizer"
      type="nlp.tokenize"
      description="Tokenize text into words or sentences"
      inputs={[{ name: 'table', type: 'TABLE', description: 'Data with text column' }]}
      outputs={[{ name: 'table', type: 'TABLE', description: 'Data with tokens' }]}
      params={[
        { name: 'text_column', type: 'COLUMN', description: 'Column containing text', required: true },
        { name: 'method', type: 'SELECT', description: 'Tokenization method', options: ['word', 'sentence'], default: 'word' },
        { name: 'lowercase', type: 'BOOLEAN', description: 'Convert to lowercase', default: true },
      ]}
      example="Tokenize customer reviews for analysis"
    />

    <NodeDoc
      Icon={Smile}
      name="Sentiment Analysis"
      type="nlp.sentiment"
      description="Analyze sentiment (positive/negative/neutral) of text"
      inputs={[{ name: 'table', type: 'TABLE', description: 'Data with text' }]}
      outputs={[{ name: 'table', type: 'TABLE', description: 'Data with sentiment scores' }]}
      params={[
        { name: 'text_column', type: 'COLUMN', description: 'Text column to analyze', required: true },
        { name: 'model', type: 'SELECT', description: 'Sentiment model', options: ['vader', 'textblob'], default: 'vader' },
      ]}
      example="Analyze sentiment of product reviews"
      features={['Positive/Negative/Neutral classification', 'Confidence scores', 'Compound sentiment score']}
    />

    <NodeDoc
      Icon={Tag}
      name="Named Entity Recognition"
      type="nlp.ner"
      description="Extract named entities (people, organizations, locations) from text"
      inputs={[{ name: 'table', type: 'TABLE', description: 'Data with text' }]}
      outputs={[{ name: 'table', type: 'TABLE', description: 'Data with entities' }]}
      params={[
        { name: 'text_column', type: 'COLUMN', description: 'Text column', required: true },
        { name: 'entity_types', type: 'STRING', description: 'Entity types to extract (comma-separated)', default: 'PERSON,ORG,LOC' },
      ]}
      example="Extract company names and locations from news articles"
    />

    <NodeDoc
      Icon={Library}
      name="Topic Modeling"
      type="nlp.topic_modeling"
      description="Discover topics in text collections using LDA"
      inputs={[{ name: 'table', type: 'TABLE', description: 'Text data' }]}
      outputs={[{ name: 'topics', type: 'PARAMS', description: 'Discovered topics' }]}
      params={[
        { name: 'text_column', type: 'COLUMN', description: 'Text column', required: true },
        { name: 'n_topics', type: 'INTEGER', description: 'Number of topics', default: 5, min: 2, max: 20 },
        { name: 'n_words', type: 'INTEGER', description: 'Words per topic', default: 10 },
      ]}
      example="Discover main themes in customer feedback"
    />
  </div>
  );
};

const TestingSection: React.FC = () => {
  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
        <Target className="w-8 h-8" /> Testing & Sentiment Analysis
      </h2>
      
      <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-r-lg">
        <h3 className="text-xl font-bold text-blue-900 mb-2">🎯 Testing Modelli con Input Personalizzati</h3>
        <p className="text-blue-800">
          Hai un modello trainato e vuoi testarlo con un singolo valore personalizzato? Usa <strong>Custom Table</strong>!
        </p>
      </div>

      <WorkflowExample
        title="Quick Test: Input Personalizzato"
        description="Testa un modello con un singolo valore custom in 3 step"
        steps={[
          { node: 'Custom Table', action: 'Click "Modifica Tabella"' },
          { node: 'Rinomina Colonne', action: 'Column1 → "review_text" (stesso nome del training!)' },
          { node: 'Aggiungi Dati', action: 'Inserisci: "Questo prodotto è fantastico!"' },
          { node: 'ML Predict', action: 'Collega Custom Table + Model trainato' },
          { node: 'Esegui', action: 'Vedi il risultato della predizione!' },
        ]}
        diagram="Custom Table → ML Predict (+ Model)"
        tips={[
          'I nomi delle colonne DEVONO essere identici al training',
          'Puoi testare una sola riga o un batch di righe',
          'Usa Numeric Input con label per creare colonne automaticamente'
        ]}
      />

      <WorkflowExample
        title="Sentiment Analysis Completo"
        description="Workflow completo per analisi del sentiment"
        steps={[
          { node: 'AI Generate Dataset', action: 'Template: nlp_sentiment_reviews, 200 rows' },
          { node: 'Train/Test Split', action: 'Split 80/20, stratify by sentiment' },
          { node: 'ML Classification', action: 'Algorithm: Logistic Regression, Features: review_text, Target: sentiment' },
          { node: 'ML Predict (Test)', action: 'Predici su test set automatico' },
          { node: 'Custom Table', action: 'Crea input personalizzati per test custom' },
          { node: 'ML Predict (Custom)', action: 'Testa con i tuoi input!' },
        ]}
        diagram="AI Dataset → Split → Classification → [Predict Test, Predict Custom]"
        tips={[
          'Usa AI Generate per creare dataset di training velocemente',
          'Il test set automatico valida il modello',
          'Custom Table per testare frasi specifiche'
        ]}
      />

      <div className="bg-green-50 border-l-4 border-green-500 p-6 rounded-r-lg space-y-4">
        <h3 className="text-xl font-bold text-green-900">💡 Tips per Testing Efficace</h3>
        
        <div className="space-y-3">
          <div>
            <h4 className="font-semibold text-green-800">1. Verifica Nomi Colonne</h4>
            <p className="text-green-700 text-sm">
              Training usa "review_text" → Test DEVE usare "review_text"<br/>
              ❌ "text" → ✅ "review_text"
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-green-800">2. Usa Numeric Input per Features Numeriche</h4>
            <p className="text-green-700 text-sm">
              Numeric Input con label "temperature" → Colonna si chiama automaticamente "temperature"!
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-green-800">3. Slice Rows per Test Rapidi</h4>
            <p className="text-green-700 text-sm">
              Custom Table → Slice Rows (Start: 0, End: 1) → ML Predict<br/>
              Testa solo la prima riga velocemente!
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-green-800">4. Salva Test Frequenti</h4>
            <p className="text-green-700 text-sm">
              Crea un CSV con i tuoi test standard e usa Load CSV invece di ricrearli ogni volta
            </p>
          </div>
        </div>
      </div>

      <WorkflowExample
        title="Testing con Features Multiple"
        description="Testa modelli con più features (testo + numeri)"
        steps={[
          { node: 'Numeric Input', action: 'Value: 150, Label: "review_length"' },
          { node: 'Custom Table', action: 'Collega Numeric Input a Input 1' },
          { node: 'Modifica Tabella', action: 'Aggiungi colonna "review_text" manualmente' },
          { node: 'Aggiungi Dati', action: 'Inserisci testo e altri valori' },
          { node: 'ML Predict', action: 'Predici con tutte le features!' },
        ]}
        diagram="Numeric Input → Custom Table (+ colonne manuali) → ML Predict"
        tips={[
          'Numeric Input con label crea automaticamente la colonna',
          'Aggiungi altre colonne manualmente nel Custom Table',
          'Perfetto per modelli con features miste (testo + numeri)'
        ]}
      />

      <div className="bg-yellow-50 border-l-4 border-yellow-500 p-6 rounded-r-lg">
        <h3 className="text-xl font-bold text-yellow-900 mb-3">⚠️ Errori Comuni</h3>
        
        <div className="space-y-2 text-yellow-800">
          <div>
            <strong>❌ "Column 'review_text' not found"</strong>
            <p className="text-sm">→ Nome colonna diverso tra training e test</p>
          </div>
          
          <div>
            <strong>❌ "Shape mismatch"</strong>
            <p className="text-sm">→ Numero di colonne diverso (training: 3 features, test: 2 features)</p>
          </div>
          
          <div>
            <strong>❌ "Invalid data type"</strong>
            <p className="text-sm">→ Tipo di dato sbagliato (es. testo invece di numero)</p>
          </div>
        </div>
      </div>

      <div className="bg-purple-50 border-l-4 border-purple-500 p-6 rounded-r-lg">
        <h3 className="text-xl font-bold text-purple-900 mb-3">📚 Risorse Aggiuntive</h3>
        <ul className="list-disc list-inside space-y-2 text-purple-800">
          <li><strong>SENTIMENT_ANALYSIS_GUIDE.md</strong> - Guida completa con esempi dettagliati</li>
          <li><strong>QUICK_TEST_CUSTOM_INPUT.md</strong> - Guida rapida per testing veloce</li>
          <li>Entrambe le guide sono nella root del progetto</li>
        </ul>
      </div>
    </div>
  );
};

const ExamplesSection: React.FC = () => {
  const { t } = useTranslation();
  
  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-2"><Search className="w-8 h-8" /> {t('wiki.examples.title')}</h2>
    
    <WorkflowExample
      title="1. Data Cleaning Pipeline"
      description="Clean and prepare raw data for analysis"
      steps={[
        { node: 'CSV Loader', action: 'Load raw data file' },
        { node: 'Clean Data', action: 'Remove missing values and duplicates' },
        { node: 'Filter Rows', action: 'Filter outliers (e.g., age > 0 and age < 120)' },
        { node: 'Select Columns', action: 'Keep only relevant columns' },
        { node: 'CSV Loader (output)', action: 'Save cleaned data' },
      ]}
      diagram="CSV → Clean → Filter → Select → Output"
    />

    <WorkflowExample
      title="2. Data Visualization"
      description="Explore and visualize your data"
      steps={[
        { node: 'AI Dataset Loader', action: 'Load Iris dataset' },
        { node: '2D Scatter Plot', action: 'Plot petal length vs width with species color' },
        { node: '3D Scatter Plot', action: 'Visualize all 3 dimensions' },
        { node: 'Histogram', action: 'Show distribution of petal lengths' },
      ]}
      diagram="Dataset → [2D Plot, 3D Plot, Histogram]"
      tips={['Enable regression on 2D plots to see trends', 'Use color mapping to distinguish categories', 'Rotate 3D plots by dragging']}
    />

    <WorkflowExample
      title="3. Regression Model"
      description="Train a model to predict continuous values"
      steps={[
        { node: 'CSV Loader', action: 'Load housing data' },
        { node: 'Select Columns', action: 'Select features: square_meters, bedrooms, age' },
        { node: 'Split Data', action: 'Split 80/20 train/test' },
        { node: 'Linear Regression', action: 'Train model on training set (target: price)' },
        { node: 'Predict', action: 'Make predictions on test set' },
        { node: '2D Scatter Plot', action: 'Plot actual vs predicted prices' },
      ]}
      diagram="CSV → Select → Split → [Train → Regression, Test] → Predict → Plot"
      tips={['Use Split Data to avoid overfitting', 'Check R² score to evaluate model quality', 'Visualize predictions vs actual values']}
    />

    <WorkflowExample
      title="4. Classification Model"
      description="Classify data into categories"
      steps={[
        { node: 'AI Dataset Loader', action: 'Load Iris dataset' },
        { node: 'Split Data', action: 'Split into train/test sets' },
        { node: 'Classification', action: 'Train Random Forest classifier (target: species)' },
        { node: 'Predict', action: 'Predict species on test set' },
        { node: '2D Scatter Plot', action: 'Visualize predictions with color by predicted class' },
      ]}
      diagram="Dataset → Split → [Train → Classify, Test] → Predict → Plot"
      tips={['Try different algorithms (Logistic, Random Forest, SVM)', 'Check confusion matrix for class-wise accuracy', 'Use 3D plot to see decision boundaries']}
    />

    <WorkflowExample
      title="5. NLP Sentiment Analysis"
      description="Analyze sentiment in text data"
      steps={[
        { node: 'CSV Loader', action: 'Load customer reviews' },
        { node: 'Text Tokenizer', action: 'Tokenize review text' },
        { node: 'Sentiment Analysis', action: 'Calculate sentiment scores' },
        { node: 'Filter Rows', action: 'Filter negative reviews (sentiment < 0)' },
        { node: 'Histogram', action: 'Plot sentiment distribution' },
      ]}
      diagram="CSV → Tokenize → Sentiment → Filter → Histogram"
      tips={['Use VADER for social media text', 'TextBlob works well for formal text', 'Compound score ranges from -1 (negative) to +1 (positive)']}
    />

    <WorkflowExample
      title="6. Clustering Analysis"
      description="Discover natural groups in your data"
      steps={[
        { node: 'CSV Loader', action: 'Load customer data' },
        { node: 'Select Columns', action: 'Select features for clustering' },
        { node: 'K-Means Clustering', action: 'Cluster into 3 groups' },
        { node: '2D Scatter Plot', action: 'Visualize clusters with color by cluster' },
        { node: '3D Scatter Plot', action: 'View clusters in 3D space' },
      ]}
      diagram="CSV → Select → K-Means → [2D Plot, 3D Plot]"
      tips={['Start with 3-5 clusters and adjust based on results', 'Use elbow method to find optimal K', 'Visualize in 2D/3D to validate clusters make sense']}
    />
  </div>
  );
};

interface NodeDocProps {
  Icon: React.ElementType;
  name: string;
  type: string;
  description: string;
  inputs: Array<{ name: string; type: string; description: string }>;
  outputs: Array<{ name: string; type: string; description: string }>;
  params: Array<{ name: string; type: string; description: string; required?: boolean; default?: any; options?: string[]; min?: number; max?: number }>;
  example: string;
  features?: string[];
}

const NodeDoc: React.FC<NodeDocProps> = ({ Icon, name, type, description, inputs, outputs, params, example, features }) => {
  const { t } = useTranslation();
  
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start gap-4">
        <Icon className="w-10 h-10 text-gray-700 flex-shrink-0" />
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-xl font-bold text-gray-800">{name}</h3>
            <code className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600">{type}</code>
          </div>
          <p className="text-gray-600 mb-4">{description}</p>

          {features && features.length > 0 && (
            <div className="mb-4 p-3 bg-blue-50 rounded-lg">
              <div className="text-sm font-semibold text-blue-900 mb-2">{t('wiki.common.features')}:</div>
            <ul className="text-sm text-blue-800 space-y-1">
              {features.map((feature, i) => (
                <li key={i}>{feature}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Inputs */}
        {inputs.length > 0 && (
          <div className="mb-3">
            <h4 className="text-sm font-semibold text-gray-700 mb-2">📥 {t('wiki.common.inputs')}:</h4>
            <div className="space-y-1">
              {inputs.map((input, i) => (
                <div key={i} className="text-sm text-gray-600 flex gap-2">
                  <span className="font-mono text-blue-600">{input.name}</span>
                  <span className="text-gray-400">({input.type})</span>
                  <span>- {input.description}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Outputs */}
        <div className="mb-3">
          <h4 className="text-sm font-semibold text-gray-700 mb-2">📤 {t('wiki.common.outputs')}:</h4>
          <div className="space-y-1">
            {outputs.map((output, i) => (
              <div key={i} className="text-sm text-gray-600 flex gap-2">
                <span className="font-mono text-green-600">{output.name}</span>
                <span className="text-gray-400">({output.type})</span>
                <span>- {output.description}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Parameters */}
        {params.length > 0 && (
          <div className="mb-3">
            <h4 className="text-sm font-semibold text-gray-700 mb-2">⚙️ {t('wiki.common.parameters')}:</h4>
            <div className="space-y-2">
              {params.map((param, i) => (
                <div key={i} className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                  <div className="flex gap-2 items-center">
                    <span className="font-mono text-purple-600">{param.name}</span>
                    {param.required && <span className="text-red-500 text-xs">*{t('wiki.common.required')}</span>}
                    <span className="text-gray-400">({param.type})</span>
                    {param.default !== undefined && (
                      <span className="text-xs text-gray-500">{t('wiki.common.default')}: {JSON.stringify(param.default)}</span>
                    )}
                  </div>
                  <div className="mt-1">{param.description}</div>
                  {param.options && (
                    <div className="mt-1 text-xs text-gray-500">
                      {t('wiki.common.options')}: {param.options.join(', ')}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Example */}
        <div className="mt-4 p-3 bg-green-50 border-l-4 border-green-500 rounded">
          <div className="text-sm font-semibold text-green-900 mb-1">💡 {t('wiki.common.example')}:</div>
          <div className="text-sm text-green-800">{example}</div>
        </div>
      </div>
    </div>
  </div>
  );
};

interface WorkflowExampleProps {
  title: string;
  description: string;
  steps: Array<{ node: string; action: string }>;
  diagram: string;
  tips?: string[];
}

const WorkflowExample: React.FC<WorkflowExampleProps> = ({ title, description, steps, diagram, tips }) => {
  const { t } = useTranslation();
  
  return (
    <div className="bg-white border-2 border-blue-200 rounded-xl p-6 shadow-sm">
      <h3 className="text-2xl font-bold text-gray-800 mb-2">{title}</h3>
      <p className="text-gray-600 mb-4">{description}</p>

      <div className="mb-4 p-4 bg-gray-50 rounded-lg font-mono text-sm text-center text-gray-700">
        {diagram}
      </div>

      <div className="mb-4">
        <h4 className="font-semibold text-gray-700 mb-2">📋 {t('wiki.examples.steps')}:</h4>
      <ol className="space-y-2">
        {steps.map((step, i) => (
          <li key={i} className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
              {i + 1}
            </span>
            <div>
              <span className="font-semibold text-gray-800">{step.node}</span>
              <span className="text-gray-600"> - {step.action}</span>
            </div>
          </li>
        ))}
      </ol>
    </div>

    {tips && tips.length > 0 && (
      <div className="p-3 bg-yellow-50 border-l-4 border-yellow-400 rounded">
        <div className="text-sm font-semibold text-yellow-900 mb-2">💡 {t('wiki.examples.tips')}:</div>
        <ul className="space-y-1">
          {tips.map((tip, i) => (
            <li key={i} className="text-sm text-yellow-800">• {tip}</li>
          ))}
        </ul>
      </div>
    )}
  </div>
  );
};

export default WikiPage;
