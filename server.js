// server.js — Claude API proxy server
// Forwards requests from the React app to api.anthropic.com,
// keeping the API key out of the browser's outbound CORS requests.

const express = require('express');
const https = require('https');
const multer = require('multer');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
app.use(express.json({ limit: '50mb' }));

// SECURITY PILLAR IV: Zero-Retention (Keep file strictly in RAM, never write to disk)
const upload = multer({ storage: multer.memoryStorage() });

app.post('/api/claude/messages', (req, res) => {
  const apiKey = req.headers['x-forwarded-api-key'];
  if (!apiKey) {
    return res.status(401).json({ error: 'No API key provided.' });
  }

  const body = JSON.stringify(req.body);

  const options = {
    hostname: 'api.anthropic.com',
    path: '/v1/messages',
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
      'content-length': Buffer.byteLength(body),
    },
  };

  const proxyReq = https.request(options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, {
      'Content-Type': proxyRes.headers['content-type'] || 'text/event-stream',
    });
    proxyRes.pipe(res);
  });

  proxyReq.on('error', (err) => {
    if (!res.headersSent) {
      res.status(502).json({ error: err.message });
    }
  });

  proxyReq.write(body);
  proxyReq.end();
});

app.post('/api/transcript/extract', upload.single('transcript'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No transcript file provided.' });
    }

    // Expecting API key to be securely configured on the server
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
       console.error('CRITICAL: Server GEMINI_API_KEY configuration is missing.');
       return res.status(500).json({ error: 'Server AI configuration missing.' });
    }
    
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `You are a transcript parser. Extract ALL courses from this high school transcript image or PDF.

Return ONLY a valid JSON array — no markdown, no explanation. Each object must have:
  courseName  (string)
  term        (string — e.g. "Sem 1", "Q1", "Year", "Fall 2023")
  letterGrade (string — e.g. "A", "B+", "C", "F", or "" if missing)
  credits     (number — 0.25 for quarter, 0.5 for semester, 1.0 for full year; estimate if not shown)
  subjectArea (one of exactly: "English", "Math", "Science", "Social Studies", "Elective")

If the grade is missing, use "". Map subject areas as best you can to the five options. Output nothing other than the JSON array.`;

    const base64Data = req.file.buffer.toString('base64');
    const mimeType = req.file.mimetype;

    const result = await model.generateContent([
      prompt,
      { inlineData: { mimeType, data: base64Data } },
    ]);

    const rawText = result.response.text().trim();
    const cleanedText = rawText.replace(/^```json?\s*/i, '').replace(/```\s*$/, '');
    res.json({ courses: JSON.parse(cleanedText) });
  } catch (error) {
    console.error('Secure OCR extraction failed:', error);
    res.status(500).json({ error: 'Failed to process transcript securely.' });
  }
});

const PORT = process.env.PROXY_PORT || 3001;
app.listen(PORT, () => {
  console.log(`Claude proxy server running on http://localhost:${PORT}`);
});
