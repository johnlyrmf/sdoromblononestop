const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');
const { initializeApp } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth');
const crypto = require('node:crypto');
const { google } = require('googleapis');

initializeApp();
const db = getFirestore();

// These values are stored in Google Secret Manager, never in the browser,
// Firestore, source control, or function logs.
const gmailClientJson = defineSecret('GMAIL_OAUTH_CLIENT_JSON');
const gmailRefreshToken = defineSecret('GMAIL_REFRESH_TOKEN');

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DEPED_EMAIL_PATTERN = /^[^\s@]+@deped\.gov\.ph$/i;
const TRACKING_PATTERN = /^SDO-\d{4}-(?:[0-9A-F]{4}-){5}[0-9A-F]{4}$/i;
const LEGACY_TRACKING_PATTERN = /^SDO-\d{4}-\d{5}$/i;

function trackingTimestamp(value) {
  return value?.toDate ? value.toDate().toISOString() : null;
}

async function consumeTrackingRateLimit(request) {
  const now = Date.now();
  const rawIp = String(request.rawRequest?.ip || 'unknown');
  const identifiers = [
    ['uid', request.auth.uid, 12],
    ['ip', crypto.createHash('sha256').update(rawIp).digest('hex'), 40],
  ];
  await db.runTransaction(async (transaction) => {
    const refs = identifiers.map(([kind, value]) => db.doc(`tracking_lookup_limits/${kind}_${value}`));
    const snapshots = await Promise.all(refs.map((ref) => transaction.get(ref)));
    for (let index = 0; index < refs.length; index += 1) {
      const previous = snapshots[index].exists ? snapshots[index].data() : {};
      const count = previous.windowStartedAt > now - 60_000 ? Number(previous.count || 0) : 0;
      if (count >= identifiers[index][2]) throw new HttpsError('resource-exhausted', 'Too many attempts. Wait a minute, then try again.');
      transaction.set(refs[index], { count: count + 1, windowStartedAt: count ? previous.windowStartedAt : now });
    }
  });
}

async function findTrackedRequest(data) {
  const trackingNumber = requiredText(data.trackingNumber, 'Tracking number').toUpperCase();
  if (!TRACKING_PATTERN.test(trackingNumber) && !LEGACY_TRACKING_PATTERN.test(trackingNumber)) {
    throw new HttpsError('not-found', 'We could not find a request matching that tracking number. Check it and try again.');
  }
  const isLegacyCode = LEGACY_TRACKING_PATTERN.test(trackingNumber);
  const snapshot = await db.collection('requests').where('trackingNumber', '==', trackingNumber).limit(25).get();
  const requestDoc = isLegacyCode
    ? snapshot.docs.find((item) => item.data().requesterUid === data.requesterUid)
    : snapshot.docs[0];
  if (!requestDoc && isLegacyCode) {
    throw new HttpsError('failed-precondition', 'Older five-digit tracking numbers only work in the browser used to submit the request.');
  }
  if (!requestDoc) throw new HttpsError('not-found', 'We could not find a request matching that tracking number. Check it and try again.');
  return { requestDoc, record: requestDoc.data() };
}

function safeTrackingEvent(event) {
  return {
    status: String(event.status || 'submitted'),
    message: String(event.message || ''),
    senderRole: event.senderRole === 'requester' ? 'requester' : 'ict',
    senderUnit: String(event.senderUnit || 'Assigned unit'),
    attachment: event.attachment && typeof event.attachment.name === 'string' ? { name: event.attachment.name.slice(0, 200) } : null,
    createdAt: trackingTimestamp(event.createdAt),
  };
}

exports.lookupTrackedRequest = onCall({ region: 'asia-southeast1', enforceAppCheck: false, cors: true }, async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Please try again.');
  await consumeTrackingRateLimit(request);
  const { requestDoc, record } = await findTrackedRequest({ ...(request.data || {}), requesterUid: request.auth.uid });
  const eventSnapshot = await db.collection('request_events')
    .where('requestId', '==', requestDoc.id)
    .limit(200)
    .get();
  const events = eventSnapshot.docs.map((item) => item.data())
    .filter((event) => event.visibleToRequester === true)
    .sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0))
    .slice(0, 100)
    .map(safeTrackingEvent);
  return {
    id: requestDoc.id,
    trackingNumber: record.trackingNumber,
    unitId: record.unitId || 'Assigned unit',
    service: record.service || 'Service request',
    status: record.status || 'submitted',
    latestMessage: record.latestMessage || '',
    latestMessageBy: record.latestMessageBy || '',
    createdAt: trackingTimestamp(record.createdAt),
    updatedAt: trackingTimestamp(record.updatedAt),
    events,
  };
});

exports.replyToTrackedRequest = onCall({ region: 'asia-southeast1', enforceAppCheck: false, cors: true }, async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Please try again.');
  await consumeTrackingRateLimit(request);
  const data = request.data || {};
  const { requestDoc, record } = await findTrackedRequest({ ...data, requesterUid: request.auth.uid });
  const message = typeof data.message === 'string' ? data.message.trim() : '';
  const inputAttachment = data.attachment && typeof data.attachment === 'object' ? data.attachment : null;
  const attachment = inputAttachment && typeof inputAttachment.name === 'string'
    ? { name: inputAttachment.name.trim().slice(0, 200), type: typeof inputAttachment.type === 'string' ? inputAttachment.type.slice(0, 120) : '', size: Number.isFinite(Number(inputAttachment.size)) ? Math.max(0, Math.min(Number(inputAttachment.size), 25_000_000)) : 0 }
    : null;
  if (message.length > 4000) throw new HttpsError('invalid-argument', 'Your message must be 4,000 characters or fewer.');
  if (!message && !attachment?.name) throw new HttpsError('invalid-argument', 'Add a message or attach a document before sending.');
  const visibleMessage = message || `Requester attached ${attachment.name}.`;
  const batch = db.batch();
  batch.update(requestDoc.ref, { latestMessage: visibleMessage, latestMessageBy: 'requester', updatedAt: FieldValue.serverTimestamp() });
  batch.set(db.collection('request_events').doc(), {
    requestId: requestDoc.id,
    requesterUid: record.requesterUid || '',
    status: record.status || 'submitted',
    message: visibleMessage,
    visibleToRequester: true,
    senderRole: 'requester',
    attachment,
    createdBy: request.auth.uid,
    createdAt: FieldValue.serverTimestamp(),
  });
  await batch.commit();
  return { ok: true, message: visibleMessage };
});

function requiredText(value, field) {
  const text = typeof value === 'string' ? value.trim() : '';
  if (!text) throw new HttpsError('invalid-argument', `${field} is required.`);
  return text;
}

function safeHeader(value) {
  return String(value || '').replace(/[\r\n]/g, ' ').trim();
}

function encodeMimeMessage({ to, sender, requesterName, depedEmail, temporaryPassword }) {
  const safeTo = safeHeader(to);
  const safeSender = safeHeader(sender);
  const safeName = safeHeader(requesterName) || 'Requester';
  const subject = 'Your SDO Romblon DepEd email account is ready';
  const text = [
    `Hello ${safeName},`,
    '',
    'Your DepEd email account has been created by the ICT Unit.',
    '',
    `DepEd email: ${depedEmail}`,
    `Temporary password: ${temporaryPassword}`,
    '',
    'Please sign in as soon as possible and change the temporary password immediately.',
    'If you did not request this account, contact the SDO Romblon ICT Unit.',
    '',
    'SDO Romblon OneStop ICT Unit',
  ].join('\r\n');
  const mime = [
    `To: ${safeTo}`,
    `From: ${safeSender}`,
    `Subject: ${subject}`,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: 8bit',
    '',
    text,
  ].join('\r\n');
  return Buffer.from(mime, 'utf8').toString('base64url');
}

async function getAuthorizedIctProfile(uid, email) {
  const profileSnapshot = await db.doc(`users/${uid}`).get();
  const profile = profileSnapshot.exists ? profileSnapshot.data() : {};
  const unit = String(profile.unitId || profile.unit || '').toLowerCase();
  const isAuthorized = email?.toLowerCase() === 'sdo@deped.gov.ph'
    || ((unit === 'ict unit' || profile.role === 'admin') && (profile.active === true || profile.status === 'active'));
  if (!isAuthorized) throw new HttpsError('permission-denied', 'Only active ICT staff can send activation notices.');
  return profile;
}

exports.sendCredentialEmail = onCall({
  region: 'asia-southeast1',
  secrets: [gmailClientJson, gmailRefreshToken],
  enforceAppCheck: false,
}, async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Sign in as ICT staff first.');
  await getAuthorizedIctProfile(request.auth.uid, request.auth.token.email || '');

  const data = request.data || {};
  const requestId = requiredText(data.requestId, 'Request ID');
  const recipientEmail = requiredText(data.recipientEmail, 'Recipient email').toLowerCase();
  const depedEmail = requiredText(data.depedEmail, 'DepEd email').toLowerCase();
  const temporaryPassword = requiredText(data.temporaryPassword, 'Temporary password');
  const requesterName = typeof data.requesterName === 'string' ? data.requesterName.trim() : '';
  if (!EMAIL_PATTERN.test(recipientEmail)) throw new HttpsError('invalid-argument', 'Enter a valid recipient email.');
  if (!DEPED_EMAIL_PATTERN.test(depedEmail)) throw new HttpsError('invalid-argument', 'Use an official @deped.gov.ph address.');
  if (temporaryPassword.length < 8) throw new HttpsError('invalid-argument', 'The temporary password must be at least 8 characters.');

  const requestRef = db.doc(`requests/${requestId}`);
  const requestSnapshot = await requestRef.get();
  if (!requestSnapshot.exists) throw new HttpsError('not-found', 'The request could not be found.');
  const requestRecord = requestSnapshot.data();
  if (requestRecord.unitId !== 'ICT Unit') throw new HttpsError('permission-denied', 'This request is not assigned to ICT.');

  let clientConfig;
  try {
    clientConfig = JSON.parse(gmailClientJson.value());
  } catch {
    throw new HttpsError('failed-precondition', 'The Gmail OAuth client secret is not valid JSON.');
  }
  const installed = clientConfig.installed || clientConfig.web;
  if (!installed?.client_id || !installed?.client_secret) {
    throw new HttpsError('failed-precondition', 'The Gmail OAuth client secret is incomplete.');
  }
  const oauthClient = new google.auth.OAuth2(installed.client_id, installed.client_secret, installed.redirect_uris?.[0] || 'http://localhost');
  oauthClient.setCredentials({ refresh_token: gmailRefreshToken.value() });
  const gmail = google.gmail({ version: 'v1', auth: oauthClient });
  const sender = request.auth.token.email || 'johnlyrmf@gmail.com';
  const raw = encodeMimeMessage({ to: recipientEmail, sender, requesterName, depedEmail, temporaryPassword });

  try {
    await gmail.users.messages.send({ userId: 'me', requestBody: { raw } });
  } catch (error) {
    // Never include the temporary password or raw message in an error/log.
    console.error('Gmail activation notice failed', { code: error.code, status: error.response?.status });
    throw new HttpsError('internal', 'The activation email could not be sent. No request status was changed.');
  }

  const safeMessage = 'Activation instructions were sent to the requester’s recovery email. Please check the inbox or spam folder and change the temporary password immediately.';
  const eventRef = db.collection('request_events').doc();
  const update = {
    status: 'ready_for_activation',
    latestMessage: safeMessage,
    latestMessageBy: 'ict',
    updatedAt: FieldValue.serverTimestamp(),
  };
  await db.runTransaction(async (transaction) => {
    transaction.update(requestRef, update);
    transaction.set(eventRef, {
      requestId,
      requesterUid: requestRecord.requesterUid || null,
      status: 'ready_for_activation',
      message: safeMessage,
      visibleToRequester: true,
      senderRole: 'ict',
      createdBy: request.auth.uid,
      createdAt: FieldValue.serverTimestamp(),
    });
  });

  return { ok: true, status: 'ready_for_activation' };
});

const UNIT_ACCOUNT_OPTIONS = ['Budget Unit', 'Accounting Unit', 'Cashier Unit', 'Records Unit', 'Personnel Unit', 'Supply Unit', 'CID', 'SGOD', 'OSDS', 'Legal Unit'];

async function getActiveIctProvisioner(uid) {
  const snapshot = await db.doc(`users/${uid}`).get();
  const profile = snapshot.exists ? snapshot.data() : {};
  const unit = String(profile.unitId || profile.unit || '').toLowerCase();
  const active = profile.active === true || profile.status === 'active';
  if (!active || unit !== 'ict unit' || profile.role !== 'admin') {
    throw new HttpsError('permission-denied', 'Only active ICT administrators can create unit accounts.');
  }
  return profile;
}

async function sendUnitWelcomeEmail({ to, sender, displayName, unitName, resetLink }) {
  let clientConfig;
  try {
    clientConfig = JSON.parse(gmailClientJson.value());
  } catch {
    throw new HttpsError('failed-precondition', 'The Gmail OAuth client secret is not valid JSON.');
  }
  const installed = clientConfig.installed || clientConfig.web;
  if (!installed?.client_id || !installed?.client_secret) {
    throw new HttpsError('failed-precondition', 'The Gmail OAuth client secret is incomplete.');
  }
  const oauthClient = new google.auth.OAuth2(installed.client_id, installed.client_secret, installed.redirect_uris?.[0] || 'http://localhost');
  oauthClient.setCredentials({ refresh_token: gmailRefreshToken.value() });
  const gmail = google.gmail({ version: 'v1', auth: oauthClient });
  const subject = 'Your SDO Romblon OneStop staff account';
  const text = [
    `Hello ${displayName},`,
    '',
    `ICT created your staff account for ${unitName}.`,
    'Use the secure link below to set your password and activate access:',
    resetLink,
    '',
    'If you did not expect this account, contact the SDO Romblon ICT Unit.',
    '',
    'SDO Romblon OneStop ICT Unit',
  ].join('\r\n');
  const mime = [
    `To: ${safeHeader(to)}`,
    `From: ${safeHeader(sender)}`,
    `Subject: ${subject}`,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: 8bit',
    '',
    text,
  ].join('\r\n');
  try {
    await gmail.users.messages.send({ userId: 'me', requestBody: { raw: Buffer.from(mime, 'utf8').toString('base64url') } });
  } catch (error) {
    console.error('Unit account welcome email failed', { code: error.code, status: error.response?.status });
    throw new HttpsError('internal', 'The account setup email could not be sent. The account was not kept.');
  }
}

exports.createUnitStaffAccount = onCall({
  region: 'asia-southeast1',
  secrets: [gmailClientJson, gmailRefreshToken],
  enforceAppCheck: false,
}, async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Sign in as ICT staff first.');
  await getActiveIctProvisioner(request.auth.uid);
  const data = request.data || {};
  const displayName = requiredText(data.displayName, 'Staff name');
  const email = requiredText(data.email, 'Official email').toLowerCase();
  const unitName = requiredText(data.unitName, 'Unit');
  if (!EMAIL_PATTERN.test(email) || !DEPED_EMAIL_PATTERN.test(email)) {
    throw new HttpsError('invalid-argument', 'Use a valid official @deped.gov.ph email address.');
  }
  if (!UNIT_ACCOUNT_OPTIONS.includes(unitName)) {
    throw new HttpsError('invalid-argument', 'Choose a supported SDO Romblon unit.');
  }
  if (displayName.length > 120) throw new HttpsError('invalid-argument', 'Staff name must be 120 characters or fewer.');

  const auth = getAuth();
  let userRecord;
  try {
    userRecord = await auth.createUser({
      email,
      emailVerified: false,
      password: crypto.randomBytes(32).toString('base64url'),
      displayName,
      disabled: false,
    });
  } catch (error) {
    if (error.code === 'auth/email-already-exists') throw new HttpsError('already-exists', 'An account already exists for this email.');
    console.error('Unit account creation failed', { code: error.code });
    throw new HttpsError('internal', 'The Firebase account could not be created.');
  }

  const profileRef = db.doc(`users/${userRecord.uid}`);
  let profileCreated = false;
  try {
    await profileRef.create({
      displayName,
      email,
      unitId: unitName,
      role: 'unit_staff',
      status: 'active',
      active: true,
      createdBy: request.auth.uid,
      createdAt: FieldValue.serverTimestamp(),
    });
    profileCreated = true;
    const resetLink = await auth.generatePasswordResetLink(email);
    await sendUnitWelcomeEmail({
      to: email,
      sender: request.auth.token.email || 'sdo@deped.gov.ph',
      displayName,
      unitName,
      resetLink,
    });
  } catch (error) {
    if (profileCreated) await profileRef.delete().catch(() => {});
    await auth.deleteUser(userRecord.uid).catch((rollbackError) => {
      console.error('Unit account rollback failed', { uid: userRecord.uid, code: rollbackError.code });
    });
    if (error instanceof HttpsError) throw error;
    console.error('Unit account provisioning failed', { uid: userRecord.uid, code: error.code });
    throw new HttpsError('internal', 'The account could not be fully provisioned. Please try again or contact ICT.');
  }

  return { ok: true, email, displayName, unitName };
});
