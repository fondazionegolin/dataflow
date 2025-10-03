import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { LandingPage } from './pages/LandingPage';
import { WorkflowEditorWithProvider } from './pages/WorkflowEditor';
import WikiPage from './pages/WikiPage';
import './i18n';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/workflow/:sessionId" element={<WorkflowEditorWithProvider />} />
        <Route path="/wiki" element={<WikiPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
