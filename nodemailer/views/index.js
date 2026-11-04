const express = require('express');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');
const Mail = require('./mail');

require('dotenv').config({ path: path.join(__dirname, '.env') });

const fileStorage = require('./filestorage');
const otpStores = require('./OTPstorage');
const jwt = require('./jwt');

const app = express();
const PORT = Number(process.env.PORT) || 8000;
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const IMAGE_DIR = path.join(__dirname, '..', 'images');
const LOGO_PATH = path.join(IMAGE_DIR, 'company-logo.png');
const AUTH_PAGE_PATH = path.join(__dirname, 'auth.html');
const SESSION_TTL_MS = 8 * 60 * 60 * 1000;
const OTP_TTL_MS = 10 * 60 * 1000;
const MAX_OTP_ATTEMPTS = 5;

app.use(express.json({ limit: '7mb' }));
app.use(express.urlencoded({ extended: false }));
app.use('/images', express.static(IMAGE_DIR));

const parseCookies = (req, res, next) => {
  req.cookies = {};
  const rawCookies = req.headers.cookie;

  if (typeof rawCookies === 'string') {
    const cookieList = rawCookies.split(';');
    for (let i = 0; i < cookieList.length; i++) {
      const cookieParts = cookieList[i].trim().split('=');
      const name = cookieParts[0];
      const value = cookieParts.slice(1).join('=');

      if (!name) {
        continue;
      }

      try {
        req.cookies[name] = decodeURIComponent(value);
      } catch (error) {
        req.cookies[name] = '';
      }
    }
  }

  next();
};

app.use(parseCookies);

function getSession(req) {
  const token = req.cookies.session;
  return jwt.getSession(token);
}

app.get('/', (req, res) => {
  if (getSession(req)) {
    return res.redirect('/dashboard');
  }
  return res.redirect('/login');
});

app.get('/test', (req, res) => {
  res.sendFile(path.join(__dirname, 'test.html'));
});

app.get('/health', (req, res) => {
  res.json({ ok: true, status: 'running' });
});

app.get('/login', (req, res) => {
  if (getSession(req)) {
    return res.redirect('/dashboard');
  }
  return res.sendFile(AUTH_PAGE_PATH);
});

app.post('/login', (req, res) => {
  const email = req.body && req.body.email;
  const password = req.body && req.body.password;

  if (typeof email !== 'string' || typeof password !== 'string' || !email.trim() || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required.' });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const account = fileStorage.accounts[normalizedEmail];
  if (!account || !fileStorage.passwordMatches(account, password))
    {
    return res.status(401).json({ 
    success: false, 
    message: 'Email or password is incorrect.' 
  });
  }
  if (account.verified !== true) {
    return res.status(403).json({ success: false, message: 'Verify your email address before signing in.' });
  }

  const token = jwt.createSession(normalizedEmail, SESSION_TTL_MS);
  res.cookie('session', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: req.secure,
    maxAge: SESSION_TTL_MS,
  });
  return res.json({ success: true });
});

app.post('/signup', async (req, res) => {
  const email = req.body && req.body.email;
  const password = req.body && req.body.password;
  const confirmPassword = req.body && req.body.confirmPassword;
  if (typeof email !== 'string' || !fileStorage.isValidEmail(email.trim())) {
    return res.status(400).json({ success: false, message: 'Enter a valid email address.' });
  }

  if (typeof password !== 'string' || password.length < 8 || password.length > 128) {
    return res.status(400).json({ success: false, message: 'Password must be between 8 and 128 characters.' });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({ success: false, message: 'Passwords do not match.' });
  }

  const normalizedEmail = email.trim().toLowerCase();
  if (fileStorage.accounts[normalizedEmail]) {
    return res.status(409).json({ success: false, message: 'An account with that email already exists.' });
  }

  if (!process.env.EMAIL || !process.env.PASSWORD) {
    return res.status(503).json({ success: false, message: 'Email delivery is not configured.' });
  }

  const pendingVerification = otpStores.emailVerificationStorage.get(normalizedEmail);
  if (pendingVerification && pendingVerification.resendAvailableAt > Date.now()) {
    return res.status(429).json({
      success: false,
      message: 'A verification code was already sent. Check your email or wait before requesting another.',
    });
  }

  const verificationCode = crypto.randomInt(100000, 1000000).toString();
  otpStores.emailVerificationStorage.set(normalizedEmail, {
    passwordRecord: pendingVerification
      ? pendingVerification.passwordRecord
      : fileStorage.createPasswordRecord(password),
    hash: hashOtp(verificationCode),
    expiresAt: Date.now() + OTP_TTL_MS,
    resendAvailableAt: Date.now() + 60 * 1000,
    attempts: 0,
  });

  try {
    await sendVerificationEmail(normalizedEmail, verificationCode);
  } catch (error) {
    otpStores.emailVerificationStorage.delete(normalizedEmail);
    console.error('Failed to send signup verification email:', error);
    return res.status(502).json({
      success: false,
      message: 'Could not send the verification email. Check the SMTP settings and try again.',
    });
  }

  return res.json({
    success: true,
    email: normalizedEmail,
    message: 'Verification code sent. Check your inbox and spam folder.',
  });
});

app.post('/verify-email', (req, res) => {
  const email = req.body && req.body.email;
  const otp = req.body && req.body.otp;
  const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
  const pendingVerification = otpStores.emailVerificationStorage.get(normalizedEmail);

  if (
    !pendingVerification ||
    pendingVerification.expiresAt <= Date.now() ||
    pendingVerification.attempts >= MAX_OTP_ATTEMPTS
  ) {
    otpStores.emailVerificationStorage.delete(normalizedEmail);
    return res.status(400).json({
      success: false,
      message: 'The verification code is invalid or expired. Sign up again to get a new code.',
    });
  }

  if (typeof otp !== 'string' || !safeHashMatches(pendingVerification.hash, hashOtp(otp.trim()))) {
    pendingVerification.attempts += 1;
    if (pendingVerification.attempts >= MAX_OTP_ATTEMPTS) {
      otpStores.emailVerificationStorage.delete(normalizedEmail);
    }
    return res.status(400).json({ success: false, message: 'The verification code is incorrect.' });
  }

  fileStorage.accounts[normalizedEmail] = Object.assign({}, 
  pendingVerification.passwordRecord, {
  verified: true,
  });
  try {
    fileStorage.saveAccounts();
  } catch (error) {
    delete fileStorage.accounts[normalizedEmail];
    console.error('Failed to save the verified account:', error);
    return res.status(500).json({ success: false, message: 'Could not finish account verification. Please try again.' });
  }

  otpStores.emailVerificationStorage.delete(normalizedEmail);
  const token = jwt.createSession(normalizedEmail, SESSION_TTL_MS);
  res.cookie('session', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: req.secure,
    maxAge: SESSION_TTL_MS,
  });
  return res.json({ success: true, message: 'Email verified and account created.' });
});

app.post('/resend-verification', async (req, res) => {
  const email = req.body && req.body.email;
  const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
  const pendingVerification = otpStores.emailVerificationStorage.get(normalizedEmail);

  if (!pendingVerification || pendingVerification.expiresAt <= Date.now()) {
    otpStores.emailVerificationStorage.delete(normalizedEmail);
    return res.status(400).json({
      success: false,
      message: 'No pending signup was found. Sign up again to request a verification code.',
    });
  }

  if (pendingVerification.resendAvailableAt > Date.now()) {
    return res.status(429).json({
      success: false,
      message: 'Please wait a minute before requesting another verification code.',
    });
  }

  const verificationCode = crypto.randomInt(100000, 1000000).toString();
  pendingVerification.hash = hashOtp(verificationCode);
  pendingVerification.expiresAt = Date.now() + OTP_TTL_MS;
  pendingVerification.resendAvailableAt = Date.now() + 60 * 1000;
  pendingVerification.attempts = 0;

  try {
    await sendVerificationEmail(normalizedEmail, verificationCode);
  } catch (error) {
    otpStores.emailVerificationStorage.delete(normalizedEmail);
    console.error('Failed to resend signup verification email:', error);
    return res.status(502).json({
      success: false,
      message: 'Could not send the verification email. Please sign up again later.',
    });
  }

  return res.json({ success: true, message: 'A new verification code was sent.' });
});

app.get('/logout', (req, res) => {
  const token = req.cookies.session;
  jwt.deleteSession(token);
  res.clearCookie('session');
  return res.redirect('/login');
});

app.get('/forgot-password', (req, res) => {
  return res.sendFile(AUTH_PAGE_PATH);
});

app.post('/forgot-password', async (req, res) => {
  const email = req.body && req.body.email;

  if (!email || typeof email !== 'string' || !email.trim()) {
    return res.status(400).json({ success: false, message: 'A valid email is required.' });
  }

  if (!process.env.EMAIL || !process.env.PASSWORD) {
    return res.status(503).json({ success: false, message: 'Email delivery is not configured.' });
  }

  const normalizedEmail = email.trim().toLowerCase();
  if (!fileStorage.accounts[normalizedEmail] || fileStorage.accounts[normalizedEmail].verified !== true) {
    return res.status(400).json({
      success: false,
      message: 'No verified account is registered with that email address.',
    });
  }

  const otp = crypto.randomInt(100000, 1000000).toString();
  otpStores.otpStorage.set(normalizedEmail, {
    hash: hashOtp(otp),
    expiresAt: Date.now() + OTP_TTL_MS,
    attempts: 0,
    verified: false,
  });

  const mail = new Mail();
  mail.setTo(normalizedEmail);
  mail.setSubject('Password Reset OTP');
  mail.setText(`Your password reset code is ${otp}. It expires in 10 minutes.`);
  mail.setHtml(`<p>Your password reset code is <strong>${otp}</strong>.</p><p>It expires in 10 minutes.</p>`);

  try {
    await mail.send();
  } catch (error) {
    otpStores.otpStorage.delete(normalizedEmail);
    console.error('Failed to send OTP email:', error);
    return res.status(502).json({
      success: false,
      message: 'The reset code could not be sent. Check EMAIL and PASSWORD in .env and the server log for the SMTP error.',
    });
  }

  return res.json({ success: true, message: 'Reset code sent. Check your inbox and spam folder.' });
});

app.get('/verify-otp', (req, res) => {
  return res.sendFile(AUTH_PAGE_PATH);
});

app.post('/verify-otp', (req, res) => {
  const email = req.body && req.body.email;
  const otp = req.body && req.body.otp;
  const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
  const record = otpStores.otpStorage.get(normalizedEmail);

  if (!record || record.expiresAt <= Date.now() || record.attempts >= MAX_OTP_ATTEMPTS) {
    otpStores.otpStorage.delete(normalizedEmail);
    return res.status(400).json({ success: false, message: 'The reset code is invalid or expired. Request a new code.' });
  }

  if (typeof otp !== 'string' || !safeHashMatches(record.hash, hashOtp(otp.trim()))) {
    record.attempts += 1;
    if (record.attempts >= MAX_OTP_ATTEMPTS) {
      otpStores.otpStorage.delete(normalizedEmail);
    }
    return res.status(400).json({ success: false, message: 'The reset code is incorrect or expired.' });
  }

  record.verified = true;
  return res.json({ success: true, message: 'Code verified. Choose a new password.' });
});

app.post('/reset-password', (req, res) => {
  const email = req.body && req.body.email;
  const password = req.body && req.body.password;
  const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
  const record = otpStores.otpStorage.get(normalizedEmail);

  if (!record || !record.verified || record.expiresAt <= Date.now()) {
    return res.status(400).json({ success: false, message: 'Verify a current reset code before changing the password.' });
  }

  if (typeof password !== 'string' || password.length < 8 || password.length > 128) {
    return res.status(400).json({ success: false, message: 'The new password must be between 8 and 128 characters.' });
  }

  const previousAccount = fileStorage.accounts[normalizedEmail];
  fileStorage.accounts[normalizedEmail] = Object.assign(
    {},
    fileStorage.createPasswordRecord(password),
    { verified: true }
  );
  try {
    fileStorage.saveAccounts();
  } catch (error) {
    fileStorage.accounts[normalizedEmail] = previousAccount;
    console.error('Failed to save the updated password:', error);
    return res.status(500).json({ success: false, message: 'Failed to save the new password. Please try again.' });
  }

  otpStores.otpStorage.delete(normalizedEmail);
  jwt.clearSessions();
  res.clearCookie('session');
  return res.json({ success: true, message: 'Password changed. Sign in with your new password.' });
});

async function sendVerificationEmail(email, verificationCode) {
  const mail = new Mail();
  mail.setTo(email);
  mail.setSubject('Verify your email address');
  mail.setText(`Your email verification code is ${verificationCode}. It expires in 10 minutes.`);
  mail.setHtml(
    `<p>Use this code to verify your email address:</p><p><strong>${verificationCode}</strong></p><p>The code expires in 10 minutes.</p>`
  );
  await mail.send();
}

app.get('/dashboard', (req, res) => {
  const session = getSession(req);
  if (!session) {
    res.clearCookie('session');
    return res.redirect('/login');
  }

  return res.send(`<!doctype html>
    <html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Account</title><style>body{font:16px/1.5 system-ui,sans-serif;max-width:640px;margin:48px auto;padding:0 20px;color:#172033}
    main{padding:28px;border:1px solid #dce2ed;border-radius:12px}a,button{display:inline-block;margin:12px 12px 0 0;padding:10px 16px}
    </style></head><body><main><h1>Signed in</h1><p>Signed in as ${escapeHtml(session.email)}.</p>
    <a href="/test">Open email test</a><a href="/logout">Log out</a></main></body></html>`);
});

app.post('/mail', async (req, res) => {
  const form = req.body || {};
  let to = form.to;
  if (to === undefined || to === null) {
    to = form.receiver_id;
  }
  const cc = form.cc;
  const bcc = form.bcc;
  const subject = form.subject;
  const text = form.text;
  const html = form.html;
  const attachment = form.attachment;
  const hasText = typeof text === 'string' && text.trim().length > 0;
  const hasHtml = typeof html === 'string' && html.trim().length > 0;

  if (!process.env.EMAIL || !process.env.PASSWORD) {
    return res.status(500).json({
      success: false,
      message: 'Email credentials are not configured.',
    });
  }

  if (typeof to !== 'string' || !to.trim()) {
    return res.status(400).json({
      success: false,
      message: 'At least one To recipient is required.',
    });
  }

  if (cc !== undefined && typeof cc !== 'string') {
    return res.status(400).json({ success: false, message: 'CC must be text.' });
  }

  if (bcc !== undefined && typeof bcc !== 'string') {
    return res.status(400).json({ success: false, message: 'BCC must be text.' });
  }

  if (typeof subject !== 'string' || !subject.trim()) {
    return res.status(400).json({ success: false, message: 'Subject is required.' });
  }

  if (!hasText && !hasHtml) {
    return res.status(400).json({
      success: false,
      message: 'Enter a text or HTML email body.',
    });
  }

  const toList = splitEmailAddresses(to);
  const ccList = splitEmailAddresses(cc || '');
  const bccList = splitEmailAddresses(bcc || '');

  if (attachment !== undefined && !isValidAttachment(attachment)) {
    return res.status(400).json({ success: false, message: 'The attachment is invalid.' });
  }

  if (attachment && Buffer.byteLength(attachment.content, 'base64') > MAX_FILE_SIZE) {
    return res.status(413).json({
      success: false,
      message: 'The attachment must be 5 MB or smaller.',
    });
  }

  try {
    const mail = new Mail();
    let emailHtml = html;
    if (!hasHtml && hasText) {
      emailHtml = `<p>${escapeHtml(text.trim()).replace(/\r?\n/g, '<br>')}</p>`;
    }

    for (let i = 0; i < toList.length; i++) {
      mail.setTo(toList[i]);
    }

    for (let i = 0; i < ccList.length; i++) {
      mail.setCC(ccList[i]);
    }

    for (let i = 0; i < bccList.length; i++) {
      mail.setBCC(bccList[i]);
    }

    mail.setSubject(subject.trim());
    mail.setHtml(
      `${emailHtml}<img src="cid:company-logo" alt="ETech logo" width="180" style="display:block;height:auto;margin-top:10px;">`
    );

    if (hasText) {
      mail.setText(text.trim());
    }

    if (fs.existsSync(LOGO_PATH)) {
      mail.setAttachments({
        filename: 'company-logo.png',
        path: LOGO_PATH,
        cid: 'company-logo',
      });
    }

    if (attachment) {
      mail.setAttachments({
        filename: path.basename(String(attachment.filename).replace(/[\\/]/g, '/')),
        content: Buffer.from(attachment.content, 'base64'),
      });
    }

    const result = await mail.send();
    const acceptedEmails = [];
    const accepted = result.accepted || [];
    for (let i = 0; i < accepted.length; i++) {
      acceptedEmails.push(String(accepted[i]).toLowerCase());
    }

    const notAccepted = [];
    for (let i = 0; i < toList.length; i++) {
      const email = toList[i];
      if (!acceptedEmails.includes(email.toLowerCase())) {
        notAccepted.push(email);
      }
    }

    if (notAccepted.length > 0) {
      return res.status(502).json({
        success: false,
        message: 'The email provider did not accept all To recipients.',
        accepted: result.accepted,
        rejected: result.rejected,
      });
    }

    return res.json({
      success: true,
      message: 'The email provider accepted the message for delivery.',
      messageId: result.messageId,
      accepted: result.accepted,
      rejected: result.rejected,
    });
  } catch (error) {
    console.error('Email send failed:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to send email.',
    });
  }
});

function hashOtp(otp) {
  return crypto.createHash('sha256').update(otp).digest('hex');
}

function safeHashMatches(expected, actual) {
  const expectedBuffer = Buffer.from(expected, 'hex');
  const actualBuffer = Buffer.from(actual, 'hex');
  return expectedBuffer.length === actualBuffer.length &&
    crypto.timingSafeEqual(expectedBuffer, actualBuffer);
}

function splitEmailAddresses(addresses) {
  if (!addresses) {
    return [];
  }

  const addressList = String(addresses).split(/[;,]/);
  const emails = [];

  for (let i = 0; i < addressList.length; i++) {
    const email = addressList[i].trim();
    if (email) {
      emails.push(email);
    }
  }

  return emails;
}

function isValidAttachment(attachment) {
  if (!attachment || typeof attachment !== 'object') {
    return false;
  }

  if (typeof attachment.filename !== 'string' || !attachment.filename.trim()) {
    return false;
  }

  if (typeof attachment.content !== 'string' || !attachment.content) {
    return false;
  }

  return /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(
    attachment.content
  );
}

function escapeHtml(text) {
  return String(text).replace(/[&<>"']/g, (character) => {
    const safeCharacters = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    };

    return safeCharacters[character];
  });
}

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
