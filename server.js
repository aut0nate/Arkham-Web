const express = require('express');
const path = require('path');
const fsp = require('fs').promises;
const { auth, requiresAuth, handleLogin, handleLogout, handleCallback } = require('express-openid-connect');

const PORT = process.env.PORT || 3000;
const ROOT_DIR = __dirname;
const DATA_DIR = path.join(ROOT_DIR, 'data');
const SUBMISSION_FILE = path.join(DATA_DIR, 'contact_submissions.json');

const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean);

const defaultOrigin = process.env.AUTH0_BASE_URL || process.env.BASE_URL || `http://localhost:${PORT}`;

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

function dynamicCors(req, res, next) {
  const origin = req.headers.origin || '';
  const hostHeader = req.headers.host || '';
  const hostOrigin = hostHeader ? `http://${hostHeader}` : '';
  const permitted = allowedOrigins.length ? allowedOrigins : [origin, hostOrigin, defaultOrigin].filter(Boolean);

  if (origin && allowedOrigins.length && !permitted.includes(origin)) {
    return res.status(403).json({ error: 'Origin not allowed' });
  }

  const allowOrigin = origin || permitted[0] || defaultOrigin;
  res.setHeader('Access-Control-Allow-Origin', allowOrigin);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Requested-With');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Max-Age', '86400');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }

  next();
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

function mapStaticContentTypes(res, filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const contentType = mimeTypes[ext] || 'application/octet-stream';
  res.setHeader('Content-Type', contentType);
}

const app = express();
app.use(express.json());

const authConfig = {
  authRequired: false,
  auth0Logout: true,
  issuerBaseURL: process.env.AUTH0_DOMAIN ? `https://${process.env.AUTH0_DOMAIN}` : undefined,
  baseURL: defaultOrigin,
  clientID: process.env.AUTH0_CLIENT_ID,
  secret: process.env.AUTH0_CLIENT_SECRET,
  session: {
    name: 'arkham.sid'
  },
  authorizationParams: {
    response_type: 'code',
    scope: 'openid profile email'
  }
};

app.use(auth(authConfig));

app.get(
  '/login',
  handleLogin((req) => {
    const connection = process.env.AUTH0_ENTRA_CONNECTION;
    const returnTo = req.query.returnTo || '/';
    const authorizationParams = connection ? { connection } : undefined;

    return {
      returnTo,
      authorizationParams
    };
  })
);

app.get('/callback', handleCallback());
app.get('/logout', handleLogout());

app.post('/api/contact', dynamicCors, async (req, res) => {
  if (req.headers['x-requested-with'] !== 'XMLHttpRequest') {
    return res.status(400).json({ error: 'Invalid submission source.' });
  }

  const validation = validatePayload(req.body || {});
  if (!validation.isValid) {
    return res.status(400).json({ error: 'Validation failed', details: validation.errors });
  }

  const submission = {
    ...validation.payload,
    submittedAt: new Date().toISOString(),
    ip: req.socket.remoteAddress
  };

  try {
    await saveSubmission(submission);
    res.json({ success: true });
  } catch (err) {
    console.error('Error saving submission', err);
    res.status(500).json({ error: 'Unable to save your request at this time.' });
  }
});

app.get('/api/profile', dynamicCors, requiresAuth(), (req, res) => {
  const user = req.oidc.user || req.oidc.idTokenClaims || {};
  res.json({
    user,
    idTokenClaims: req.oidc.idTokenClaims || null
  });
});

app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'Not found' });
  }
  next();
});

app.use(
  express.static(ROOT_DIR, {
    setHeaders: (res, filePath) => mapStaticContentTypes(res, filePath)
  })
);

app.get('*', (req, res) => {
  res.sendFile(path.join(ROOT_DIR, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
