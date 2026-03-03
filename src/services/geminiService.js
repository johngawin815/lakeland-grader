import { GoogleGenerativeAI } from '@google/generative-ai';

const STORAGE_KEY = 'lakeland_hub_gemini_api_key';
const MODEL_KEY = 'lakeland_hub_gemini_model';
const DEFAULT_MODEL = 'gemini-2.5-flash';

// ─── API KEY MANAGEMENT ──────────────────────────────────────────────────────

export const getApiKey = () => localStorage.getItem(STORAGE_KEY) || '';
export const setApiKey = (key) => localStorage.setItem(STORAGE_KEY, key.trim());
export const hasApiKey = () => !!localStorage.getItem(STORAGE_KEY);
export const clearApiKey = () => localStorage.removeItem(STORAGE_KEY);

export const getModel = () => localStorage.getItem(MODEL_KEY) || DEFAULT_MODEL;
export const setModel = (m) => localStorage.setItem(MODEL_KEY, m);

// ─── HTML EXTRACTION ─────────────────────────────────────────────────────────

function extractHtml(text) {
  const match = text.match(/```html?\s*\n([\s\S]*?)```/);
  let html = match ? match[1].trim() : text.trim();
  // Safety net: convert any remaining markdown **bold** to <strong> tags.
  // The AI sometimes outputs **word** instead of <strong>word</strong>.
  html = html.replace(/\*\*([^*]+?)\*\*/g, '<strong>$1</strong>');
  return html;
}

// ─── GENERATE WORKBOOK (STREAMING) ───────────────────────────────────────────

export async function generateWorkbook({ systemPrompt, userPrompt, onChunk, signal }) {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error('No Gemini API key configured.');

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: getModel(),
    systemInstruction: systemPrompt,
    generationConfig: { temperature: 0.75, maxOutputTokens: 65536 },
  });

  const result = await model.generateContentStream(userPrompt);

  let accumulated = '';
  for await (const chunk of result.stream) {
    if (signal?.aborted) throw new DOMException('Generation cancelled', 'AbortError');
    const text = chunk.text();
    accumulated += text;
    if (onChunk) onChunk(accumulated);
  }

  return extractHtml(accumulated);
}

// ─── REPAIR WORKBOOK (STREAMING) ────────────────────────────────────────────

export async function repairWorkbook({ htmlContent, systemPrompt, onChunk, signal }) {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error('No Gemini API key configured.');

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: getModel(),
    systemInstruction: systemPrompt,
    generationConfig: { temperature: 0.3, maxOutputTokens: 65536 },
  });

  const userPrompt = `You are a print-layout QA engineer. The HTML workbook below has rendering defects.
Analyze every page against the MANDATORY CSS and STRUCTURAL REFERENCE provided in the system prompt.

COMMON DEFECTS TO FIX:
1. OVERFLOW: Content exceeding the 11-inch page boundary — shorten text, reduce textarea heights, or tighten spacing
2. INVISIBLE/MISSING HEADERS: <h1>, <h2>, <h3> missing or improperly styled
3. WHITESPACE GAPS: Pages missing flex-grow:1 on the last expanding element before the footer
4. FOOTER DETACHED: .page-footer not anchored to bottom — ensure parent .print-page uses display:flex; flex-direction:column and the last content element has flex-grow:1
5. MISSING CSS: If the <style> tag is absent or incomplete, inject the full MANDATORY CSS
6. PAGE 2 DUPLICATION: Page 2 must NOT have an <h1> or mission objective box
7. SHIELD-CANVAS POLLUTION: .shield-canvas must be completely empty (no child elements)
8. BOLD SYNTAX: Replace any markdown **text** with <strong>text</strong>; punctuation must sit OUTSIDE <strong> tags
9. TEXTAREA HEIGHTS: Verify correct heights per page type (Page 1: 76px, Page 2: 38px, Page 10: 76px/114px, Page 11: 128px)
10. STRUCTURAL INTEGRITY: Ensure every page has header-row, page-footer, and correct class names

RULES:
- Return the COMPLETE fixed HTML document (<!DOCTYPE html> through </html>)
- Do NOT change the pedagogical content, vocabulary words, narrative text, or educational substance
- ONLY fix layout, structure, CSS, and rendering issues
- Preserve all existing content — this is a REPAIR, not a rewrite

Here is the HTML to fix:

${htmlContent}`;

  const result = await model.generateContentStream(userPrompt);

  let accumulated = '';
  for await (const chunk of result.stream) {
    if (signal?.aborted) throw new DOMException('Repair cancelled', 'AbortError');
    const text = chunk.text();
    accumulated += text;
    if (onChunk) onChunk(accumulated);
  }

  return extractHtml(accumulated);
}

// ─── SUGGEST DAY FOCUS ──────────────────────────────────────────────────────

export async function suggestDayFocus({ unitTopic, dayNumber, previousDays, dayDirective }) {
  const apiKey = getApiKey();
  if (!apiKey) return null;

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: getModel(),
    generationConfig: { temperature: 0.4, maxOutputTokens: 100 },
  });

  const prevList = previousDays.length > 0
    ? `\nDays already covered:\n${previousDays.map(d => `- Day ${d.dayNumber}: ${d.dayFocus}`).join('\n')}`
    : '';

  const scopeContext = dayDirective
    ? `\nDay ${dayNumber} pedagogical focus: ${dayDirective}\nYour suggested title must align with this pedagogical approach while being specific to the unit topic.`
    : '';

  const prompt = `You are a PhD-level curriculum designer (Teachers College) planning an 8-day unit for high school students on "${unitTopic}".${prevList}${scopeContext}

What should Day ${dayNumber} focus on? Respond with ONLY the day focus title (3-8 words, no quotes, no explanation). Example format: The Rise of Factory Life`;

  const result = await model.generateContent(prompt);
  const text = result.response.text().trim().replace(/^["']|["']$/g, '');
  return text;
}

// ─── TEST CONNECTION ─────────────────────────────────────────────────────────

export async function testConnection() {
  try {
    const apiKey = getApiKey();
    if (!apiKey) return { ok: false, error: 'No API key provided.' };

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: getModel() });
    const result = await model.generateContent('Respond with exactly: CONNECTION_OK');
    const text = result.response.text();

    return { ok: text.includes('CONNECTION_OK'), error: text.includes('CONNECTION_OK') ? null : 'Unexpected response.' };
  } catch (err) {
    return { ok: false, error: err.message || 'Connection failed.' };
  }
}
