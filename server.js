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

function validatePayload(body) {
  const errors = {};
  const trimmed = (value) => (typeof value === 'string' ? value.trim() : '');

  const name = trimmed(body.name);
  const email = trimmed(body.email);
  const company = trimmed(body.company);
  const phone = trimmed(body.phone);
  const message = trimmed(body.message);
  const consent = Boolean(body.consent);

  if (!name) {
    errors.name = 'Full name is required.';
  } else if (name.length < 2 || name.length > 80) {
    errors.name = 'Full name must be between 2 and 80 characters.';
  }

  if (!email) {
    errors.email = 'Work email is required.';
  } else if (!/^\S+@\S+\.\S+$/.test(email)) {
    errors.email = 'Enter a valid work email address.';
  } else if (email.length > 254) {
    errors.email = 'Work email must be 254 characters or fewer.';
  }

  if (company.length > 120) {
    errors.company = 'Company must be 120 characters or fewer.';
  }

  if (phone && (!/^[+]?[-() \d]{7,20}$/.test(phone) || phone.length < 7 || phone.length > 20)) {
    errors.phone = 'Enter a valid phone number.';
  }

  if (!message) {
    errors.message = 'Project details are required.';
  } else if (message.length < 20 || message.length > 1500) {
    errors.message = 'Project details must be between 20 and 1500 characters.';
  }

  if (!consent) {
    errors.consent = 'Consent is required to submit this form.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
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

const authEnabled = Boolean(process.env.AUTH0_DOMAIN && process.env.AUTH0_CLIENT_ID && process.env.AUTH0_CLIENT_SECRET);
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

if (authEnabled) {
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
}

app.get('/api/auth/config', dynamicCors, (req, res) => {
  if (!authEnabled) {
    return res.status(503).json({
      error: 'Auth0 configuration is not enabled',
      details: 'Set AUTH0_DOMAIN, AUTH0_CLIENT_ID, and AUTH0_CLIENT_SECRET to enable authentication.'
    });
  }

  res.json(auth0Config);
});

app.post('/api/contact', dynamicCors, async (req, res) => {
  if (req.headers['x-requested-with'] !== 'XMLHttpRequest') {
    return res.status(400).json({ error: 'Invalid submission source.' });
  }

  const validation = validatePayload(req.body || {});
  if (!validation.isValid) {
    return res.status(400).json({
      error: 'Validation failed',
      errors: validation.errors,
      details: validation.errors
    });
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

if (authEnabled) {
  app.get('/api/profile', dynamicCors, requiresAuth(), (req, res) => {
    const user = req.oidc.user || req.oidc.idTokenClaims || {};
    res.json({
      user,
      idTokenClaims: req.oidc.idTokenClaims || null
    });
  });
} else {
  app.get('/api/profile', dynamicCors, (req, res) => {
    res.status(503).json({ error: 'Authentication is not enabled.' });
  });
}

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
