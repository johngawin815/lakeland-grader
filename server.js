// server.js — Claude API proxy server
// Forwards requests from the React app to api.anthropic.com,
// keeping the API key out of the browser's outbound CORS requests.

const express = require('express');
const https = require('https');

const app = express();
app.use(express.json({ limit: '50mb' }));

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

const PORT = process.env.PROXY_PORT || 3001;
app.listen(PORT, () => {
  console.log(`Claude proxy server running on http://localhost:${PORT}`);
});
