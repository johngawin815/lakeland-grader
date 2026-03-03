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

// ─── REPAIR WORKBOOK (DETERMINISTIC DOM FIXES) ─────────────────────────────

export function repairWorkbook(htmlContent, mandatoryCss) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlContent, 'text/html');
  const fixes = [];

  // ── 1. CSS — ALWAYS force-replace with the canonical Print Engine CSS ─────
  // The AI frequently generates subtly broken CSS (wrong heights, missing rules,
  // altered overflow). Unconditionally replacing guarantees correct rendering.
  let styleTag = doc.querySelector('style');
  if (!styleTag) {
    styleTag = doc.createElement('style');
    doc.head.appendChild(styleTag);
    fixes.push('Added missing <style> tag');
  }
  const prevCss = styleTag.textContent;
  // Append repair-specific overrides after the base CSS
  const repairOverrides = `
/* ── REPAIR OVERRIDES ── */
.print-page {
  display: flex !important;
  flex-direction: column !important;
  width: 8.5in !important;
  height: 11in !important;
  overflow: hidden !important;
  box-sizing: border-box !important;
  position: relative !important;
}
.page-footer {
  flex-shrink: 0 !important;
  margin-top: auto !important;
}
.header-row {
  flex-shrink: 0 !important;
}
`;
  styleTag.textContent = mandatoryCss + repairOverrides;
  if (prevCss !== styleTag.textContent) {
    fixes.push('Replaced CSS with canonical Print Engine + repair overrides');
  }

  // ── 2. PAGE STRUCTURE — enforce flex column on every page ─────────────────
  const pages = doc.querySelectorAll('.print-page');
  pages.forEach((page, i) => {
    // Remove any inline styles that might conflict with CSS
    page.style.removeProperty('position');
    page.style.removeProperty('display');
    page.style.removeProperty('flex-direction');
    page.style.removeProperty('height');
    page.style.removeProperty('overflow');

    // ── 3. FOOTER ANCHORING ─────────────────────────────────────────────────
    const footer = page.querySelector('.page-footer');
    if (footer) {
      // Remove stale inline margin-top that might override auto
      footer.style.removeProperty('margin-top');
      footer.style.removeProperty('flex-shrink');
    }

    // ── 4. HEADER-ROW — ensure it exists ────────────────────────────────────
    const headerRow = page.querySelector('.header-row');
    if (!headerRow) {
      const hr = doc.createElement('div');
      hr.className = 'header-row';
      hr.innerHTML = '<span>STUDENT: ______________________________</span><span>Page ' + (i + 1) + ' of 11</span>';
      page.insertBefore(hr, page.firstChild);
      fixes.push('Page ' + (i + 1) + ': Added missing header-row');
    }

    // ── 5. MISSING FOOTER — add if absent ───────────────────────────────────
    if (!footer) {
      const ft = doc.createElement('div');
      ft.className = 'page-footer';
      ft.innerHTML = '<span></span><span></span><span>Page ' + (i + 1) + ' of 11</span>';
      page.appendChild(ft);
      fixes.push('Page ' + (i + 1) + ': Added missing page-footer');
    }
  });

  // ── 6. PAGE 2 — remove <h1> and mission objective box if present ──────────
  const page2 = pages[1];
  if (page2) {
    const h1 = page2.querySelector('h1');
    if (h1) {
      h1.remove();
      fixes.push('Page 2: Removed duplicate h1 title');
    }
    // Remove mission objective box (any div containing MISSION OBJECTIVE)
    page2.querySelectorAll('div').forEach(div => {
      if (div.classList.contains('header-row') || div.classList.contains('page-footer') ||
          div.classList.contains('vocab-grid') || div.classList.contains('vocab-item')) return;
      if (div.textContent.includes('MISSION OBJECTIVE')) {
        div.remove();
        fixes.push('Page 2: Removed duplicate mission objective box');
      }
    });
  }

  // ── 7. SHIELD-CANVAS — clear any child content ────────────────────────────
  doc.querySelectorAll('.shield-canvas').forEach(canvas => {
    if (canvas.childNodes.length > 0) {
      canvas.innerHTML = '';
      fixes.push('Cleared shield-canvas child elements');
    }
  });

  // ── 8. BOLD SYNTAX — convert markdown **text** to <strong> ────────────────
  const walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT);
  const textNodes = [];
  let node;
  while ((node = walker.nextNode())) textNodes.push(node);
  textNodes.forEach(tn => {
    if (/\*\*[^*]+\*\*/.test(tn.textContent)) {
      const span = doc.createElement('span');
      span.innerHTML = tn.textContent.replace(/\*\*([^*]+?)\*\*/g, '<strong>$1</strong>');
      tn.parentNode.replaceChild(span, tn);
      fixes.push('Converted markdown bold to <strong>');
    }
  });

  // ── 9. TEXTAREA HEIGHTS — enforce correct sizes by page position ──────────
  pages.forEach((page, i) => {
    const textareas = page.querySelectorAll('textarea.ruled-input');
    if (i === 0) {
      textareas.forEach(ta => { ta.style.height = '76px'; });
    } else if (i === 1) {
      textareas.forEach(ta => { ta.style.height = '38px'; });
    }
    if (i === 10) {
      textareas.forEach(ta => {
        if (!ta.style.height || parseInt(ta.style.height) > 128) {
          ta.style.height = '128px';
        }
      });
    }
  });

  // ── 10. INVISIBLE HEADERS ─────────────────────────────────────────────────
  doc.querySelectorAll('h1, h2, h3').forEach(h => {
    if (h.style.display === 'none' || h.style.visibility === 'hidden' || h.style.opacity === '0') {
      h.style.removeProperty('display');
      h.style.removeProperty('visibility');
      h.style.removeProperty('opacity');
      fixes.push('Fixed hidden ' + h.tagName.toLowerCase() + ': "' + h.textContent.substring(0, 40) + '"');
    }
    const c = h.style.color;
    if (c === '#fff' || c === 'white' || c === '#ffffff' || c === 'rgb(255, 255, 255)') {
      h.style.removeProperty('color');
      fixes.push('Fixed white-on-white ' + h.tagName.toLowerCase());
    }
  });

  // ── 11. WHITESPACE — flex-grow on expandable containers ───────────────────
  doc.querySelectorAll('.vocab-grid').forEach(vg => { vg.style.flexGrow = '1'; });
  doc.querySelectorAll('.checkpoint-box').forEach(cb => { cb.style.flexGrow = '1'; });
  doc.querySelectorAll('.shield-canvas').forEach(sc => { sc.style.flexGrow = '1'; });

  // ── SERIALIZE — use outerHTML (NOT XMLSerializer) to avoid XHTML damage ───
  // XMLSerializer turns <textarea></textarea> into <textarea/> which browsers
  // interpret as an unclosed tag, destroying everything after it.
  let result = '<!DOCTYPE html>\n' + doc.documentElement.outerHTML;

  return { html: result, fixes };
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
