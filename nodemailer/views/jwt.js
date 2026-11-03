const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const secret = process.env.JWT_SECRET || crypto.randomBytes(32);
const sessions = new Map();

if (typeof secret === 'string' && Buffer.byteLength(secret, 'utf8') < 32) {
  throw new Error('JWT_SECRET must be at least 32 characters long.');
}

function createSession(email, lifetimeMs) {
  if (typeof email !== 'string' || !email || !Number.isFinite(lifetimeMs) || lifetimeMs <= 0) {
    throw new TypeError('A valid email and positive session lifetime are required.');
  }

  const expiresAt = Date.now() + lifetimeMs;
  const issuedAt = Math.floor(Date.now() / 1000);
  const expiresAtSeconds = Math.ceil(expiresAt / 1000);

  // The JWT library creates and signs the token.
  const token = jwt.sign(
    { email: email, iat: issuedAt, exp: expiresAtSeconds },
    secret,
    { algorithm: 'HS256' }
  );

  sessions.set(token, { email: email, expiresAt: expiresAt });
  return token;
}

function getSession(token) {
  if (typeof token !== 'string' || !sessions.has(token)) {
    return null;
  }

  try {
    const tokenData = jwt.verify(token, secret, { algorithms: ['HS256'] });
    const session = sessions.get(token);

    if (
      typeof tokenData === 'string' ||
      tokenData.email !== session.email ||
      session.expiresAt <= Date.now()
    ) {
      sessions.delete(token);
      return null;
    }

    return session;
  } catch (error) {
    // An invalid or expired token is not an active session.
    sessions.delete(token);
    return null;
  }
}

function deleteSession(token) {
  if (typeof token === 'string') {
    sessions.delete(token);
  }
}

function clearSessions() {
  sessions.clear();
}

module.exports = {clearSessions: clearSessions,createSession: createSession,deleteSession: deleteSession,getSession: getSession,
};
