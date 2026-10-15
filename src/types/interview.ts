export type SeniorityLevel = 'Junior' | 'Mid' | 'Senior' | 'Staff / Principal' | 'Engineering Manager';

export type InterviewTrack = 
  | 'iOS & Swift'
  | 'Frontend & Web'
  | 'Backend & Distributed Systems'
  | 'Full-Stack'
  | 'System Design'
  | 'Behavioral & Leadership'
  | 'General Software Engineering';

export type InterviewFormat = 'Standard (5-6 questions)' | 'Quick Screening (3 questions)' | 'Deep Dive (8 questions)';

export type QuestionStyle = 
  | 'direct-technical'
  | 'scenario-based'
  | 'behavioral'
  | 'mixed';

export interface InterviewerPersona {
  id: string;
  name: string;
  title: string;
  companyVibe: string;
  avatarSeed: string;
  primaryColor: string;
  voiceGender: 'male' | 'female';
  voicePitch: number;
  voiceRate: number;
  imagePath: string;
  thumbnailPath?: string;
  geminiVoice?: string;
  voiceOptions?: string[];
  faceCoordinates: {
    eyeLeft: [number, number]; // [x%, y%]
    eyeRight: [number, number];
    mouth: [number, number];
    mouthWidth: number;
    mouthHeight: number;
  };
  description: string;
  specialtyTags: string[];
  systemPersonalityPrompt: string;
}

export interface InterviewConfig {
  apiKey: string;
  model: string;
  candidateName: string;
  track: InterviewTrack;
  seniority: SeniorityLevel;
  format: InterviewFormat;
  questionStyle: QuestionStyle;
  interviewerId: string;
  resumeText: string;
  jobDescription: string;
  focusAreas: string[];
  isDemoMode: boolean;
}

export interface InterviewMessage {
  id: string;
  role: 'interviewer' | 'candidate' | 'system';
  content: string;
  timestamp: number;
  audioBlobUrl?: string;
  questionNumber?: number;
  isCurrentQuestion?: boolean;
}

export interface QuestionEvaluation {
  questionNumber: number;
  questionText: string;
  candidateAnswer: string;
  score: number; // 0 to 100
  positiveFeedback: string;
  constructiveFeedback: string;
  sampleIdealAnswer: string;
  keyConceptsCovered: string[];
  missedKeyConcepts: string[];
}

export interface EvaluationReport {
  overallScore: number; // 0 to 100
  recommendation: 'Strong Hire' | 'Hire' | 'Leaning Hire' | 'Leaning No Hire' | 'No Hire';
  summary: string;
  strengths: string[];
  areasForImprovement: string[];
  scoreBreakdown: {
    technicalAccuracy: number;
    problemSolving: number;
    communication: number;
    architectureAndDepth: number;
    practicalExperience: number;
  };
  questionEvaluations: QuestionEvaluation[];
  actionableNextSteps: string[];
}

export type InterviewState = 'setup' | 'interviewing' | 'evaluating' | 'completed';
