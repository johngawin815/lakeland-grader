import { GoogleGenerativeAI } from '@google/generative-ai';
import { z } from 'zod';

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

// ─── ZOD SCHEMAS ─────────────────────────────────────────────────────────────

export const WorkbookSchema = z.object({
  tier: z.string(),
  teacher_key: z.object({
    expected_answers: z.array(z.string()),
    grading_rubric_notes: z.string()
  }),
  student_workbook: z.object({
    reading_passage_blocks: z.array(z.object({
      text: z.string(),
      bold_vocab_words: z.array(z.string())
    })),
    tasks: z.array(z.object({
      dok_level: z.number(),
      prompt: z.string(),
      sentence_starter_scaffold: z.string().optional().nullable()
    }))
  })
});

export const BatchWorkbookSchema = z.object({
  workbooks: z.array(WorkbookSchema)
});

// ─── GENERATE WORKBOOK (JSON) ────────────────────────────────────────────────

export async function generateWorkbook({ systemPrompt, userPrompt, onProgress, signal }) {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error('No Gemini API key configured.');

  if (onProgress) onProgress('Connecting to Gemini API...');

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: getModel(),
    systemInstruction: systemPrompt,
    generationConfig: { 
      temperature: 0.75, 
      maxOutputTokens: 65536,
      responseMimeType: "application/json"
    },
  });

  if (onProgress) onProgress('Generating JSON workload across Tiers (30-60s)...');

  const enrichedPrompt = userPrompt + '\\n\\nCRITICAL: You MUST respond in pure JSON matching the EXACT schema layout below. Do NOT use markdown code blocks.\\n```json\\n{ "workbooks": [ { "tier": "Tier 1", "teacher_key": { "expected_answers": ["string"], "grading_rubric_notes": "string" }, "student_workbook": { "reading_passage_blocks": [ { "text": "string", "bold_vocab_words": ["string"] } ], "tasks": [ { "dok_level": 2, "prompt": "string", "sentence_starter_scaffold": "string (optional)" } ] } } ] }\\n```\\n';

  const result = await model.generateContentStream(enrichedPrompt);

  let accumulated = '';
  for await (const chunk of result.stream) {
    if (signal?.aborted) throw new DOMException('Generation cancelled', 'AbortError');
    accumulated += chunk.text();
    if (onProgress) onProgress(accumulated);
  }

  if (onProgress) onProgress(accumulated + '\\n\\n[SYSTEM]: Validating Schema with Zod...');
  
  try {
    const cleanJson = accumulated.replace(/\`\`\`(json)?/gi, '').trim();
    const parsed = JSON.parse(cleanJson);
    const validated = BatchWorkbookSchema.parse(parsed);
    if (onProgress) onProgress('Rendering PDF...');
    return validated;
  } catch (err) {
    console.error("Zod Validation Error:", err, "\\nRaw Text:", accumulated);
    throw new Error('Failed to validate generated JSON data structure.');
  }
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
