export type AIMessage = { role: 'user' | 'assistant'; content: string };

// Deterministic, in-character AI responder used when no external LLM is configured.
// It synthesizes the scenario's persona doc into replies that feel like a real,
// slightly resistant prospect. Replies vary by conversation turn and user intent.
export function generateAIReply(
  scenarioDoc: string,
  history: AIMessage[],
  userMessage: string
): string {
  const doc = scenarioDoc.trim();
  const persona = extractPersona(doc);
  const turn = history.filter((m) => m.role === 'user').length;
  const lower = userMessage.toLowerCase();

  if (turn === 0 && !/(hi|hello|hey|morning|afternoon)/.test(lower)) {
    return opening(persona);
  }

  if (/price|cost|pricing|budget|discount|expensive|cheap/.test(lower)) {
    return priceObjection(persona);
  }
  if (/integrat|security|compliance|soc|gdpr|data/.test(lower)) {
    return techObjection(persona);
  }
  if (/demo|show|walkthrough|trial/.test(lower)) {
    return demoResponse(persona);
  }
  if (/roi|value|results|case study|outcome/.test(lower)) {
    return roiResponse(persona);
  }
  if (/\?$/.test(userMessage.trim()) && turn < 2) {
    return earlyResistance(persona);
  }

  return inCharacterReply(persona, userMessage, turn);
}

type Persona = {
  name: string;
  role: string;
  company: string;
  tone: string;
  pain: string;
  raw: string;
};

function extractPersona(doc: string): Persona {
  const name = match(doc, /you are\s+([a-z][a-z .'-]+?)(?:,| at |\.)/i) ?? 'the prospect';
  const role = match(doc, /\b(CTO|CEO|COO|CFO|VP [A-Z][a-z]+|Head of [A-Z][a-z]+|Director of [A-Z][a-z]+)\b/) ?? 'a decision maker';
  const company = match(doc, /at\s+([A-Z][\w.& -]+)/) ?? 'their company';
  const tone = /guarded|skeptical|terse/i.test(doc)
    ? 'guarded'
    : /warm|curious/i.test(doc)
    ? 'warm'
    : 'direct';
  const pain = match(doc, /pain[:\s]+([^.]+)\./i) ?? 'ops efficiency';
  return { name, role, company, tone, pain, raw: doc };
}

function match(s: string, r: RegExp): string | null {
  const m = s.match(r);
  return m ? m[1].trim() : null;
}

function opening(p: Persona) {
  const openers = [
    `Look, you caught me between meetings. What is this about?`,
    `Alright, you've got my attention for a minute. Go.`,
    `Hi. I'll be honest — I get dozens of these a week. What makes yours different?`,
    `Okay, I'm listening. Keep it tight.`,
  ];
  return pick(openers, p.name);
}

function priceObjection(p: Persona) {
  return pick(
    [
      `I'll be straight with you — that's steep for what I've seen so far. Walk me through why it costs that.`,
      `Before we go further on price, I need to understand what we'd actually get. Right now it sounds expensive.`,
      `That's outside what I can approve without a very clear ROI story. What does payback look like?`,
      `Honestly? I've seen similar products at half that. Convince me you're different.`,
    ],
    p.company
  );
}

function techObjection(p: Persona) {
  return pick(
    [
      `Integration is the real question. What does it look like with our stack, and how long until we're live?`,
      `Security is non-negotiable for us. SOC 2? Data residency? Walk me through it.`,
      `My team's bandwidth is thin. If this means a three-month rollout, we're not having this conversation.`,
    ],
    p.role
  );
}

function demoResponse(p: Persona) {
  return pick(
    [
      `A demo could work, but only if it's against our actual use case. Can you run it with our scenario, not a canned one?`,
      `Before a demo — who else on my team needs to be in that room? I'm not doing this twice.`,
      `Fine. 30 minutes. Send a tight agenda and I'll block time.`,
    ],
    p.tone
  );
}

function roiResponse(p: Persona) {
  return pick(
    [
      `Numbers I care about: time saved, revenue impact, error rate. Do you have a customer our size to benchmark against?`,
      `ROI stories from vendors are always rosy. What does your worst customer outcome look like?`,
      `If you can show me a 3x return in the first year with a comparable account, I'm interested.`,
    ],
    p.pain
  );
}

function earlyResistance(p: Persona) {
  return pick(
    [
      `Why do you think we need that? I'm not convinced the problem you're describing is actually our problem.`,
      `That's a leading question. Tell me what you're really trying to figure out.`,
      `We're not looking right now. What would make you think we should?`,
    ],
    p.role
  );
}

function inCharacterReply(p: Persona, userMessage: string, turn: number) {
  const progression = [
    `Okay, keep going. But I still haven't heard the one thing that would make me care.`,
    `Hmm. That's interesting. Where does that break down for a team our size?`,
    `Alright, you're making more sense. But I'd want to bring my lead engineer in before going further.`,
    `Let's say I buy that. What's the smallest way we could test this without a big commitment?`,
    `I appreciate the directness. Send me a one-pager — I'll actually read it.`,
  ];
  return pick(progression, userMessage + turn);
}

function pick<T>(arr: T[], seed: string): T {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return arr[Math.abs(h) % arr.length];
}

export function generateFeedback(transcript: AIMessage[]): {
  score: number;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
} {
  const userMsgs = transcript.filter((m) => m.role === 'user');
  const text = userMsgs.map((m) => m.content.toLowerCase()).join(' ');
  const totalWords = text.split(/\s+/).filter(Boolean).length;
  const questions = (text.match(/\?/g) ?? []).length;
  const hasDiscovery = /(what|how|why|tell me|walk me)/.test(text);
  const hasValue = /(roi|value|outcome|impact|revenue|save|reduce)/.test(text);
  const hasNextStep = /(next step|follow up|send|schedule|calendar|meeting|demo)/.test(text);
  const hitPrice = /price|cost|pricing|discount/.test(text);

  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const suggestions: string[] = [];

  if (hasDiscovery) strengths.push('Asked open-ended discovery questions to understand the prospect.');
  if (hasValue) strengths.push('Anchored the conversation on business value and outcomes.');
  if (hasNextStep) strengths.push('Proactively proposed a concrete next step.');
  if (userMsgs.length >= 4) strengths.push('Kept the conversation moving with consistent engagement.');

  if (!hasDiscovery) weaknesses.push('Few discovery questions — too much pitching, not enough listening.');
  if (!hasValue) weaknesses.push('Did not tie the product to a measurable business outcome.');
  if (hitPrice && !hasValue) weaknesses.push('Discussed price before establishing value.');
  if (!hasNextStep) weaknesses.push('No clear next step proposed at the end of the conversation.');
  if (questions < 2) weaknesses.push('Low question-to-statement ratio — felt more like a monologue.');

  if (!hasDiscovery) suggestions.push('Open with a clear discovery question tied to their likely pain.');
  if (hitPrice && !hasValue) suggestions.push('Reframe price objections by anchoring on ROI before negotiating.');
  if (!hasNextStep) suggestions.push('End every call with a specific, time-bound next step (date + agenda).');
  suggestions.push('Mirror one word from the prospect’s last reply to show you are listening.');

  const base = 55;
  const score = Math.min(
    97,
    Math.max(
      30,
      base +
        strengths.length * 8 -
        weaknesses.length * 5 +
        Math.min(10, Math.floor(totalWords / 30))
    )
  );

  const summary =
    strengths.length > weaknesses.length
      ? 'Strong rep overall. Keep the discovery-first approach and sharpen your close.'
      : weaknesses.length > strengths.length
      ? 'Solid attempt, but the conversation leaned pitchy. More listening and a clearer next step will lift this fast.'
      : 'A balanced rep. One or two small adjustments will meaningfully improve your conversion.';

  return { score, summary, strengths, weaknesses, suggestions };
}
