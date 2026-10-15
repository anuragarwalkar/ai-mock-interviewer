import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Key, 
  FileText, 
  Briefcase, 
  User, 
  CheckCircle2, 
  AlertCircle, 
  Play, 
  Eye, 
  EyeOff, 
  Bot 
} from 'lucide-react';
import type { 
  InterviewConfig, 
  InterviewTrack, 
  SeniorityLevel, 
  InterviewFormat 
} from '../../types/interview';
import { 
  INTERVIEWER_PERSONAS, 
  TRACK_OPTIONS, 
  SENIORITY_OPTIONS 
} from '../../data/personas';
import { geminiService } from '../../services/gemini';

interface SetupWizardProps {
  onStartInterview: (config: InterviewConfig) => void;
}

const SAMPLE_RESUMES: Record<string, string> = {
  'iOS & Swift': `Senior iOS Engineer with 6+ years of production experience.
Key Skills: Swift 6, SwiftUI, UIKit, Swift Concurrency (Actors, Async/Await), Combine, Core Data, SQLite, Instruments, CI/CD with Fastlane.
Recent Experience:
- Re-architected core messaging feed for 2M DAU iOS app using Swift Concurrency, eliminating main-thread hitches and dropping memory footprint by 35%.
- Built custom SwiftUI design system with fluid gesture physics and dynamic type accessibility.
- Migrated legacy Objective-C networking layer to Swift async/await with resilient retry policies and offline SQLite sync.`,
  'Frontend & Web': `Staff Frontend Architect with 7+ years in modern web development.
Key Skills: React 19, Next.js, TypeScript, Web Vitals, TailwindCSS, State Management (Zustand, React Query), WebSockets, WebGL.
Recent Experience:
- Led frontend platform migration to Next.js App Router, boosting Lighthouse performance score from 62 to 98 and reducing Time to Interactive by 40%.
- Architected enterprise real-time collaborative canvas with zero-latency optimistic updates and offline-first IndexedDB caching.`,
  'Backend & Distributed Systems': `Senior Distributed Systems Engineer with 5+ years building high-scale services.
Key Skills: Go, Python, Kafka, gRPC, PostgreSQL, Redis, Kubernetes, Docker, AWS (ECS, S3, DynamoDB).
Recent Experience:
- Architected distributed ledger service handling 45,000 requests/sec with 99.99% availability using Kafka event sourcing and distributed locks.
- Solved high-volume cache thundering herd problem using Redis probabilistic early expiration and single-flight request coalescing.`,
  'Behavioral & Leadership': `Engineering Manager / Tech Lead with 8+ years leading cross-functional engineering teams.
Recent Experience:
- Led a team of 11 engineers through an aggressive replatforming roadmap while maintaining 99.95% SLOs.
- Navigated severe cross-functional conflict with product leadership regarding tech debt vs feature delivery by quantifying developer velocity impact.`
};

export const SetupWizard: React.FC<SetupWizardProps> = ({ onStartInterview }) => {
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('gemini_api_key') || '');
  const [model, setModel] = useState('gemini-2.0-flash');
  const [candidateName, setCandidateName] = useState(() => localStorage.getItem('candidate_name') || 'Alex');
  const [track, setTrack] = useState<InterviewTrack>('iOS & Swift');
  const [seniority, setSeniority] = useState<SeniorityLevel>('Senior');
  const [format, setFormat] = useState<InterviewFormat>('Standard (5-6 questions)');
  const [selectedInterviewerId, setSelectedInterviewerId] = useState('marcus-chen');
  const [resumeText, setResumeText] = useState(SAMPLE_RESUMES['iOS & Swift']);
  const [jobDescription, setJobDescription] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [isTestingKey, setIsTestingKey] = useState(false);
  const [keyStatus, setKeyStatus] = useState<{ success: boolean; message: string } | null>(null);

  // Auto-switch persona to match track
  useEffect(() => {
    if (track === 'iOS & Swift') setSelectedInterviewerId('marcus-chen');
    else if (track === 'Frontend & Web') setSelectedInterviewerId('aria-thorne');
    else if (track === 'Backend & Distributed Systems' || track === 'System Design') setSelectedInterviewerId('elena-vance');
    else if (track === 'Behavioral & Leadership') setSelectedInterviewerId('david-sterling');
  }, [track]);

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
      track,
      seniority,
      format,
      interviewerId: selectedInterviewerId,
      resumeText: resumeText.trim(),
      jobDescription: jobDescription.trim(),
      focusAreas: [],
      isDemoMode: isDemo || !finalApiKey
    });
  };

  const loadSampleResume = (selectedTrack: string) => {
    if (SAMPLE_RESUMES[selectedTrack]) {
      setResumeText(SAMPLE_RESUMES[selectedTrack]);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-8">
      {/* Hero Title */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold mb-3 tracking-wide">
          <Sparkles className="w-3.5 h-3.5 text-blue-400" />
          <span>POWERED BY LANGCHAIN & GEMINI API</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          AI Video & Voice Mock Interviewer
        </h1>
        <p className="mt-2 text-slate-400 text-sm sm:text-base max-w-2xl mx-auto">
          Practice high-stakes technical & behavioral interviews with live talking AI avatars, real-time voice speech, and questions tailored to your exact resume.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 cols): Interview Configuration */}
        <div className="lg:col-span-2 space-y-6">
          {/* Step 1: Candidate Info & Specialty */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-5">
            <div className="flex items-center gap-2.5 pb-2 border-b border-slate-800">
              <Briefcase className="w-5 h-5 text-blue-400" />
              <h2 className="text-white font-semibold text-base">1. Role & Specialty Track</h2>
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
                    placeholder="e.g. Alex Hunter"
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

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">
                  Interview Format
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

            {/* Target Specialty Track */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-2">
                Specialty Track
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {TRACK_OPTIONS.map((item) => {
                  const isSelected = track === item;
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => {
                        setTrack(item);
                        loadSampleResume(item);
                      }}
                      className={`p-3 rounded-xl border text-xs font-medium text-left transition-all ${
                        isSelected
                          ? 'bg-blue-600/20 border-blue-500 text-blue-300 shadow-sm'
                          : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-300'
                      }`}
                    >
                      <div className="font-semibold">{item}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Step 2: Resume & Experience Tailoring */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <FileText className="w-5 h-5 text-emerald-400" />
                <h2 className="text-white font-semibold text-base">2. Resume & Experience Tailoring</h2>
              </div>
              <button
                type="button"
                onClick={() => loadSampleResume(track)}
                className="text-xs text-blue-400 hover:text-blue-300 underline font-medium"
              >
                Insert Sample {track} Resume
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Paste your resume or project highlights. Gemini will formulate incisive questions probing your actual stack and architectural decisions.
            </p>

            <textarea
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
              placeholder="Paste your resume, LinkedIn summary, or key projects here..."
              rows={6}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs sm:text-sm text-slate-200 focus:outline-none focus:border-emerald-500 transition-colors leading-relaxed"
            />

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">
                Target Job Description (Optional)
              </label>
              <input
                type="text"
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="e.g. Senior iOS Engineer at Apple, high scale SwiftUI & Concurrency focus"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>
          </div>

          {/* Step 3: Interviewer Persona */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center gap-2.5 pb-2 border-b border-slate-800">
              <Bot className="w-5 h-5 text-indigo-400" />
              <h2 className="text-white font-semibold text-base">3. Choose Your AI Interviewer</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {INTERVIEWER_PERSONAS.map((persona) => {
                const isSelected = selectedInterviewerId === persona.id;
                return (
                  <div
                    key={persona.id}
                    onClick={() => setSelectedInterviewerId(persona.id)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-blue-600/15 border-blue-500 shadow-md shadow-blue-500/10'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="font-semibold text-sm text-white flex items-center gap-2">
                        <span>{persona.name}</span>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-blue-400" />}
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                        {persona.companyVibe}
                      </span>
                    </div>
                    <div className="text-xs text-blue-400 font-medium mb-1">{persona.title}</div>
                    <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                      {persona.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column (1 col): API Key & Launch Summary */}
        <div className="space-y-6">
          {/* Gemini API Key Box */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center gap-2.5 pb-2 border-b border-slate-800">
              <Key className="w-5 h-5 text-amber-400" />
              <h2 className="text-white font-semibold text-base">Gemini API Key</h2>
            </div>

            <p className="text-xs text-slate-400">
              Enter your Google AI Studio Gemini API key. It connects via LangChain and is stored locally in your browser.
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
                  Gemini Model (via LangChain)
                </label>
                <select
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="gemini-2.0-flash">gemini-2.0-flash (Fast & Recommended)</option>
                  <option value="gemini-2.5-flash">gemini-2.5-flash (Latest)</option>
                  <option value="gemini-1.5-pro">gemini-1.5-pro (Deep Reasoning)</option>
                  <option value="gemini-1.5-flash">gemini-1.5-flash (Standard)</option>
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
                <span>{isTestingKey ? 'Verifying with LangChain...' : 'Test API Key'}</span>
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
              Don't have an API key? You can get a free key at{' '}
              <a 
                href="https://aistudio.google.com/app/apikey" 
                target="_blank" 
                rel="noreferrer"
                className="text-blue-400 underline"
              >
                Google AI Studio
              </a>{' '}
              or run in Demo Mode below.
            </div>
          </div>

          {/* Launch Action Card */}
          <div className="p-6 rounded-2xl bg-gradient-to-b from-blue-950/40 via-slate-900 to-slate-900 border border-blue-500/30 shadow-2xl space-y-4">
            <h3 className="text-white font-semibold text-base flex items-center gap-2">
              <Play className="w-4 h-4 text-blue-400" />
              <span>Ready to Interview?</span>
            </h3>

            <div className="space-y-2 text-xs text-slate-300">
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Track:</span>
                <span className="font-medium text-white">{track}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Seniority:</span>
                <span className="font-medium text-white">{seniority}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Interviewer:</span>
                <span className="font-medium text-white">
                  {INTERVIEWER_PERSONAS.find(p => p.id === selectedInterviewerId)?.name}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Voice & Avatar:</span>
                <span className="font-medium text-emerald-400">Real-time Local WebGL/2D</span>
              </div>
            </div>

            {/* Start Live Session Button */}
            <button
              type="button"
              onClick={() => handleStart(false)}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm shadow-xl shadow-blue-600/30 flex items-center justify-center gap-2 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Start Live Voice & Video Interview</span>
            </button>

            {/* Instant Demo Mode Button */}
            <button
              type="button"
              onClick={() => handleStart(true)}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-xs font-semibold text-slate-300 flex items-center justify-center gap-2 transition-all"
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
