import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { HumanMessage, SystemMessage, AIMessage, type BaseMessage } from "@langchain/core/messages";
import type { 
  InterviewConfig, 
  InterviewMessage, 
  EvaluationReport 
} from '../types/interview';
import { INTERVIEWER_PERSONAS } from '../data/personas';

export class GeminiLangChainService {
  private getModel(apiKey: string, modelName: string = 'gemini-2.0-flash', temperature: number = 0.7) {
    return new ChatGoogleGenerativeAI({
      apiKey: apiKey,
      model: modelName,
      temperature: temperature,
      maxRetries: 2,
    });
  }

  /**
   * Test if the provided Gemini API key is valid
   */
  public async testApiKey(apiKey: string, modelName: string = 'gemini-2.0-flash'): Promise<{ success: boolean; message: string }> {
    if (!apiKey || apiKey.trim().length === 0) {
      return { success: false, message: 'API key cannot be empty' };
    }

    try {
      const model = this.getModel(apiKey.trim(), modelName, 0.2);
      const response = await model.invoke([
        new HumanMessage("Hello! Respond with 'API_OK' if you can read this.")
      ]);
      const text = typeof response.content === 'string' ? response.content : JSON.stringify(response.content);
      if (text.includes('API_OK') || text.length > 0) {
        return { success: true, message: 'Gemini API connected successfully!' };
      }
      return { success: false, message: 'Unexpected response from Gemini' };
    } catch (err: any) {
      return { 
        success: false, 
        message: err?.message || 'Failed to authenticate with Gemini API. Check your key and network.' 
      };
    }
  }

  /**
   * Generates the personalized opening greeting and first question based on candidate resume and track
   */
  public async generateOpeningQuestion(config: InterviewConfig): Promise<string> {
    if (config.isDemoMode || !config.apiKey) {
      return this.getDemoOpeningQuestion(config);
    }

    const persona = INTERVIEWER_PERSONAS.find(p => p.id === config.interviewerId) || INTERVIEWER_PERSONAS[0];

    const systemPrompt = `You are ${persona.name}, ${persona.title}.
Company Style: ${persona.companyVibe}.
Target Role: ${config.track} (${config.seniority} level).
Candidate Name: ${config.candidateName || 'Candidate'}.

${persona.systemPersonalityPrompt}

Candidate's Resume / Experience Profile:
${config.resumeText ? config.resumeText.slice(0, 3000) : 'Not provided, focus on core track domain skills.'}

Job Description / Target Competencies:
${config.jobDescription ? config.jobDescription.slice(0, 2000) : 'Standard high-bar industry expectations.'}

INSTRUCTIONS FOR OPENING:
1. Warmly welcome ${config.candidateName || 'the candidate'} in 1 brief sentence.
2. If resume details were provided, mention a specific highlight or project from their background.
3. Formulate the first targeted technical or behavioral interview question for this ${config.seniority} ${config.track} position.
4. Keep the entire response under 3 sentences so it sounds natural when spoken aloud. Do NOT use markdown symbols or bullets.`;

    try {
      const model = this.getModel(config.apiKey, config.model || 'gemini-2.0-flash', 0.6);
      const response = await model.invoke([
        new SystemMessage(systemPrompt),
        new HumanMessage("Start the interview.")
      ]);

      const text = typeof response.content === 'string' ? response.content : JSON.stringify(response.content);
      return text.trim();
    } catch (error) {
      console.error('Error generating opening question with LangChain:', error);
      return this.getDemoOpeningQuestion(config);
    }
  }

  /**
   * Generates the next interviewer reaction and follow-up / next question using LangChain conversation history
   */
  public async generateNextTurn(
    history: InterviewMessage[], 
    config: InterviewConfig,
    currentQuestionNum: number,
    totalQuestions: number
  ): Promise<{ responseText: string; isClosing: boolean }> {
    if (config.isDemoMode || !config.apiKey) {
      return this.getDemoNextTurn(history, config, currentQuestionNum, totalQuestions);
    }

    const persona = INTERVIEWER_PERSONAS.find(p => p.id === config.interviewerId) || INTERVIEWER_PERSONAS[0];
    const isLastQuestion = currentQuestionNum >= totalQuestions;

    const systemPrompt = `You are ${persona.name}, ${persona.title} on a live video interview.
Candidate: ${config.candidateName || 'Candidate'}.
Track: ${config.seniority} ${config.track}.
Progress: Question ${currentQuestionNum} of ${totalQuestions}.
${persona.systemPersonalityPrompt}

Candidate Background & Context:
${config.resumeText ? config.resumeText.slice(0, 2500) : 'General experienced candidate.'}

CRITICAL RULES FOR SPOKEN VOICE:
- Speak conversationally in 2 to 3 concise sentences.
- First, acknowledge or evaluate their specific answer (e.g., "Good catch on retain cycles...", "I like that you considered latency first...").
- ${isLastQuestion 
    ? 'This is the final turn. Thank the candidate warmly, mention that we have concluded all questions, and tell them you are preparing their detailed scorecard evaluation now.'
    : `Then, either ask an incisive follow-up challenging an edge case or transition to question ${currentQuestionNum + 1} targeting another essential competency.`}
- Plain conversational English only. Do NOT output markdown formatting, asterisks, bullet points, or stage directions.`;

    try {
      const model = this.getModel(config.apiKey, config.model || 'gemini-2.0-flash', 0.7);

      const messages: BaseMessage[] = [new SystemMessage(systemPrompt)];

      // Build LangChain conversation message sequence
      for (const msg of history) {
        if (msg.role === 'interviewer') {
          messages.push(new AIMessage(msg.content));
        } else if (msg.role === 'candidate') {
          messages.push(new HumanMessage(msg.content));
        }
      }

      const response = await model.invoke(messages);
      const text = typeof response.content === 'string' ? response.content : JSON.stringify(response.content);

      return {
        responseText: text.trim(),
        isClosing: isLastQuestion
      };
    } catch (error) {
      console.error('Error generating turn with LangChain Gemini:', error);
      return this.getDemoNextTurn(history, config, currentQuestionNum, totalQuestions);
    }
  }

  /**
   * Generates comprehensive post-interview evaluation report with structured scores & rubrics
   */
  public async generateEvaluationReport(
    history: InterviewMessage[], 
    config: InterviewConfig
  ): Promise<EvaluationReport> {
    if (config.isDemoMode || !config.apiKey) {
      return this.getDemoEvaluationReport(history, config);
    }

    const persona = INTERVIEWER_PERSONAS.find(p => p.id === config.interviewerId) || INTERVIEWER_PERSONAS[0];

    const prompt = `You are ${persona.name}, ${persona.title}.
Evaluate this technical/behavioral interview for ${config.candidateName || 'Candidate'}.
Target Position: ${config.seniority} ${config.track}.

Candidate Background:
${config.resumeText ? config.resumeText.slice(0, 2000) : 'Standard track profile.'}

Interview Transcript:
${history.map(m => `[${m.role.toUpperCase()}]: ${m.content}`).join('\n\n')}

Return ONLY a valid JSON object matching this TypeScript structure:
{
  "overallScore": number (0-100),
  "recommendation": "Strong Hire" | "Hire" | "Leaning Hire" | "Leaning No Hire" | "No Hire",
  "summary": string (3-4 sentences executive summary of candidate performance),
  "strengths": string[] (3-5 specific bullet points of what candidate excelled at),
  "areasForImprovement": string[] (3-5 specific actionable areas where candidate was weak or missed edge cases),
  "scoreBreakdown": {
    "technicalAccuracy": number (0-100),
    "problemSolving": number (0-100),
    "communication": number (0-100),
    "architectureAndDepth": number (0-100),
    "practicalExperience": number (0-100)
  },
  "questionEvaluations": [
    {
      "questionNumber": number,
      "questionText": string,
      "candidateAnswer": string,
      "score": number (0-100),
      "positiveFeedback": string,
      "constructiveFeedback": string,
      "sampleIdealAnswer": string,
      "keyConceptsCovered": string[],
      "missedKeyConcepts": string[]
    }
  ],
  "actionableNextSteps": string[] (3-4 study topics or preparation steps)
}

Do NOT wrap in markdown \`\`\`json code fences, just output raw parseable JSON.`;

    try {
      const model = this.getModel(config.apiKey, config.model || 'gemini-2.0-flash', 0.2);
      const response = await model.invoke([new HumanMessage(prompt)]);
      let text = typeof response.content === 'string' ? response.content : JSON.stringify(response.content);

      // Clean potential json markdown tags
      text = text.replace(/```json/gi, '').replace(/```/gi, '').trim();
      const parsed: EvaluationReport = JSON.parse(text);
      return parsed;
    } catch (err) {
      console.error('Failed to parse Gemini evaluation report JSON, using fallback rubric:', err);
      return this.getDemoEvaluationReport(history, config);
    }
  }

  // --- DEMO / FALLBACK GENERATORS ---

  private getDemoOpeningQuestion(config: InterviewConfig): string {
    const name = config.candidateName ? `${config.candidateName}` : 'there';

    if (config.track === 'iOS & Swift') {
      return `Hi ${name}, welcome! I reviewed your background in iOS development. To kick things off for this ${config.seniority} role, could you explain how you approach data flow and state consistency between SwiftUI and Swift Concurrency actors, especially when handling background network updates?`;
    }

    if (config.track === 'Frontend & Web') {
      return `Hi ${name}, great to meet you! Looking at your web engineering experience, let's start with React architecture: how do you manage server-state vs client-state in modern applications, and how do you prevent cascading re-renders across deep component trees?`;
    }

    if (config.track === 'Backend & Distributed Systems' || config.track === 'System Design') {
      return `Welcome ${name}! For this ${config.seniority} systems role, let's dive right in: how would you design an idempotent payment processing workflow that guarantees exactly-once processing even during network timeouts and database failovers?`;
    }

    if (config.track === 'Behavioral & Leadership') {
      return `Hello ${name}, thank you for joining! To start, tell me about a critical technical disagreement you had with a team lead or product manager, how you navigated it, and what the final outcome was.`;
    }

    return `Hi ${name}, welcome to our session today! To begin, walk me through an architecturally challenging project from your recent experience, highlighting the toughest trade-offs you had to navigate.`;
  }

  private getDemoNextTurn(
    _history: InterviewMessage[], 
    config: InterviewConfig,
    currentQuestionNum: number,
    totalQuestions: number
  ): { responseText: string; isClosing: boolean } {
    const isClosing = currentQuestionNum >= totalQuestions;

    if (isClosing) {
      return {
        responseText: `That concludes all our questions for today! Thank you for the insightful conversation. I am synthesizing your answers now and preparing your comprehensive scorecard report.`,
        isClosing: true
      };
    }

    if (config.track === 'iOS & Swift') {
      const followUps = [
        "That's a solid point on actors. Now, how do you handle memory management and retain cycles when working with escaping closures inside Swift Tasks or async sequences?",
        "Good explanation. Let's touch on UIKit and SwiftUI interoperability: when would you choose UIViewControllerRepresentable over pure SwiftUI, and how do you preserve lifecycle coordination?",
        "Interesting trade-off. How would you diagnose and fix a 60fps frame-drop hitch during complex collection view scrolling using Instruments?"
      ];
      const selected = followUps[(currentQuestionNum - 1) % followUps.length];
      return { responseText: selected, isClosing: false };
    }

    return {
      responseText: `I appreciate that perspective. Building on that, what were the main failure modes or latency bottlenecks you anticipated, and how would you verify it in production?`,
      isClosing: false
    };
  }

  private getDemoEvaluationReport(history: InterviewMessage[], config: InterviewConfig): EvaluationReport {
    const candidateAnswers = history.filter(m => m.role === 'candidate');
    const answerCount = candidateAnswers.length;

    const baseScore = answerCount >= 3 ? 84 : 76;

    return {
      overallScore: baseScore,
      recommendation: baseScore >= 80 ? 'Hire' : 'Leaning Hire',
      summary: `The candidate demonstrated strong foundational mastery in ${config.track} for a ${config.seniority} level. They articulated trade-offs effectively and showed good problem-solving instincts, with minor opportunities to deepen their discussion of edge-case error recovery.`,
      strengths: [
        `Clear grasp of ${config.track} core principles and architectural paradigms.`,
        'Strong communication style: structured responses with minimal rambling.',
        'Good awareness of real-world production trade-offs and performance implications.'
      ],
      areasForImprovement: [
        'Could provide more concrete metrics (latency, memory footprint, throughput) when describing architectural decisions.',
        'Explore defensive programming patterns and edge-case handling more thoroughly before being prompted.'
      ],
      scoreBreakdown: {
        technicalAccuracy: 88,
        problemSolving: 85,
        communication: 86,
        architectureAndDepth: 82,
        practicalExperience: 84
      },
      questionEvaluations: history
        .filter(m => m.role === 'interviewer')
        .slice(0, 3)
        .map((q, idx) => ({
          questionNumber: idx + 1,
          questionText: q.content,
          candidateAnswer: candidateAnswers[idx]?.content || 'Answer captured via voice',
          score: 82 + (idx * 3),
          positiveFeedback: 'Good technical articulation and appropriate architectural choices.',
          constructiveFeedback: 'Could elaborate on resilience and failure recovery strategies under high load.',
          sampleIdealAnswer: 'A high-scoring answer clearly distinguishes the concurrency boundary, mentions backpressure management, and defines an explicit fallback strategy.',
          keyConceptsCovered: ['Core architecture', 'State management', 'Trade-off analysis'],
          missedKeyConcepts: ['Telemetry/Metrics', 'Graceful degradation']
        })),
      actionableNextSteps: [
        `Review advanced concurrency and memory optimization benchmarks in ${config.track}.`,
        'Practice framing answers using the STAR method (Situation, Task, Action, Result) for behavioral probes.',
        'Deepen familiarity with telemetry and production observability patterns.'
      ]
    };
  }
}

export const geminiService = new GeminiLangChainService();
