import React, { useState } from 'react';
import { 
  Sparkles, 
  Key, 
  FileText, 
  User, 
  CheckCircle2, 
  AlertCircle, 
  Play, 
  Eye, 
  EyeOff, 
  Video,
  ShieldCheck
} from 'lucide-react';
import type { 
  InterviewConfig, 
  SeniorityLevel, 
  InterviewFormat,
  QuestionStyle 
} from '../../types/interview';
import { 
  INTERVIEWER_PERSONAS, 
  SENIORITY_OPTIONS 
} from '../../data/personas';
import { geminiService } from '../../services/gemini';

interface SetupWizardProps {
  onStartInterview: (config: InterviewConfig) => void;
}

export const SetupWizard: React.FC<SetupWizardProps> = ({ onStartInterview }) => {
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('gemini_api_key') || '');
  const [model, setModel] = useState('gemini-3.8-flash');
  const [candidateName, setCandidateName] = useState(() => localStorage.getItem('candidate_name') || '');
  const [seniority, setSeniority] = useState<SeniorityLevel>('Senior');
  const [questionStyle, setQuestionStyle] = useState<QuestionStyle>('direct-technical');
  const [format, setFormat] = useState<InterviewFormat>('Standard (5-6 questions)');
  const [resumeText, setResumeText] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [isTestingKey, setIsTestingKey] = useState(false);
  const [keyStatus, setKeyStatus] = useState<{ success: boolean; message: string } | null>(null);

  // Single male interviewer
  const interviewer = INTERVIEWER_PERSONAS[0];

  const handleTestApiKey = async () => {
    if (!apiKey.trim()) {
      setKeyStatus({ success: false, message: 'Please enter a Gemini API Key first.' });
      return;
    }
    setIsTestingKey(true);
    setKeyStatus(null);
    const result = await geminiService.testApiKey(apiKey, model);
    setIsTestingKey(false);
    setKeyStatus(result);
    if (result.success) {
      localStorage.setItem('gemini_api_key', apiKey.trim());
    }
  };

  const handleStart = (isDemo = false) => {
    const finalApiKey = apiKey.trim();
    if (!isDemo && finalApiKey) {
      localStorage.setItem('gemini_api_key', finalApiKey);
    }
    if (candidateName.trim()) {
      localStorage.setItem('candidate_name', candidateName.trim());
    }

    onStartInterview({
      apiKey: finalApiKey,
      model,
      candidateName: candidateName.trim() || 'Candidate',
      track: 'General Software Engineering',
      seniority,
      format,
      questionStyle,
      interviewerId: interviewer.id,
      resumeText: resumeText.trim(),
      jobDescription: jobDescription.trim(),
      focusAreas: [],
      isDemoMode: isDemo || !finalApiKey
    });
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-8">
      {/* Hero Title */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold mb-3 tracking-wide">
          <Sparkles className="w-3.5 h-3.5 text-blue-400" />
          <span>POWERED BY GOOGLE GEMINI API</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          AI Video & Voice Mock Interviewer
        </h1>
        <p className="mt-2 text-slate-400 text-sm sm:text-base max-w-2xl mx-auto">
          Practice technical & behavioral interviews with a live 3D video AI interviewer, real-time voice speech, and questions tailored to your resume.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 cols): Candidate Profile & Resume */}
        <div className="lg:col-span-2 space-y-6">
          {/* Step 1: Candidate Details */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-5">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <User className="w-5 h-5 text-blue-400" />
                <h2 className="text-white font-semibold text-base">1. Candidate Details</h2>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <Video className="w-3.5 h-3.5 text-emerald-400" />
                <span>Interviewer: <strong className="text-white">{interviewer.name}</strong></span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">
                  Your Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    value={candidateName}
                    onChange={(e) => setCandidateName(e.target.value)}
                    placeholder="Enter your name..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">
                  Seniority Level
                </label>
                <select
                  value={seniority}
                  onChange={(e) => setSeniority(e.target.value as SeniorityLevel)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                >
                  {SENIORITY_OPTIONS.map((lvl) => (
                    <option key={lvl} value={lvl}>{lvl}</option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-400 mb-1.5 flex items-center justify-between">
                  <span>Question Style</span>
                  {questionStyle === 'direct-technical' && (
                    <span className="text-[11px] text-emerald-400 font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                      Normal Questions (No Scenarios)
                    </span>
                  )}
                  {questionStyle === 'scenario-based' && (
                    <span className="text-[11px] text-blue-400 font-semibold px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20">
                      Hypothetical Scenarios & Architecture
                    </span>
                  )}
                  {questionStyle === 'behavioral' && (
                    <span className="text-[11px] text-purple-400 font-semibold px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20">
                      Behavioral & Leadership
                    </span>
                  )}
                  {questionStyle === 'mixed' && (
                    <span className="text-[11px] text-amber-400 font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20">
                      Balanced Mix
                    </span>
                  )}
                </label>
                <select
                  value={questionStyle}
                  onChange={(e) => setQuestionStyle(e.target.value as QuestionStyle)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                >
                  <option value="direct-technical">
                    Real-World Technical Q&A (Practical questions asked by people — useEffect, hooks, closures, state, APIs)
                  </option>
                  <option value="scenario-based">
                    Scenario-Based & Architecture (Real-world system scenarios, scale bottlenecks, edge-case failure modes)
                  </option>
                  <option value="behavioral">
                    Behavioral & Leadership (Past experience, teamwork, conflicts, STAR format)
                  </option>
                  <option value="mixed">
                    Mixed (Balanced blend of practical questions & engineering scenarios)
                  </option>
                </select>
                <p className="mt-1.5 text-[11px] text-slate-400">
                  {questionStyle === 'direct-technical' 
                    ? '✓ Marcus asks the practical, high-yield questions human interviewers actually ask (e.g. in React: useEffect lifecycle & cleanups, useMemo vs useCallback, stale closures, state batching, API race conditions). No obscure compiler/engine internals.'
                    : questionStyle === 'scenario-based'
                    ? 'Interviewer poses hypothetical architecture scenarios, scaling dilemmas, and edge-case failure modes.'
                    : questionStyle === 'behavioral'
                    ? 'Interviewer asks behavioral questions using the STAR framework about teamwork, conflict, and past impact.'
                    : 'Interviewer alternates between practical conceptual questions and engineering scenarios.'}
                </p>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-400 mb-1.5">
                  Interview Length
                </label>
                <select
                  value={format}
                  onChange={(e) => setFormat(e.target.value as InterviewFormat)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                >
                  <option value="Quick Screening (3 questions)">Quick Screening (3 questions)</option>
                  <option value="Standard (5-6 questions)">Standard (5-6 questions)</option>
                  <option value="Deep Dive (8 questions)">Deep Dive (8 questions)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Step 2: Resume & Experience */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <FileText className="w-5 h-5 text-emerald-400" />
                <h2 className="text-white font-semibold text-base">2. Resume & Target Role</h2>
              </div>
            </div>

            <p className="text-xs text-slate-400">
              Paste your resume, skills, or key project highlights. Gemini and {interviewer.name} will formulate questions probing your actual stack and architectural decisions.
            </p>

            <textarea
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
              placeholder="Paste your resume, LinkedIn summary, or key projects here (optional)..."
              rows={7}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs sm:text-sm text-slate-200 focus:outline-none focus:border-emerald-500 transition-colors leading-relaxed"
            />

            <div className="space-y-2">
              <label className="block text-xs font-medium text-slate-400">
                Target Role or Topic Focus (Optional)
              </label>
              <input
                type="text"
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="e.g. React & Frontend, useEffect, Hooks, State Management, Modern JS..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
              />
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[11px] text-slate-500">Quick Presets:</span>
                {[
                  'React & Frontend (useEffect, Hooks, State)',
                  'JavaScript Core (Closures, Async, Event Loop)',
                  'Full-Stack (React, Node.js, APIs)',
                  'Backend & Databases (Node, SQL, Caching)'
                ].map(preset => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setJobDescription(preset)}
                    className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                      jobDescription === preset
                        ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300 font-medium'
                        : 'bg-slate-800/60 hover:bg-slate-800 border-slate-700/80 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (1 col): API Key & Single Prominent Start Button */}
        <div className="space-y-6">
          {/* Gemini API Key Box */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center gap-2.5 pb-2 border-b border-slate-800">
              <Key className="w-5 h-5 text-amber-400" />
              <h2 className="text-white font-semibold text-base">Gemini API Key</h2>
            </div>

            <p className="text-xs text-slate-400">
              Enter your Google AI Studio Gemini API key. Stored locally in your browser.
            </p>

            <div className="space-y-3">
              <div className="relative">
                <input
                  type={showApiKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => {
                    setApiKey(e.target.value);
                    setKeyStatus(null);
                  }}
                  placeholder="AIzaSy..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 pr-10 text-xs font-mono text-white focus:outline-none focus:border-amber-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300"
                >
                  {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Model Selector */}
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  Gemini Model
                </label>
                <select
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="gemini-3.8-flash">gemini-3.8-flash (Recommended & Latest)</option>
                  <option value="gemini-2.5-flash">gemini-2.5-flash</option>
                  <option value="gemini-1.5-pro">gemini-1.5-pro</option>
                </select>
              </div>

              {/* Test Key Button */}
              <button
                type="button"
                onClick={handleTestApiKey}
                disabled={isTestingKey || !apiKey.trim()}
                className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                {isTestingKey ? (
                  <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                ) : (
                  <Key className="w-3.5 h-3.5 text-amber-400" />
                )}
                <span>{isTestingKey ? 'Verifying...' : 'Test API Key'}</span>
              </button>

              {/* Status Message */}
              {keyStatus && (
                <div
                  className={`p-2.5 rounded-xl text-xs flex items-center gap-2 ${
                    keyStatus.success
                      ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300'
                      : 'bg-rose-500/15 border border-rose-500/30 text-rose-300'
                  }`}
                >
                  {keyStatus.success ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  )}
                  <span>{keyStatus.message}</span>
                </div>
              )}
            </div>

            <div className="text-[11px] text-slate-500 pt-2 border-t border-slate-800/80">
              Don't have an API key? Get one free at{' '}
              <a 
                href="https://aistudio.google.com/app/apikey" 
                target="_blank" 
                rel="noreferrer"
                className="text-blue-400 underline"
              >
                Google AI Studio
              </a>{' '}
              or test in Demo Mode.
            </div>
          </div>

          {/* Launch Action Card with Prominent Start Interview Button */}
          <div className="p-6 rounded-2xl bg-gradient-to-b from-blue-950/40 via-slate-900 to-slate-900 border border-blue-500/30 shadow-2xl space-y-4">
            <h3 className="text-white font-semibold text-base flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Interview Session</span>
            </h3>

            <div className="space-y-2 text-xs text-slate-300">
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Interviewer:</span>
                <span className="font-medium text-white">{interviewer.name} (Male Lead)</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Question Style:</span>
                <span className={`font-semibold ${questionStyle === 'direct-technical' ? 'text-emerald-400' : 'text-blue-400'}`}>
                  {questionStyle === 'direct-technical' ? 'Normal Direct Q&A' :
                   questionStyle === 'scenario-based' ? 'Scenario-Based' :
                   questionStyle === 'behavioral' ? 'Behavioral (STAR)' : 'Mixed'}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Length:</span>
                <span className="font-medium text-white">{format}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Seniority:</span>
                <span className="font-medium text-white">{seniority}</span>
              </div>
            </div>

            {/* PROMINENT START INTERVIEW BUTTON */}
            <button
              type="button"
              onClick={() => handleStart(false)}
              className="w-full py-4 px-4 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-base shadow-xl shadow-blue-600/30 flex items-center justify-center gap-2.5 transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
            >
              <Play className="w-5 h-5 fill-white" />
              <span>Start Interview</span>
            </button>

            {/* Instant Demo Mode Button */}
            <button
              type="button"
              onClick={() => handleStart(true)}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-xs font-semibold text-slate-300 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Try Interactive Demo Mode (No Key Needed)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
