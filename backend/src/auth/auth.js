const crypto = require('crypto');

const TOKEN_SECRET =
  process.env.AUTH_SECRET ||
  crypto
    .createHash('sha256')
    .update(process.env.POSTGRES_URL || process.env.DATABASE_URL || 'wedding-budget-auth-secret-v1')
    .digest('hex');

const TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

function normalizeUsername(username) {
  return String(username || '').trim().toLowerCase();
}

function validateUsername(username) {
  const clean = normalizeUsername(username);
  if (!/^[a-z0-9._-]{3,32}$/.test(clean)) {
    const err = new Error(
      'Username must be 3–32 characters (letters, numbers, ., _, or -)'
    );
    err.statusCode = 400;
    throw err;
  }
  return clean;
}

function hashSecret(value, normalize = false) {
  const input = normalize ? String(value || '').trim().toLowerCase() : String(value || '');
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(input, salt, 64).toString('hex');
  return `${salt}:${derived}`;
}

function verifySecret(value, stored, normalize = false) {
  if (!stored || !stored.includes(':')) return false;
  const [salt, hashHex] = stored.split(':');
  const input = normalize ? String(value || '').trim().toLowerCase() : String(value || '');
  const derived = crypto.scryptSync(input, salt, 64);
  const expected = Buffer.from(hashHex, 'hex');
  if (derived.length !== expected.length) return false;
  return crypto.timingSafeEqual(derived, expected);
}

function base64UrlEncode(str) {
  return Buffer.from(str, 'utf8').toString('base64url');
}

function base64UrlDecode(str) {
  return Buffer.from(str, 'base64url').toString('utf8');
}

function signToken(user) {
  const payload = {
    sub: user.id,
    username: user.username,
    displayName: user.displayName,
    exp: Date.now() + TOKEN_TTL_MS,
  };
  const encoded = base64UrlEncode(JSON.stringify(payload));
  const sig = crypto
    .createHmac('sha256', TOKEN_SECRET)
    .update(encoded)
    .digest('base64url');
  return `${encoded}.${sig}`;
}

function verifyToken(token) {
  if (!token || typeof token !== 'string' || !token.includes('.')) {
    return null;
  }
  const [encoded, sig] = token.split('.');
  const expectedSig = crypto
    .createHmac('sha256', TOKEN_SECRET)
    .update(encoded)
    .digest('base64url');

  const sigBuf = Buffer.from(sig);
  const expBuf = Buffer.from(expectedSig);
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return null;
  }

  try {
    const payload = JSON.parse(base64UrlDecode(encoded));
    if (!payload?.sub || (payload.exp && Date.now() > payload.exp)) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

module.exports = {
  normalizeUsername,
  validateUsername,
  hashSecret,
  verifySecret,
  signToken,
  verifyToken,
};
