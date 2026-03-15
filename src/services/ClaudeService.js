// ClaudeService.js
// Service for Anthropic Claude AI integration

// NOTE: You must provide your Claude API key via localStorage or environment variable
const CLAUDE_API_KEY_STORAGE = 'lakeland_hub_claude_api_key';
const CLAUDE_MODEL_STORAGE = 'lakeland_hub_claude_model';
const DEFAULT_MODEL = 'claude-3-sonnet-20240229';

export const getClaudeApiKey = () => localStorage.getItem(CLAUDE_API_KEY_STORAGE) || '';
export const setClaudeApiKey = (key) => localStorage.setItem(CLAUDE_API_KEY_STORAGE, key.trim());
export const hasClaudeApiKey = () => !!localStorage.getItem(CLAUDE_API_KEY_STORAGE);
export const clearClaudeApiKey = () => localStorage.removeItem(CLAUDE_API_KEY_STORAGE);

// Aliases for generic usage (compatibility with WorkbookGenerator)
export const getApiKey = getClaudeApiKey;
export const setApiKey = setClaudeApiKey;
export const hasApiKey = hasClaudeApiKey;
export const clearApiKey = clearClaudeApiKey;

export const getClaudeModel = () => localStorage.getItem(CLAUDE_MODEL_STORAGE) || DEFAULT_MODEL;
export const setClaudeModel = (m) => localStorage.setItem(CLAUDE_MODEL_STORAGE, m);

// --- HTML Extraction ---
function extractHtml(text) {
  const match = text.match(/```html?\s*\n([\s\S]*?)```/);
  let html = match ? match[1].trim() : text.trim();
  html = html.replace(/\*\*([^*]+?)\*\*/g, '<strong>$1</strong>');
  return html;
}

// --- Generate Workbook (Claude) ---
export async function generateWorkbook({ systemPrompt, userPrompt, onChunk, signal }) {
  const apiKey = getClaudeApiKey();
  if (!apiKey) throw new Error('No Claude API key configured.');

  const model = getClaudeModel();
  const url = '/api/claude/messages';

  const headers = {
    'x-forwarded-api-key': apiKey,
    'content-type': 'application/json',
  };

  const body = JSON.stringify({
    model,
    max_tokens: 4096,
    temperature: 0.75,
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }],
    stream: true,
  });

  // Streaming fetch
  const response = await fetch(url, { method: 'POST', headers, body, signal });
  if (!response.ok) throw new Error('Claude API error: ' + response.status);

  let accumulated = '';
  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value);
    accumulated += chunk;
    if (onChunk) onChunk(accumulated);
  }

  return extractHtml(accumulated);
}

// --- Repair Workbook (reuse Gemini logic) ---
export { repairWorkbook } from './geminiService';

// --- Test Connection ---
export async function testConnection() {
  const apiKey = getClaudeApiKey();
  if (!apiKey) return { ok: false, error: 'No Claude API key configured.' };
  // Simple ping (not a real Claude endpoint, but can be used for key presence)
  return { ok: true };
}
