import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { 
  Trophy, 
  Award, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight, 
  RotateCcw, 
  Download, 
  Sparkles, 
  BookOpen, 
  FileCheck, 
  Target 
} from 'lucide-react';
import type { EvaluationReport, InterviewConfig } from '../../types/interview';

interface EvaluationReportViewProps {
  report: EvaluationReport;
  config: InterviewConfig;
  onRestart: () => void;
}

export const EvaluationReportView: React.FC<EvaluationReportViewProps> = ({
  report,
  config,
  onRestart
}) => {
  useEffect(() => {
    if (report.overallScore >= 75) {
      try {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch (e) {
        // Ignore if confetti not supported
      }
    }
  }, [report.overallScore]);

  const getRecommendationBadge = (rec: string) => {
    switch (rec) {
      case 'Strong Hire':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      case 'Hire':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
      case 'Leaning Hire':
        return 'bg-teal-500/20 text-teal-300 border-teal-500/40';
      case 'Leaning No Hire':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      default:
        return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
    }
  };

  const downloadReportJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(report, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `Interview_Report_${config.candidateName}_${config.track.replace(/\s+/g, '_')}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* Header Banner */}
      <div className="p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-blue-950/40 to-slate-900 border border-slate-800 shadow-2xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-semibold mb-2">
              <Award className="w-3.5 h-3.5" />
              <span>INTERVIEW EVALUATION REPORT</span>
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">
              {config.candidateName || 'Candidate'}'s Performance Scorecard
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Role: <span className="text-slate-200 font-medium">{config.seniority} {config.track}</span>
            </p>
          </div>

          {/* Overall Score Circle & Recommendation */}
          <div className="flex flex-col items-center">
            <div className="relative w-28 h-28 rounded-full bg-slate-950 border-4 border-blue-500/40 flex flex-col items-center justify-center shadow-xl shadow-blue-500/10">
              <span className="text-4xl font-extrabold text-white tracking-tight">
                {report.overallScore}
              </span>
              <span className="text-[11px] text-slate-400 font-semibold tracking-wider">/ 100</span>
            </div>
            <div className={`mt-3 px-4 py-1 rounded-full border text-xs font-bold tracking-wide uppercase ${getRecommendationBadge(report.recommendation)}`}>
              {report.recommendation}
            </div>
          </div>
        </div>
      </div>

      {/* Executive Summary */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-2">
        <h2 className="text-white font-semibold text-base flex items-center gap-2">
          <FileCheck className="w-4 h-4 text-blue-400" />
          <span>Executive Summary</span>
        </h2>
        <p className="text-sm leading-relaxed text-slate-300">
          {report.summary}
        </p>
      </div>

      {/* Competency Breakdown Bars */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <h2 className="text-white font-semibold text-base flex items-center gap-2">
          <Target className="w-4 h-4 text-cyan-400" />
          <span>Competency Breakdown</span>
        </h2>

        <div className="space-y-3">
          {[
            { label: 'Technical Accuracy & Depth', value: report.scoreBreakdown.technicalAccuracy, color: 'bg-blue-500' },
            { label: 'Problem Solving & Architecture', value: report.scoreBreakdown.problemSolving, color: 'bg-emerald-500' },
            { label: 'Communication & Articulation', value: report.scoreBreakdown.communication, color: 'bg-indigo-500' },
            { label: 'System Depth & Edge Cases', value: report.scoreBreakdown.architectureAndDepth, color: 'bg-purple-500' },
            { label: 'Practical Experience Application', value: report.scoreBreakdown.practicalExperience, color: 'bg-amber-500' }
          ].map((item, idx) => (
            <div key={idx} className="space-y-1">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-slate-300">{item.label}</span>
                <span className="text-white font-semibold">{item.value}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-1000 ${item.color}`}
                  style={{ width: `${item.value}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Strengths & Improvement Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Strengths */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-3">
          <h3 className="text-emerald-400 font-semibold text-sm flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>Key Strengths</span>
          </h3>
          <ul className="space-y-2 text-xs text-slate-300">
            {report.strengths.map((str, i) => (
              <li key={i} className="flex items-start gap-2 leading-relaxed">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                <span>{str}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Growth Areas */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-3">
          <h3 className="text-amber-400 font-semibold text-sm flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            <span>Areas for Improvement</span>
          </h3>
          <ul className="space-y-2 text-xs text-slate-300">
            {report.areasForImprovement.map((area, i) => (
              <li key={i} className="flex items-start gap-2 leading-relaxed">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                <span>{area}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Question-by-Question Deep Dive */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-5">
        <h2 className="text-white font-semibold text-base flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-blue-400" />
          <span>Question-by-Question Evaluation & Ideal Answers</span>
        </h2>

        <div className="space-y-4">
          {report.questionEvaluations.map((q, idx) => (
            <div key={idx} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                <span className="text-xs font-bold text-blue-400 uppercase tracking-wide">
                  Question {q.questionNumber || idx + 1}
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/20">
                  Score: {q.score}/100
                </span>
              </div>

              <div>
                <div className="text-xs font-semibold text-slate-400 mb-0.5">Interviewer Question:</div>
                <p className="text-xs sm:text-sm text-slate-200 font-medium leading-relaxed">
                  {q.questionText}
                </p>
              </div>

              {q.candidateAnswer && (
                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                  <div className="text-[11px] font-semibold text-slate-400 mb-0.5">Your Response:</div>
                  <p className="text-xs text-slate-300 italic leading-relaxed">
                    "{q.candidateAnswer}"
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-200">
                  <span className="font-semibold block mb-0.5 text-emerald-400">Positive Feedback:</span>
                  {q.positiveFeedback}
                </div>
                <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-200">
                  <span className="font-semibold block mb-0.5 text-amber-400">Constructive Critique:</span>
                  {q.constructiveFeedback}
                </div>
              </div>

              {/* Sample Ideal Answer */}
              {q.sampleIdealAnswer && (
                <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <div className="text-[11px] font-semibold text-blue-400 flex items-center gap-1.5 mb-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Gemini AI Model Answer:</span>
                  </div>
                  <p className="text-xs text-blue-100 leading-relaxed">
                    {q.sampleIdealAnswer}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Actionable Next Steps */}
      {report.actionableNextSteps && report.actionableNextSteps.length > 0 && (
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-3">
          <h3 className="text-white font-semibold text-sm flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span>Recommended Next Steps & Study Plan</span>
          </h3>
          <ul className="space-y-2 text-xs text-slate-300">
            {report.actionableNextSteps.map((step, i) => (
              <li key={i} className="flex items-start gap-2.5 leading-relaxed">
                <ArrowRight className="w-3.5 h-3.5 text-blue-400 mt-0.5 shrink-0" />
                <span>{step}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Bottom Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
        <button
          onClick={onRestart}
          className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-sm shadow-xl shadow-blue-500/20 flex items-center justify-center gap-2 transition-all"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Practice Another Mock Interview</span>
        </button>

        <button
          onClick={downloadReportJson}
          className="w-full sm:w-auto px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-sm font-medium flex items-center justify-center gap-2 transition-all"
        >
          <Download className="w-4 h-4" />
          <span>Export Scorecard (JSON)</span>
        </button>
      </div>
    </div>
  );
};
