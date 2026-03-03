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

  // 1. CSS INJECTION — ensure the mandatory CSS is present and complete
  let styleTag = doc.querySelector('style');
  if (!styleTag) {
    styleTag = doc.createElement('style');
    (doc.head || doc.documentElement).appendChild(styleTag);
  }
  if (!styleTag.textContent.includes('MIT PRINT ENGINE')) {
    styleTag.textContent = mandatoryCss;
    fixes.push('Injected mandatory Print Engine CSS');
  }

  // 2. PAGE STRUCTURE — ensure every .print-page has flex column layout
  const pages = doc.querySelectorAll('.print-page');
  pages.forEach((page, i) => {
    if (!page.style.display || page.style.display !== 'flex') {
      page.style.display = 'flex';
      page.style.flexDirection = 'column';
    }
    if (!page.style.height) page.style.height = '11in';
    if (!page.style.overflow) page.style.overflow = 'hidden';

    // 3. FOOTER ANCHORING — ensure page-footer exists and last content element has flex-grow
    const footer = page.querySelector('.page-footer');
    if (footer) {
      footer.style.flexShrink = '0';
      footer.style.marginTop = 'auto';
      // Find the content element right before the footer and give it flex-grow
      const prev = footer.previousElementSibling;
      if (prev && !prev.classList.contains('page-footer')) {
        const tagName = prev.tagName.toLowerCase();
        const growable = ['div', 'textarea', 'section'];
        if (growable.includes(tagName) || prev.classList.contains('checkpoint-box') ||
            prev.classList.contains('vocab-grid') || prev.classList.contains('law-block') ||
            prev.classList.contains('shield-canvas') || prev.querySelector('textarea')) {
          prev.style.flexGrow = '1';
        }
      }
    }

    // 4. HEADER-ROW — ensure it exists
    const headerRow = page.querySelector('.header-row');
    if (!headerRow) {
      const hr = doc.createElement('div');
      hr.className = 'header-row';
      hr.innerHTML = '<span>STUDENT: ______________________________</span><span>Page ' + (i + 1) + ' of 11</span>';
      page.insertBefore(hr, page.firstChild);
      fixes.push(`Page ${i + 1}: Added missing header-row`);
    }

    // 5. MISSING FOOTER — add if absent
    if (!footer) {
      const ft = doc.createElement('div');
      ft.className = 'page-footer';
      ft.innerHTML = '<span></span><span></span><span>Page ' + (i + 1) + ' of 11</span>';
      page.appendChild(ft);
      fixes.push(`Page ${i + 1}: Added missing page-footer`);
    }
  });

  // 6. PAGE 2 — remove <h1> and mission objective box if present
  const page2 = pages[1];
  if (page2) {
    const h1 = page2.querySelector('h1');
    if (h1) {
      h1.remove();
      fixes.push('Page 2: Removed duplicate h1 title');
    }
    // Remove mission objective box (div with background #eee containing MISSION)
    page2.querySelectorAll('div').forEach(div => {
      if (div.textContent.includes('MISSION OBJECTIVE') &&
          div.style.background?.includes('eee')) {
        div.remove();
        fixes.push('Page 2: Removed duplicate mission objective box');
      }
    });
  }

  // 7. SHIELD-CANVAS — clear any child content
  doc.querySelectorAll('.shield-canvas').forEach(canvas => {
    if (canvas.childNodes.length > 0) {
      canvas.innerHTML = '';
      fixes.push('Cleared shield-canvas child elements');
    }
  });

  // 8. BOLD SYNTAX — convert remaining markdown **text** to <strong>
  const body = doc.body;
  const walker = doc.createTreeWalker(body, NodeFilter.SHOW_TEXT);
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

  // 9. TEXTAREA HEIGHTS — enforce correct sizes by page position
  pages.forEach((page, i) => {
    const textareas = page.querySelectorAll('textarea.ruled-input');
    if (i === 0) {
      // Page 1: vocab textareas = 76px
      textareas.forEach(ta => { ta.style.height = '76px'; });
    } else if (i === 1) {
      // Page 2: vocab textareas = 38px
      textareas.forEach(ta => { ta.style.height = '38px'; });
    }
    // Pages 3-8: checkpoint textareas keep flex-grow (no forced height)
    // Page 10: heights set inline by generator (76px, 114px) — leave as-is
    // Page 11: reflection textareas = 128px
    if (i === 10) {
      textareas.forEach(ta => {
        if (!ta.style.height || parseInt(ta.style.height) > 128) {
          ta.style.height = '128px';
        }
      });
    }
  });

  // 10. INVISIBLE HEADERS — ensure h1/h2/h3 have proper display
  doc.querySelectorAll('h1, h2, h3').forEach(h => {
    if (h.style.display === 'none' || h.style.visibility === 'hidden' || h.style.opacity === '0') {
      h.style.display = '';
      h.style.visibility = '';
      h.style.opacity = '';
      fixes.push(`Fixed hidden ${h.tagName.toLowerCase()}: "${h.textContent.substring(0, 40)}"`);
    }
    if (h.style.color === '#fff' || h.style.color === 'white' || h.style.color === '#ffffff') {
      h.style.color = '';
      fixes.push(`Fixed white-on-white ${h.tagName.toLowerCase()}`);
    }
  });

  // 11. WHITESPACE — ensure any vocab-grid, law-block containers, checkpoint-box have flex-grow
  doc.querySelectorAll('.vocab-grid').forEach(vg => { vg.style.flexGrow = '1'; });
  doc.querySelectorAll('.checkpoint-box').forEach(cb => { cb.style.flexGrow = '1'; });
  doc.querySelectorAll('.shield-canvas').forEach(sc => { sc.style.flexGrow = '1'; });

  // Serialize back to full HTML string
  const serializer = new XMLSerializer();
  let result = serializer.serializeToString(doc);

  // XMLSerializer outputs XHTML — convert back to HTML5
  result = result.replace(/ xmlns="[^"]*"/g, '');
  // Ensure DOCTYPE
  if (!result.trimStart().startsWith('<!DOCTYPE')) {
    result = '<!DOCTYPE html>\n' + result;
  }

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
