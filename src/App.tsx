import React, { useState, useEffect } from 'react';
import type { 
  InterviewConfig, 
  EvaluationReport, 
  InterviewState 
} from './types/interview';
import { Header } from './components/Common/Header';
import { ApiKeyModal } from './components/Common/ApiKeyModal';
import { SetupWizard } from './components/Setup/SetupWizard';
import { InterviewRoom } from './components/Interview/InterviewRoom';
import { EvaluationReportView } from './components/Evaluation/EvaluationReportView';

export const App: React.FC = () => {
  const [viewState, setViewState] = useState<InterviewState>('setup');
  const [config, setConfig] = useState<InterviewConfig | null>(null);
  const [report, setReport] = useState<EvaluationReport | null>(null);
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(() => !!localStorage.getItem('gemini_api_key'));
  
  // Theme state: dark or light
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('interview_theme');
    if (saved === 'light' || saved === 'dark') return saved;
    return 'dark'; // default to dark
  });

  useEffect(() => {
    localStorage.setItem('interview_theme', theme);
    if (theme === 'light') {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const handleStartInterview = (newConfig: InterviewConfig) => {
    setConfig(newConfig);
    setViewState('interviewing');
  };

  const handleFinishInterview = (evalReport: EvaluationReport) => {
    setReport(evalReport);
    setViewState('completed');
  };

  const handleRestart = () => {
    setViewState('setup');
    setReport(null);
  };

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-200 ${
      theme === 'light' ? 'bg-slate-100 text-slate-800' : 'bg-slate-950 text-slate-100'
    }`}>
      {/* Show header in Setup and Completed view */}
      {viewState !== 'interviewing' && (
        <Header 
          onOpenApiKeyModal={() => setIsApiKeyModalOpen(true)}
          hasApiKey={hasApiKey}
          theme={theme}
          onToggleTheme={toggleTheme}
        />
      )}

      <main className="flex-1 flex flex-col">
        {viewState === 'setup' && (
          <SetupWizard onStartInterview={handleStartInterview} />
        )}

        {viewState === 'interviewing' && config && (
          <InterviewRoom
            config={config}
            onFinishInterview={handleFinishInterview}
            onCancel={handleRestart}
            theme={theme}
            onToggleTheme={toggleTheme}
          />
        )}

        {viewState === 'completed' && report && config && (
          <EvaluationReportView
            report={report}
            config={config}
            onRestart={handleRestart}
          />
        )}
      </main>

      {/* Global API Key modal */}
      <ApiKeyModal
        isOpen={isApiKeyModalOpen}
        onClose={() => setIsApiKeyModalOpen(false)}
        onKeySaved={(_key) => setHasApiKey(!!_key)}
      />
    </div>
  );
};

export default App;
