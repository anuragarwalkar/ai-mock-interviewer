import type { 
  InterviewConfig, 
  InterviewMessage, 
  EvaluationReport 
} from '../types/interview';
import { INTERVIEWER_PERSONAS } from '../data/personas';

export class GeminiService {
  /**
   * Helper to make direct requests to Gemini generateContent endpoint
   */
  private async callGemini(
    apiKey: string,
    modelName: string = 'gemini-3.8-flash',
    contents: any[],
    systemInstruction?: string,
    temperature: number = 0.7
  ): Promise<string> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey.trim()}`;

    const payload: any = {
      contents,
      generationConfig: {
        temperature,
        topK: 40,
        topP: 0.95
      }
    };

    if (systemInstruction) {
      payload.systemInstruction = {
        parts: [{ text: systemInstruction }]
      };
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData?.error?.message || `Gemini request failed with status ${response.status}`);
    }

    const data = await response.json();
    const candidate = data?.candidates?.[0];
    const text = candidate?.content?.parts?.[0]?.text;

    if (!text && text !== '') {
      throw new Error('Empty response received from Gemini API');
    }

    return text.trim();
  }

  /**
   * Test if the provided Gemini API key is valid
   */
  public async testApiKey(apiKey: string, modelName: string = 'gemini-3.8-flash'): Promise<{ success: boolean; message: string }> {
    if (!apiKey || apiKey.trim().length === 0) {
      return { success: false, message: 'API key cannot be empty' };
    }

    try {
      const text = await this.callGemini(
        apiKey.trim(),
        modelName,
        [{ parts: [{ text: "Hello! Respond with 'API_OK' if you can read this." }] }],
        undefined,
        0.2
      );

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
    const isDirectTechnical = config.questionStyle === 'direct-technical';
    const isBehavioral = config.questionStyle === 'behavioral';
    const isScenario = config.questionStyle === 'scenario-based';

    const questionStylePrompt = isDirectTechnical
      ? `QUESTION FORMAT: REAL-WORLD PRACTICAL QUESTIONS (FREQUENTLY ASKED IN ACTUAL TECH INTERVIEWS).
STRICT RULES FOR DIRECT TECHNICAL QUESTIONS:
1. ASK REAL, COMMON INTERVIEW QUESTIONS THAT REAL HUMAN INTERVIEWERS ASK:
   - DO NOT ask obscure, overly theoretical, or compiler/engine internals (e.g. NEVER ask about React Fiber reconciliation priority schedulers under the hood, compiler ASTs, or esoteric low-level runtime engine code).
   - INSTEAD, ask the practical, high-yield questions that working developers face every day and get asked in interviews:
     * For React / Frontend / Mobile:
       - Core React Hooks: useEffect (dependency array, cleanup functions, preventing infinite re-render loops, handling race conditions when fetching data, stale closures).
       - Hooks comparison: useMemo vs useCallback (when to use them, real-world examples, avoiding premature optimization).
       - State & Rendering: How state updates trigger re-renders, state batching in React 18, lifting state up, controlled vs uncontrolled components.
       - Custom hooks & rules of hooks: How and why to build custom hooks, rules of hooks.
       - Core JavaScript: Closures, Event Loop, Promises vs async/await, Array methods, reference vs primitive types, debounce vs throttle.
     * For Backend / Full-Stack:
       - REST API design, HTTP methods/status codes, GraphQL vs REST, indexing in databases, caching with Redis, JWT authentication, connection pooling, error handling.
     * For General Software Engineering:
       - Clean code principles, practical design patterns, error handling, asynchronous programming, common data structures.
2. ABSOLUTELY NO SCENARIO OR HYPOTHETICAL STORY PROBLEMS:
   - Do NOT say "Imagine you are building a system for 10M users...", "Suppose your team is tasked with...", "Walk me through an incident where...".
   - Ask a clean, direct, real-world question (e.g. "Can you explain how useEffect works, what the dependency array controls, and how to properly clean up subscriptions or timers?").
3. Keep it natural, conversational, and direct for a ${config.seniority} level.`
      : isBehavioral
      ? `QUESTION FORMAT: BEHAVIORAL & LEADERSHIP (STAR METHOD).
Focus on past experiences, technical leadership, cross-functional collaboration, navigating ambiguity, and resolving technical conflicts.`
      : isScenario
      ? `QUESTION FORMAT: SCENARIO-BASED & ARCHITECTURE.
Focus on real-world engineering scenarios, system architecture dilemmas, scaling bottlenecks, edge-case failure modes, and trade-offs.`
      : `QUESTION FORMAT: BALANCED MIX.
Provide a balanced combination of direct technical knowledge questions and practical problem-solving challenges.`;

    const systemPrompt = `You are ${persona.name}, ${persona.title}.
Company Style: ${persona.companyVibe}.
Target Role: ${config.track} (${config.seniority} level).
Candidate Name: ${config.candidateName || 'Candidate'}.

${persona.systemPersonalityPrompt}

${questionStylePrompt}

Candidate's Resume / Experience Profile:
${config.resumeText ? config.resumeText.slice(0, 3000) : 'Not provided, focus on core engineering domain skills.'}

Job Description / Target Competencies:
${config.jobDescription ? config.jobDescription.slice(0, 2000) : 'Standard high-bar industry expectations.'}

INSTRUCTIONS FOR OPENING:
1. Warmly welcome ${config.candidateName || 'the candidate'} in 1 brief sentence.
2. ${isDirectTechnical 
    ? `Formulate the first DIRECT technical question for this ${config.seniority} position. If resume details were provided, pick a core technology or language from their background and ask a direct conceptual or syntax/internals question. Remember: NO SCENARIOS or hypothetical story setups.` 
    : isBehavioral 
    ? `Formulate the first behavioral question exploring their background and teamwork.`
    : `If resume details were provided, mention a specific highlight or project, and formulate an architectural or engineering scenario question for this ${config.seniority} position.`}
3. Keep the entire response under 3 sentences so it sounds natural when spoken aloud. Do NOT use markdown symbols or bullets.`;

    try {
      const text = await this.callGemini(
        config.apiKey,
        config.model || 'gemini-3.8-flash',
        [{ parts: [{ text: "Please begin the technical interview now." }] }],
        systemPrompt,
        0.6
      );

      return text;
    } catch (error) {
      console.error('Error generating opening question with Gemini:', error);
      return this.getDemoOpeningQuestion(config);
    }
  }

  /**
   * Generates the next interviewer reaction and follow-up / next question using conversation history
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
    const isDirectTechnical = config.questionStyle === 'direct-technical';
    const isBehavioral = config.questionStyle === 'behavioral';

    let nextQuestionGuideline = '';
    if (isLastQuestion) {
      nextQuestionGuideline = 'This is the final turn. Thank the candidate warmly, mention that we have concluded all questions, and tell them you are preparing their detailed scorecard evaluation now.';
    } else if (isDirectTechnical) {
      nextQuestionGuideline = `CRITICAL RULE: Transition to Question ${currentQuestionNum + 1} with a REAL-WORLD PRACTICAL QUESTION (FREQUENTLY ASKED IN ACTUAL INTERVIEWS).
- Absolutely NO obscure internals (NO Fiber reconciler algorithms under the hood, NO compiler ASTs, NO esoteric C++ engine bindings).
- Absolutely NO hypothetical scenarios or fictional production incident stories.
- Ask a high-yield, practical question that real human interviewers ask in actual interviews:
  * For React / Frontend: useEffect lifecycle & cleanup, useMemo vs useCallback, stale closures in hooks, custom hooks, prop drilling vs Context/Redux, handling API race conditions in components.
  * For JavaScript: Closures, Promises/async-await error handling, Event loop, debounce vs throttle, immutable state updates.
  * For Backend / General: REST vs GraphQL, database indexing, caching strategies, API error codes, authentication patterns.
- First acknowledge their answer in 1 conversational sentence, then ask the practical interview question.`;
    } else if (isBehavioral) {
      nextQuestionGuideline = `Transition to Question ${currentQuestionNum + 1} with a targeted behavioral question using the STAR method on leadership, conflict resolution, or project delivery.`;
    } else {
      nextQuestionGuideline = `Then, either ask an incisive follow-up challenging an edge case or transition to question ${currentQuestionNum + 1} targeting another essential competency or architectural scenario.`;
    }

    const systemPrompt = `You are ${persona.name}, ${persona.title} on a live video interview.
Candidate: ${config.candidateName || 'Candidate'}.
Track: ${config.seniority} ${config.track}.
Question Style: ${config.questionStyle || 'direct-technical'}.
Progress: Question ${currentQuestionNum} of ${totalQuestions}.
${persona.systemPersonalityPrompt}

Candidate Background & Context:
${config.resumeText ? config.resumeText.slice(0, 2500) : 'General experienced candidate.'}

CRITICAL RULES FOR SPOKEN VOICE:
- Speak conversationally in 2 to 3 concise sentences.
- First, acknowledge or evaluate their specific answer (e.g., "Good explanation of memory layouts...", "That's a sound point on concurrency boundaries...").
- ${nextQuestionGuideline}
- Plain conversational English only. Do NOT output markdown formatting, asterisks, bullet points, or stage directions.`;

    try {
      // Map history to Gemini's multi-turn format (user and model roles)
      const contents = history.map(msg => ({
        role: msg.role === 'interviewer' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      }));

      // Ensure last message is from user
      if (contents.length > 0 && contents[contents.length - 1].role === 'model') {
        contents.push({
          role: 'user',
          parts: [{ text: 'Please provide your reaction and next question.' }]
        });
      }

      const text = await this.callGemini(
        config.apiKey,
        config.model || 'gemini-3.8-flash',
        contents,
        systemPrompt,
        0.7
      );

      return {
        responseText: text,
        isClosing: isLastQuestion
      };
    } catch (error) {
      console.error('Error generating turn with Gemini:', error);
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
Question Style: ${config.questionStyle || 'direct-technical'}.
${config.questionStyle === 'direct-technical' ? 'Note: Candidate was evaluated on direct technical and conceptual questions (not scenario storytelling). Prioritize technical accuracy, understanding of internals, data structure depth, and clarity.' : ''}

Candidate Background:
${config.resumeText ? config.resumeText.slice(0, 2000) : 'Standard engineering profile.'}

Interview Transcript:
${history.map(m => `[${m.role.toUpperCase()}]: ${m.content}`).join('\n\n')}

Return ONLY a valid JSON object matching this structure:
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
      let text = await this.callGemini(
        config.apiKey,
        config.model || 'gemini-3.8-flash',
        [{ parts: [{ text: prompt }] }],
        undefined,
        0.2
      );

      // Clean potential json markdown tags
      text = text.replace(/```json/gi, '').replace(/```/gi, '').trim();
      const parsed: EvaluationReport = JSON.parse(text);
      return parsed;
    } catch (err) {
      console.error('Failed to parse Gemini evaluation report JSON, using fallback rubric:', err);
      return this.getDemoEvaluationReport(history, config);
    }
  }

  /**
   * Generates a concise ideal answer and key takeaway concepts when a candidate doesn't know the answer
   */
  public async generateIdealAnswer(
    questionText: string, 
    config: InterviewConfig
  ): Promise<{ answer: string; keyPoints: string[] }> {
    if (config.isDemoMode || !config.apiKey) {
      return this.getDemoIdealAnswer(questionText, config);
    }

    const prompt = `You are a Principal Software Engineer and master technical interview mentor.
A candidate is practicing for a ${config.seniority} ${config.track} interview.
They were asked:
"${questionText}"

Provide an authoritative, clear, and high-scoring ideal answer that an interviewer would rate as top-tier.
Keep it direct, accurate, and easy to understand (2-3 concise paragraphs).
Also provide 3-4 bullet points highlighting the critical concepts/mechanisms.

Return ONLY a JSON object:
{
  "answer": "Clear, comprehensive explanation of the concept...",
  "keyPoints": [
    "Concept 1...",
    "Concept 2...",
    "Concept 3..."
  ]
}
Do NOT wrap in markdown fences. Raw JSON only.`;

    try {
      let text = await this.callGemini(
        config.apiKey,
        config.model || 'gemini-3.8-flash',
        [{ parts: [{ text: prompt }] }],
        undefined,
        0.3
      );

      text = text.replace(/```json/gi, '').replace(/```/gi, '').trim();
      const parsed = JSON.parse(text);
      return {
        answer: parsed.answer || 'Ideal answer explanation.',
        keyPoints: Array.isArray(parsed.keyPoints) ? parsed.keyPoints : []
      };
    } catch (err) {
      console.error('Failed to generate ideal answer with Gemini:', err);
      return this.getDemoIdealAnswer(questionText, config);
    }
  }

  private getDemoIdealAnswer(questionText: string, config: InterviewConfig): { answer: string; keyPoints: string[] } {
    const qLower = questionText.toLowerCase();

    if (qLower.includes('useeffect')) {
      return {
        answer: "useEffect is a React hook that lets you synchronize a component with an external system (such as API calls, subscriptions, timers, or DOM mutations). It takes a callback function and an optional dependency array. If no array is provided, it runs after every render. If an empty array [] is provided, it runs once after mount. If dependencies are specified [a, b], it runs whenever any dependency changes by reference. When returning a cleanup function, React executes that cleanup before re-running the effect and upon component unmount, preventing memory leaks, stale event listeners, or out-of-order race conditions.",
        keyPoints: [
          "Runs asynchronously after paint to prevent blocking visual rendering",
          "Dependency array comparison uses Object.is() shallow reference equality",
          "Cleanup function executes before re-execution and on component unmount",
          "Handle API race conditions using cleanup flags or AbortController"
        ]
      };
    }

    if (qLower.includes('usememo') || qLower.includes('usecallback')) {
      return {
        answer: "useMemo and useCallback are React performance optimization hooks that cache values across renders. useMemo caches the *result* of an expensive calculation, only recomputing when its dependencies change. useCallback caches the *function definition itself*, ensuring the same function reference is maintained between renders. useCallback is primarily used when passing callbacks to child components wrapped in React.memo to avoid breaking prop-equality checks and triggering unnecessary child re-renders.",
        keyPoints: [
          "useMemo caches a computed value; useCallback caches a function instance",
          "useCallback(fn, deps) is equivalent to useMemo(() => fn, deps)",
          "Prevents unnecessary re-renders of memoized children (React.memo)",
          "Avoid premature optimization; only apply when calculations or child trees are expensive"
        ]
      };
    }

    if (qLower.includes('closure') || qLower.includes('stale')) {
      return {
        answer: "A closure in JavaScript is the combination of a function bundled together with references to its surrounding lexical environment. In React, a 'stale closure' occurs when a function or hook (like useEffect, useCallback, or setInterval) captures state or props from an earlier render and continues referencing that outdated snapshot rather than the current state. Common solutions include adding the missing state to the dependency array, using a functional state updater (e.g. setCount(prev => prev + 1)), or storing the latest value in a useRef.",
        keyPoints: [
          "Function retains access to variables from its outer enclosing scope",
          "Stale closure occurs when callback retains old state across subsequent renders",
          "Fixed with complete dependency arrays, functional state updates, or useRef",
          "Critical for timers (setInterval) and async callbacks in useEffect"
        ]
      };
    }

    if (qLower.includes('re-render') || qLower.includes('batching')) {
      return {
        answer: "In React, a component re-renders whenever its state changes, its parent re-renders, or its consumed context updates. React 18 introduced Automatic Batching, which groups multiple state updates inside promises, timeouts, and native event handlers into a single re-render for better performance. Common causes of unnecessary re-renders include recreating object/array literals or function definitions in JSX without memoization, changing context values high in the tree, or missing React.memo on heavy leaf components.",
        keyPoints: [
          "State update, prop change, or context update triggers a re-render",
          "React 18 automatically batches state updates across async events and timeouts",
          "Optimize with React.memo, useMemo/useCallback, and colocation of state",
          "React compares the virtual DOM tree to commit only minimal real DOM mutations"
        ]
      };
    }

    if (qLower.includes('jsi') || qLower.includes('bridge') || qLower.includes('react native')) {
      return {
        answer: "The JavaScript Interface (JSI) is a lightweight, unified C++ API that replaces React Native's legacy asynchronous bridge. In the legacy architecture, JavaScript and Native threads communicated exclusively by serializing JSON payloads across a queue, which introduced high serialization overhead and latency bottlenecks. JSI allows the JavaScript engine (such as Hermes or V8) to hold direct C++ object references via HostObjects. This enables synchronous, zero-copy method invocations and direct memory sharing, forming the foundation of the New Architecture (TurboModules and Fabric).",
        keyPoints: [
          "Eliminates JSON serialization/deserialization over thread boundaries",
          "Synchronous C++ function execution directly callable from JavaScript",
          "HostObjects: native objects directly registered in the JS runtime garbage collector",
          "Powers TurboModules (lazy native module loading) and Fabric (concurrent rendering)"
        ]
      };
    }

    if (qLower.includes('optimistic') || qLower.includes('pessimistic') || qLower.includes('locking')) {
      return {
        answer: "Optimistic locking assumes record conflicts are rare. Instead of locking the row on read, it checks a version timestamp or version number column during update (e.g., WHERE id = 1 AND version = 2). If another transaction changed the version, the update fails or retries. Pessimistic locking explicitly places exclusive database locks (e.g., SELECT ... FOR UPDATE) as soon as data is read, preventing any concurrent modification until the transaction completes. Optimistic locking is ideal for high-throughput, read-heavy workloads, whereas pessimistic locking is necessary for high-contention operations like banking balance deductions or inventory reservation.",
        keyPoints: [
          "Optimistic: No database-level record locks; uses versioning/timestamps and rollback-on-conflict",
          "Pessimistic: Acquires lock immediately (SELECT ... FOR UPDATE) to prevent concurrency hazards",
          "Workload fit: Optimistic for low-contention reads; Pessimistic for high-contention critical transactions",
          "Deadlock trade-off: Pessimistic locking can cause deadlocks if locking order is inconsistent"
        ]
      };
    }

    if (qLower.includes('event loop') || qLower.includes('async')) {
      return {
        answer: "The event loop continuously monitors the call stack and message queues. Synchronous execution runs on the single JavaScript thread call stack. When an asynchronous operation occurs (like network I/O or timers), it is delegated to native background worker threads (like libuv or browser Web APIs). Upon completion, callbacks are queued into either the microtask queue (Promises, process.nextTick) or macrotask queue (setTimeout, setInterval, setImmediate). Microtasks are drained completely after every stack frame before any macrotask is processed.",
        keyPoints: [
          "Single-threaded call stack offloads I/O to background system thread pools",
          "Microtasks (Promises, MutationObserver) take strict priority over macrotasks (Timers, I/O)",
          "Event loop processes all pending microtasks before rendering or taking the next macrotask",
          "CPU-bound tasks block the stack; asynchronous I/O allows non-blocking concurrency"
        ]
      };
    }

    return {
      answer: `For this ${config.seniority} level question: A top-tier response breaks down the concept into three parts: first, define the core mechanism and its role in the overall architecture; second, compare the trade-offs (e.g. latency, memory overhead, concurrency safety); and third, give a real-world scenario demonstrating when and why you would apply it.`,
      keyPoints: [
        "State the exact definition and architectural role clearly",
        "Articulate memory, performance, and concurrency implications",
        "Highlight practical trade-offs and common production pitfalls"
      ]
    };
  }

  // --- DEMO / FALLBACK GENERATORS ---

  private getDemoOpeningQuestion(config: InterviewConfig): string {
    const name = config.candidateName ? `${config.candidateName}` : 'there';

    if (config.questionStyle === 'direct-technical') {
      return `Hi ${name}, great to connect with you today! To kick off our technical questions: Could you explain how useEffect works in React, how the dependency array controls when it runs, and how cleanup functions work to prevent memory leaks or duplicate listeners?`;
    }

    if (config.questionStyle === 'behavioral') {
      return `Hi ${name}, welcome! To start our conversation today: could you describe a situation where you had a strong technical disagreement with another engineer or stakeholder, and how you worked through it?`;
    }

    return `Hi ${name}, welcome to our session today! I'm glad to meet you. To kick things off for this ${config.seniority} role, could you walk me through an architecturally challenging project from your recent experience, highlighting the toughest engineering trade-offs you had to navigate?`;
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

    if (config.questionStyle === 'direct-technical') {
      const technicalQuestions = [
        "That's a very clear explanation. In React, what is the key difference between useMemo and useCallback, and when should you actually reach for them versus letting React re-render naturally?",
        "Good distinction on caching values versus function references. Can you explain what a closure is in JavaScript, and have you ever encountered a stale closure issue inside a useEffect or event handler?",
        "Spot on. When a component re-renders in React, how does state batching work, and what are the most common causes of unnecessary re-renders in a real app?",
        "Makes total sense. When fetching data from an API inside a component, how do you handle race conditions or cancel in-flight requests if the component unmounts before the request finishes?",
        "Great answer. What are the core rules of React Hooks, and why can't you call hooks conditionally inside regular if-statements or loops?",
        "Well explained. Could you explain the difference between controlled and uncontrolled components in React forms, and in what situations you would choose one over the other?"
      ];
      const selected = technicalQuestions[(currentQuestionNum - 1) % technicalQuestions.length];
      return { responseText: selected, isClosing: false };
    }

    if (config.questionStyle === 'behavioral') {
      const behavioralQuestions = [
        "Thank you for sharing that. Can you tell me about a time when you had to deliver a critical project under tight deadlines with ambiguous requirements?",
        "That shows good initiative. How do you approach giving constructive technical feedback during a code review when you disagree with an approach?",
        "Great perspective. Can you describe an incident where a production bug or outage occurred due to your code, and how you handled the post-mortem and mitigation?"
      ];
      const selected = behavioralQuestions[(currentQuestionNum - 1) % behavioralQuestions.length];
      return { responseText: selected, isClosing: false };
    }

    const followUps = [
      "That's a solid explanation. How did you handle high-concurrency data consistency and error recovery when edge-case network partitions occurred?",
      "Good point. If you had to scale that architecture by 10x with strict sub-50ms latency SLOs, what would be the first bottleneck you would redesign?",
      "I appreciate that perspective. How did you establish observability and automated rollback strategies for that deployment in production?"
    ];
    const selected = followUps[(currentQuestionNum - 1) % followUps.length];
    return { responseText: selected, isClosing: false };
  }

  private getDemoEvaluationReport(history: InterviewMessage[], config: InterviewConfig): EvaluationReport {
    const candidateAnswers = history.filter(m => m.role === 'candidate');
    const answerCount = candidateAnswers.length;

    const baseScore = answerCount >= 3 ? 84 : 76;

    const isDirectTech = config.questionStyle === 'direct-technical';

    return {
      overallScore: baseScore,
      recommendation: baseScore >= 80 ? 'Hire' : 'Leaning Hire',
      summary: isDirectTech
        ? `The candidate demonstrated strong conceptual clarity and technical depth across core engineering fundamentals for a ${config.seniority} level. They explained runtime mechanics and data structure trade-offs with high accuracy and minimal hesitation.`
        : `The candidate demonstrated strong foundational mastery for a ${config.seniority} level. They articulated trade-offs effectively and showed good problem-solving instincts, with minor opportunities to deepen their discussion of edge-case error recovery.`,
      strengths: isDirectTech ? [
        'Precise articulation of runtime internals, concurrency primitives, and memory mechanics.',
        'Strong conceptual grounding in data structure trade-offs and complexity analysis.',
        'Direct, well-structured explanations without tangential rambling.'
      ] : [
        'Clear grasp of core engineering principles and architectural paradigms.',
        'Strong communication style: structured responses with minimal rambling.',
        'Good awareness of real-world production trade-offs and performance implications.'
      ],
      areasForImprovement: isDirectTech ? [
        'Could provide more concrete runtime examples or low-level implementation details when discussing edge-case behavior.',
        'Deepen familiarity with underlying compiler optimizations and garbage collection tuning parameters.'
      ] : [
        'Could provide more concrete metrics (latency, memory footprint, throughput) when describing architectural decisions.',
        'Explore defensive programming patterns and edge-case handling more thoroughly before being prompted.'
      ],
      scoreBreakdown: isDirectTech ? {
        technicalAccuracy: 90,
        problemSolving: 84,
        communication: 86,
        architectureAndDepth: 85,
        practicalExperience: 82
      } : {
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
          positiveFeedback: isDirectTech 
            ? 'Precise conceptual answer covering the primary mechanisms and trade-offs.' 
            : 'Good technical articulation and appropriate architectural choices.',
          constructiveFeedback: isDirectTech
            ? 'Could dive slightly deeper into worst-case boundary conditions and memory layout implications.'
            : 'Could elaborate on resilience and failure recovery strategies under high load.',
          sampleIdealAnswer: isDirectTech
            ? 'A strong response defines the mechanism clearly, explains the underlying data structures or memory layout, and articulates asymptotic time/space bounds.'
            : 'A high-scoring answer clearly distinguishes concurrency boundaries, mentions backpressure management, and defines an explicit fallback strategy.',
          keyConceptsCovered: isDirectTech 
            ? ['Core runtime internals', 'Concurrency & locks', 'Data structure mechanics']
            : ['Core architecture', 'State management', 'Trade-off analysis'],
          missedKeyConcepts: isDirectTech
            ? ['Memory layout boundaries', 'Compiler optimizations']
            : ['Telemetry/Metrics', 'Graceful degradation']
        })),
      actionableNextSteps: isDirectTech ? [
        'Review deep-dive runtime documentation (memory allocation, GC compaction phases).',
        'Practice explaining amortized time complexity and worst-case hash collision handling.',
        'Study advanced concurrency primitives (compare-and-swap, atomics, lock-free queues).'
      ] : [
        'Review advanced distributed concurrency and memory optimization benchmarks.',
        'Practice framing answers using the STAR method (Situation, Task, Action, Result) for behavioral probes.',
        'Deepen familiarity with telemetry and production observability patterns.'
      ]
    };
  }
}

export const geminiService = new GeminiService();
