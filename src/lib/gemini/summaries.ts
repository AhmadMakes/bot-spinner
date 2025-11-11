import { getFlashModel } from './client';

export type CallSummaryResult = {
  summary: string;
  intent: string;
  urgency: string;
  lead?: {
    name?: string;
    phone?: string;
    reason?: string;
    next_step?: string;
    needs_follow_up?: boolean;
  };
};

const summaryPrompt = `
You are an AI receptionist writing post-call notes.
Summarize the call in 2 short sentences. Extract intent (info | sales | support | other),
urgency (low | medium | high), and lead details (name, phone, reason, next_step, needs_follow_up boolean).
Respond ONLY with JSON matching:
{
  "summary": "...",
  "intent": "info|sales|support|other",
  "urgency": "low|medium|high",
  "lead": {
    "name": "...",
    "phone": "...",
    "reason": "...",
    "next_step": "...",
    "needs_follow_up": true
  }
}
Transcript:
`;

export const generateCallSummary = async (transcript: string): Promise<CallSummaryResult | null> => {
  const model = getFlashModel();
  const response = await model.generateContent(summaryPrompt + transcript);
  const text = response.response.text();
  const cleaned = text.replace(/```json|```/g, '').trim();

  try {
    return JSON.parse(cleaned) as CallSummaryResult;
  } catch (error) {
    console.error('Failed to parse Gemini summary', { text: cleaned, error });
    return null;
  }
};
