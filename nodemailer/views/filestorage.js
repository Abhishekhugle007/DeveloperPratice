const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const AUTH_STORE_PATH = path.join(__dirname, '.auth-store.json');
const ACCOUNTS_STORE_PATH = path.join(__dirname, '.accounts.json');
const loginEmail = (process.env.APP_LOGIN_EMAIL || '').trim().toLowerCase();
const loginPassword = process.env.APP_LOGIN_PASSWORD || '';
const accounts = loadAccounts();

function loadAccounts() {
  const loadedAccounts = {};
  if (fs.existsSync(ACCOUNTS_STORE_PATH)) {
    const storedAccounts = JSON.parse(fs.readFileSync(ACCOUNTS_STORE_PATH, 'utf8'));
    if (!storedAccounts || typeof storedAccounts !== 'object' || Array.isArray(storedAccounts)) {
      throw new Error('The saved account data is invalid.');
    }

    const emails = Object.keys(storedAccounts);
    for (let i = 0; i < emails.length; i++) {
      const email = emails[i];
      const record = storedAccounts[email];

      if (!isValidEmail(email) || !isValidPasswordRecord(record)) {
        throw new Error('The saved account data contains an invalid account record.');
      }

      loadedAccounts[email] = Object.assign({}, record, {
        verified: record.verified !== false,
      });
    }
  }

  if (loginEmail && !loadedAccounts[loginEmail]) {
    const legacyRecord = loadLegacyPasswordRecord();
    const passwordRecord = legacyRecord || createPasswordRecord(loginPassword);

    loadedAccounts[loginEmail] = Object.assign({}, passwordRecord, {
      verified: true,
    });
  }

  return loadedAccounts;
}

function loadLegacyPasswordRecord() {
  if (!fs.existsSync(AUTH_STORE_PATH)) {
    return null;
  }

  const record = JSON.parse(fs.readFileSync(AUTH_STORE_PATH, 'utf8'));
  if (record.email !== loginEmail || !isValidPasswordRecord(record)) {
    throw new Error('The saved legacy password data is invalid or does not match APP_LOGIN_EMAIL.');
  }

  return { salt: record.salt, hash: record.hash };
}

function isValidPasswordRecord(record) {
  return Boolean(
    record &&
    typeof record.salt === 'string' &&
    /^[a-f0-9]{32}$/i.test(record.salt) &&
    typeof record.hash === 'string' &&
    /^[a-f0-9]{128}$/i.test(record.hash)
  );
}

function createPasswordRecord(password) {
  const salt = crypto.randomBytes(16);
  return {
    salt: salt.toString('hex'),
    hash: crypto.scryptSync(password, salt, 64).toString('hex'),
  };
}

function passwordMatches(record, password) {
  const salt = Buffer.from(record.salt, 'hex');
  const expected = Buffer.from(record.hash, 'hex');
  const actual = crypto.scryptSync(password, salt, expected.length);
  return crypto.timingSafeEqual(expected, actual);
}

function saveAccounts() {
  const temporaryPath = `${ACCOUNTS_STORE_PATH}.tmp`;
  try {
    fs.writeFileSync(temporaryPath, JSON.stringify(accounts), { mode: 0o600 });
    fs.renameSync(temporaryPath, ACCOUNTS_STORE_PATH);
  } catch (error) {
    if (fs.existsSync(temporaryPath)) {
      try {
        fs.unlinkSync(temporaryPath);
      } catch (cleanupError) {
        console.error('Failed to remove temporary account data:', cleanupError);
      }
    }
    throw error;
  }
}

function isValidEmail(email) {
  return typeof email === 'string' &&
    email.length <= 254 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

module.exports = {
  accounts,
  createPasswordRecord,
  isValidEmail,
  passwordMatches,
  saveAccounts,
};
