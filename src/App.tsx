import React, { useState } from 'react';
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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Show header in Setup and Completed view */}
      {viewState !== 'interviewing' && (
        <Header 
          onOpenApiKeyModal={() => setIsApiKeyModalOpen(true)}
          hasApiKey={hasApiKey}
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
