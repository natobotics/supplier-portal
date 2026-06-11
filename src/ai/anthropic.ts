// Production integration point: Claude API.
//
// The demo runs on the local engine in ./copilot.ts. To wire the copilot to
// Claude, proxy through your backend (never expose the API key client-side):
//
//   POST https://api.anthropic.com/v1/messages
//   model: "claude-fable-5"
//
// Recommended setup:
// - system prompt: AP analyst persona + company payment policy
// - tools: query_invoices, query_suppliers, get_aging, schedule_payment
//   (Claude calls these against your AP subledger; results ground every answer)
// - streaming: true for responsive chat UX
//
// Example backend handler:
//
//   import Anthropic from "@anthropic-ai/sdk";
//   const client = new Anthropic(); // reads ANTHROPIC_API_KEY
//
//   const response = await client.messages.create({
//     model: "claude-fable-5",
//     max_tokens: 1024,
//     system: AP_ANALYST_SYSTEM_PROMPT,
//     tools: AP_TOOLS,
//     messages: conversationHistory,
//   });

export interface CopilotBackend {
  ask(question: string, history: Array<{ role: string; content: string }>): Promise<string>
}

export const REQUIRES_BACKEND_PROXY = true
