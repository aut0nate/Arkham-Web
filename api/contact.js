const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^[+]?[-() \d]{7,20}$/;
const MESSAGE_LIMITS = { min: 20, max: 1500 };

function sendJson(res, statusCode, payload) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(payload));
}

function normalizeBody(body) {
  if (!body) return {};
  if (typeof body === 'object') return body;
  try {
    return JSON.parse(body);
  } catch (err) {
    return {};
  }
}

async function parseRequestBody(req) {
  return new Promise((resolve) => {
    let data = '';
    req.on('data', (chunk) => {
      data += chunk;
    });
    req.on('end', () => {
      resolve(normalizeBody(data || req.body));
    });
  });
}

function validate(payload) {
  const errors = {};
  const name = (payload.name || '').trim();
  const email = (payload.email || '').trim();
  const company = (payload.company || '').trim();
  const phone = (payload.phone || '').trim();
  const message = (payload.message || '').trim();
  const consent = Boolean(payload.consent);

  if (!name) {
    errors.name = 'Full name is required.';
  } else if (name.length < 2 || name.length > 80) {
    errors.name = 'Name must be between 2 and 80 characters.';
  }

  if (!email) {
    errors.email = 'Work email is required.';
  } else if (!EMAIL_PATTERN.test(email) || email.length > 254) {
    errors.email = 'Enter a valid work email address.';
  }

  if (company.length > 120) {
    errors.company = 'Company must be 120 characters or fewer.';
  }

  if (phone) {
    if (!PHONE_PATTERN.test(phone) || phone.length < 7 || phone.length > 20) {
      errors.phone = 'Enter a valid phone number (7-20 digits/symbols).';
    }
  }

  if (!message) {
    errors.message = 'Project details are required.';
  } else if (message.length < MESSAGE_LIMITS.min || message.length > MESSAGE_LIMITS.max) {
    errors.message = 'Project details must be between 20 and 1500 characters.';
  }

  if (!consent) {
    errors.consent = 'Consent is required to submit this form.';
  }

  return errors;
}

module.exports = async function (req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return sendJson(res, 405, { message: 'Method not allowed. Use POST.' });
  }

  const payload = await parseRequestBody(req);
  const errors = validate(payload);

  if (Object.keys(errors).length > 0) {
    return sendJson(res, 400, {
      message: 'Validation failed. Please correct the highlighted fields.',
      errors,
    });
  }

  return sendJson(res, 200, {
    message: 'Submission accepted.',
  });
};
