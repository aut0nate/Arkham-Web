const http = require('http');
const fs = require('fs');
const fsp = require('fs').promises;
const path = require('path');
const url = require('url');

const PORT = process.env.PORT || 3000;
const ROOT_DIR = __dirname;
const DATA_DIR = path.join(ROOT_DIR, 'data');
const SUBMISSION_FILE = path.join(DATA_DIR, 'contact_submissions.json');

const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean);

const defaultOrigin = `http://localhost:${PORT}`;

const auth0Config = {
  domain: process.env.AUTH0_DOMAIN || '',
  clientId: process.env.AUTH0_CLIENT_ID || '',
  audience: process.env.AUTH0_AUDIENCE || ''
};

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.json': 'application/json',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf'
};

function setCorsHeaders(res, origin, hostHeader) {
  const hostOrigin = hostHeader ? `http://${hostHeader}` : '';
  const permitted = allowedOrigins.length
    ? allowedOrigins
    : [origin, hostOrigin, defaultOrigin].filter(Boolean);

  if (origin && allowedOrigins.length && !permitted.includes(origin)) {
    return false;
  }

  const allowOrigin = origin || permitted[0] || defaultOrigin;
  res.setHeader('Access-Control-Allow-Origin', allowOrigin);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Requested-With');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Max-Age', '86400');
  return true;
}

function sendJson(res, statusCode, payload, origin, hostHeader) {
  res.statusCode = statusCode;
  setCorsHeaders(res, origin, hostHeader);
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(payload));
}

function handleAuthConfig(req, res, origin, hostHeader) {
  if (!setCorsHeaders(res, origin, hostHeader)) {
    sendJson(res, 403, { error: 'Origin not allowed' });
    return;
  }

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  if (req.method !== 'GET') {
    sendJson(res, 405, { error: 'Method not allowed' }, origin, hostHeader);
    return;
  }

  if (!auth0Config.domain || !auth0Config.clientId) {
    sendJson(
      res,
      500,
      {
        error: 'Auth0 configuration is missing',
        details: 'Set AUTH0_DOMAIN and AUTH0_CLIENT_ID environment variables to enable authentication.'
      },
      origin,
      hostHeader
    );
    return;
  }

  sendJson(res, 200, auth0Config, origin, hostHeader);
}

function validatePayload(body) {
  const errors = [];
  const trimmed = (value) => (typeof value === 'string' ? value.trim() : '');

  const name = trimmed(body.name);
  const email = trimmed(body.email);
  const company = trimmed(body.company);
  const phone = trimmed(body.phone);
  const message = trimmed(body.message);
  const consent = Boolean(body.consent);

  if (!name) errors.push('Name is required.');
  if (!email) {
    errors.push('Email is required.');
  } else if (!/^\S+@\S+\.\S+$/.test(email)) {
    errors.push('Email is invalid.');
  }

  if (!message) errors.push('Project details are required.');
  if (!consent) errors.push('Consent is required.');

  return {
    isValid: errors.length === 0,
    errors,
    payload: {
      name,
      email,
      company,
      phone,
      message,
      consent
    }
  };
}

async function saveSubmission(entry) {
  await fsp.mkdir(DATA_DIR, { recursive: true });

  const submissions = await fsp
    .readFile(SUBMISSION_FILE, 'utf8')
    .then((contents) => (contents.trim() ? JSON.parse(contents) : []))
    .catch((err) => {
      if (err.code === 'ENOENT') return [];
      throw err;
    });

  submissions.push(entry);
  await fsp.writeFile(SUBMISSION_FILE, JSON.stringify(submissions, null, 2));
}

function serveStatic(req, res) {
  const parsedUrl = url.parse(req.url);
  const sanitizePath = path.normalize(parsedUrl.pathname).replace(/^\/+/, '');
  let pathname = path.join(ROOT_DIR, sanitizePath || 'index.html');

  if (!pathname.startsWith(ROOT_DIR)) {
    res.statusCode = 403;
    res.end('Access denied');
    return;
  }

  fs.stat(pathname, (err, stats) => {
    if (err) {
      res.statusCode = 404;
      res.end('Not found');
      return;
    }

    if (stats.isDirectory()) {
      pathname = path.join(pathname, 'index.html');
    }

    const ext = path.extname(pathname).toLowerCase();
    const contentType = mimeTypes[ext] || 'application/octet-stream';

    fs.readFile(pathname, (readErr, data) => {
      if (readErr) {
        res.statusCode = 500;
        res.end('Server error');
        return;
      }

      res.statusCode = 200;
      res.setHeader('Content-Type', contentType);
      res.end(data);
    });
  });
}

async function handleContact(req, res, origin, hostHeader) {
  if (!setCorsHeaders(res, origin, hostHeader)) {
    sendJson(res, 403, { error: 'Origin not allowed' });
    return;
  }

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  if (req.method !== 'POST') {
    sendJson(res, 405, { error: 'Method not allowed' }, origin, hostHeader);
    return;
  }

  if (req.headers['x-requested-with'] !== 'XMLHttpRequest') {
    sendJson(res, 400, { error: 'Invalid submission source.' }, origin, hostHeader);
    return;
  }

  let rawBody = '';
  req.on('data', (chunk) => {
    rawBody += chunk.toString();
    if (rawBody.length > 1e6) {
      req.socket.destroy();
    }
  });

  req.on('end', async () => {
    let parsed;
    try {
      parsed = JSON.parse(rawBody || '{}');
    } catch (err) {
      sendJson(res, 400, { error: 'Invalid JSON payload.' }, origin, hostHeader);
      return;
    }

    const validation = validatePayload(parsed);
    if (!validation.isValid) {
      sendJson(res, 400, { error: 'Validation failed', details: validation.errors }, origin, hostHeader);
      return;
    }

    const submission = {
      ...validation.payload,
      submittedAt: new Date().toISOString(),
      ip: req.socket.remoteAddress
    };

    try {
      await saveSubmission(submission);
      sendJson(res, 200, { success: true }, origin, hostHeader);
    } catch (err) {
      console.error('Error saving submission', err);
      sendJson(res, 500, { error: 'Unable to save your request at this time.' }, origin, hostHeader);
    }
  });
}

const server = http.createServer((req, res) => {
  if (req.url.startsWith('/api/auth/config')) {
    const origin = req.headers.origin || '';
    const hostHeader = req.headers.host || '';
    handleAuthConfig(req, res, origin, hostHeader);
    return;
  }

  if (req.url.startsWith('/api/contact')) {
    const origin = req.headers.origin || '';
    const hostHeader = req.headers.host || '';
    handleContact(req, res, origin, hostHeader);
    return;
  }

  serveStatic(req, res);
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
