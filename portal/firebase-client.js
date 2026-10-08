import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js';
import {
  browserLocalPersistence,
  browserSessionPersistence,
  GoogleAuthProvider,
  getAuth,
  setPersistence,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInAnonymously,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged,
} from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  where,
  writeBatch,
} from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js';
import { firebaseConfig, isFirebaseConfigured } from './firebase-config.js';

const $ = (selector) => document.querySelector(selector);
const app = isFirebaseConfigured ? initializeApp(firebaseConfig) : null;
const auth = app ? getAuth(app) : null;
const db = app ? getFirestore(app) : null;
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

const rememberStaffStorageKey = 'onestop-remember-staff';
const rememberStaffCheckbox = $('#remember-staff');
if (rememberStaffCheckbox) {
  try {
    rememberStaffCheckbox.checked = localStorage.getItem(rememberStaffStorageKey) === 'true';
  } catch {
    // Browser storage can be unavailable in private or restricted contexts.
  }
  rememberStaffCheckbox.addEventListener('change', () => {
    try {
      localStorage.setItem(rememberStaffStorageKey, String(rememberStaffCheckbox.checked));
    } catch {
      // Authentication persistence still follows the checkbox for this sign-in.
    }
  });
}

function setStaffSignInPersistence() {
  return setPersistence(auth, rememberStaffCheckbox?.checked ? browserLocalPersistence : browserSessionPersistence);
}

function renderAuthNavigation(user) {
  document.querySelectorAll('.nav-sign-in').forEach((link) => {
    link.innerHTML = user ? 'Sign out <span>↗</span>' : 'Sign in <span>→</span>';
    link.href = user ? '#sign-out' : 'sign-in.html';
    link.setAttribute('aria-label', user ? 'Sign out of OneStop' : 'Sign in to OneStop');
    link.dataset.authState = user ? 'signed-in' : 'signed-out';
    link.removeAttribute('aria-disabled');
  });
}

document.addEventListener('click', async (event) => {
  const link = event.target.closest('.nav-sign-in');
  if (!link || !auth?.currentUser) return;
  event.preventDefault();
  link.setAttribute('aria-disabled', 'true');
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Could not sign out of OneStop.', error);
    link.removeAttribute('aria-disabled');
  }
});

if (auth) onAuthStateChanged(auth, renderAuthNavigation);

function setMessage(selector, message, kind = 'info') {
  const element = $(selector);
  if (!element) return;
  element.textContent = message;
  element.dataset.kind = kind;
  element.hidden = !message;
}

function requireFirebase() {
  if (isFirebaseConfigured) return true;
  setMessage('#auth-message', 'Firebase is not configured yet. Add the Web App config to firebase-config.js.', 'warning');
  setMessage('#ict-submit-message', 'Firebase is not configured yet. Add the Web App config before submitting.', 'warning');
  setMessage('#tracker-message', 'Firebase is not configured yet. Add the Web App config before tracking a request.', 'warning');
  setMessage('#password-reset-message', 'Firebase is not configured yet. Add the Web App config before sending a reset email.', 'warning');
  return false;
}

async function getApprovedProfile(user) {
  const profileSnapshot = await getDoc(doc(db, 'users', user.uid));
  if (!profileSnapshot.exists()) {
    if (user.email?.toLowerCase() === 'sdo@deped.gov.ph') {
      const bootstrapProfile = {
        displayName: user.displayName || 'SDO OneStop Administrator',
        email: user.email,
        unitId: 'ICT Unit',
        role: 'admin',
        status: 'active',
        active: true,
        createdAt: serverTimestamp(),
      };
      await setDoc(doc(db, 'users', user.uid), bootstrapProfile, { merge: true });
      return bootstrapProfile;
    }
    const error = new Error('This account has not been provisioned by ICT.');
    error.code = 'auth/not-provisioned';
    throw error;
  }
  const profile = profileSnapshot.data();
  const active = profile.active === true || profile.status === 'active';
  if (!active) {
    const error = new Error('This account is not active. Please contact ICT.');
    error.code = 'auth/account-disabled';
    throw error;
  }
  return profile;
}

function showAuthError(error) {
  const messages = {
    'auth/invalid-credential': 'The email or password is incorrect.',
    'auth/invalid-login-credentials': 'The email or password is incorrect.',
    'auth/popup-closed-by-user': 'The Google sign-in window was closed.',
    'auth/popup-blocked': 'Your browser blocked the Google sign-in window. Allow pop-ups and try again.',
    'auth/not-provisioned': 'This account has not been provisioned by ICT.',
    'auth/account-disabled': 'This account is not active. Please contact ICT.',
  };
  setMessage('#auth-message', messages[error.code] || error.message || 'Sign-in could not be completed.', 'error');
}

async function finishStaffSignIn(user) {
  const profile = await getApprovedProfile(user);
  const unit = String(profile.unitId || profile.unit || '').toLowerCase();
  if (unit === 'ict unit' || profile.role === 'admin') {
    window.location.href = 'ict-dashboard.html';
    return;
  }
  window.location.href = 'index.html';
}

async function signInWithGoogleAccount() {
  if (!requireFirebase()) return;
  try {
    await setStaffSignInPersistence();
    const result = await signInWithPopup(auth, googleProvider);
    await finishStaffSignIn(result.user);
  } catch (error) {
    if (auth?.currentUser) await signOut(auth).catch(() => {});
    showAuthError(error);
  }
}

async function signInWithStaffCredentials() {
  if (!requireFirebase()) return;
  const email = $('#staff-email')?.value.trim();
  const password = $('#staff-password')?.value;
  if (!email || !password) {
    setMessage('#auth-message', 'Enter your official email and password.', 'error');
    return;
  }
  try {
    await setStaffSignInPersistence();
    const result = await signInWithEmailAndPassword(auth, email, password);
    await finishStaffSignIn(result.user);
  } catch (error) {
    if (auth?.currentUser) await signOut(auth).catch(() => {});
    showAuthError(error);
  }
}

const googleButton = $('.auth-official-action');
const staffSignInButton = $('.auth-submit');
if (googleButton) googleButton.addEventListener('click', signInWithGoogleAccount);
if (staffSignInButton) staffSignInButton.addEventListener('click', signInWithStaffCredentials);

function makeTrackingNumber() {
  const random = new Uint32Array(1);
  const range = 900_000_000;
  const limit = Math.floor(0x1_0000_0000 / range) * range;
  do crypto.getRandomValues(random); while (random[0] >= limit);
  return String(100_000_000 + (random[0] % range));
}

function formatTrackingNumber(value) {
  const digits = String(value || '').replace(/\D/g, '');
  return /^\d{9}$/.test(digits) ? `SDO-${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}` : String(value || '');
}

function timestampMillis(value) {
  const date = value?.toDate ? value.toDate() : (value ? new Date(value) : null);
  return date && !Number.isNaN(date.getTime()) ? date.getTime() : 0;
}

async function submitIctRequest() {
  if (!requireFirebase()) return;
  const form = $('#ict-request-form');
  if (!form) return;
  const submitButton = $('.ict-submit-preview');
  if (submitButton?.disabled) return;
  const attachment = $('#ict-attachment')?.files?.[0] || null;
  const values = Object.fromEntries(new FormData(form).entries());
  delete values.attachment;
  const requestParameters = new URLSearchParams(window.location.search);
  const service = requestParameters.get('service') || 'Request DTR';
  const selectedUnit = requestParameters.get('unit') || 'ICT Unit';
  const unitId = selectedUnit === 'Guided routing' ? 'ICT Unit' : selectedUnit;
  if (unitId !== 'ICT Unit') {
    setMessage('#ict-submit-message', 'Online requests for this unit are not available yet.', 'error');
    return;
  }
  const trackingNumber = makeTrackingNumber();
  const loaderStartedAt = performance.now();
  window.showPageLoader?.('Submitting your request…', 0);
  if (submitButton) {
    submitButton.disabled = true;
    submitButton.classList.add('is-loading');
  }
  try {
    const requester = auth.currentUser || (await signInAnonymously(auth)).user;
    const batch = writeBatch(db);
    batch.set(doc(db, 'requests', trackingNumber), {
      trackingNumber,
      unitId,
      service,
      status: 'submitted',
      requesterUid: requester.uid,
      requesterName: values.fullName || '',
      requesterEmail: values.email || '',
      details: values,
      attachment: attachment ? { name: attachment.name, type: attachment.type, size: attachment.size } : null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
      batch.set(doc(db, 'public_tracking', trackingNumber), {
      status: 'submitted',
      updatedAt: serverTimestamp(),
      service,
      requesterName: values.fullName || '',
      requesterEmail: values.email || '',
    });
    await batch.commit();
    const minimumLoaderTime = 1450;
    const remainingLoaderTime = Math.max(0, minimumLoaderTime - (performance.now() - loaderStartedAt));
    if (remainingLoaderTime) await new Promise((resolve) => window.setTimeout(resolve, remainingLoaderTime));
    window.hidePageLoader?.();
    $('#ict-review-modal')?.setAttribute('hidden', 'hidden');
    document.body.classList.remove('modal-open');
    $('#ict-request-form')?.setAttribute('hidden', 'hidden');
    const number = $('#ict-confirmation-number');
    if (number) number.textContent = formatTrackingNumber(trackingNumber);
    setMessage('#ict-submit-message', `Your ${unitId} request was submitted.`, 'success');
    setModalOpen('#ict-submission-success-modal', true);
  } catch (error) {
    window.hidePageLoader?.();
    setMessage('#ict-submit-message', error.message || `The ${unitId} request could not be submitted.`, 'error');
  } finally {
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.classList.remove('is-loading');
    }
  }
}

const submitIctButton = $('.ict-submit-preview');
if (submitIctButton) submitIctButton.addEventListener('click', submitIctRequest);

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character]));
}

function readableDetailLabel(key) {
  return String(key).replace(/([A-Z])/g, ' $1').replace(/^./, (character) => character.toUpperCase()).replace(/\bId\b/g, 'ID');
}

const REQUEST_DETAIL_ORDER = ['firstName', 'middleName', 'lastName', 'suffix', 'position', 'birthday', 'school', 'schoolId'];
function orderedRequestDetails(details = {}) {
  const normalizedDetails = { ...details };
  if (normalizedDetails.lastName && !String(normalizedDetails.suffix || '').trim()) normalizedDetails.suffix = 'N/A';
  const keys = Object.keys(normalizedDetails);
  const orderedKeys = [...REQUEST_DETAIL_ORDER, ...keys.filter((key) => !REQUEST_DETAIL_ORDER.includes(key))];
  return orderedKeys
    .filter((key, index) => orderedKeys.indexOf(key) === index)
    .map((key) => [key, normalizedDetails[key]])
    .filter(([, value]) => value !== undefined && value !== null && String(value).trim() !== '');
}

const ICT_STATUSES = [
  ['submitted', 'Submitted'],
  ['in_review', 'In review'],
  ['in_progress', 'In progress'],
  ['waiting_for_requester', 'Waiting for requester'],
  ['account_created', 'Account created'],
  ['ready_for_activation', 'Ready for activation'],
  ['ready_for_release', 'Ready for release'],
  ['completed', 'Completed'],
  ['declined', 'Declined'],
];

const statusLabel = (status) => ICT_STATUSES.find(([value]) => value === status)?.[1] || 'Submitted';

const statusSelect = $('#ict-action-status');
const statusSelectShell = $('#ict-status-select-shell');
const statusSelectTrigger = $('#ict-status-select-trigger');
const statusSelectMenu = $('#ict-status-select-menu');
function closeStatusPicker() {
  if (!statusSelectMenu || !statusSelectTrigger) return;
  statusSelectMenu.hidden = true;
  statusSelectTrigger.setAttribute('aria-expanded', 'false');
  statusSelectShell?.classList.remove('is-open');
}
function syncStatusPicker() {
  if (!statusSelect || !statusSelectMenu || !statusSelectTrigger) return;
  const selected = statusSelect.options[statusSelect.selectedIndex];
  const label = statusSelectTrigger.querySelector('span');
  if (label) label.textContent = selected?.textContent || 'Select status';
  statusSelectMenu.innerHTML = Array.from(statusSelect.options).map((option) => `<button type="button" role="option" data-status-value="${escapeHtml(option.value)}" aria-selected="${option.selected}">${escapeHtml(option.textContent)}</button>`).join('');
  statusSelectMenu.querySelectorAll('[data-status-value]').forEach((optionButton) => optionButton.addEventListener('click', () => {
    statusSelect.value = optionButton.dataset.statusValue || '';
    statusSelect.dispatchEvent(new Event('change', { bubbles: true }));
    syncStatusPicker();
    closeStatusPicker();
  }));
}
if (statusSelectTrigger && statusSelectMenu) {
  statusSelectTrigger.addEventListener('click', (event) => {
    event.stopPropagation();
    const isOpen = !statusSelectMenu.hidden;
    if (isOpen) closeStatusPicker();
    else {
      syncStatusPicker();
      statusSelectMenu.hidden = false;
      statusSelectTrigger.setAttribute('aria-expanded', 'true');
      statusSelectShell?.classList.add('is-open');
    }
  });
  document.addEventListener('click', (event) => { if (!statusSelectShell?.contains(event.target)) closeStatusPicker(); });
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape') closeStatusPicker(); });
}

const ictRecords = new Map();
let activeIctRecord = null;
let activeTrackedRequest = null;
let activeStaffProfile = null;
let ictQueueRecords = [];
let latestRequesterReplies = new Map();
let ictQueueFilter = 'active';
let ictEmailView = 'active';
let ictEmailSort = 'newest';

const isClosedRequestStatus = (status) => status === 'completed' || status === 'declined';

function matchesIctQueueFilter(record) {
  const status = ICT_STATUSES.some(([value]) => value === record.status) ? record.status : 'submitted';
  if (ictQueueFilter === 'all') return true;
  if (ictQueueFilter === 'completed') return status === 'completed';
  if (ictQueueFilter === 'declined') return status === 'declined';
  if (ictQueueFilter === 'needs_reply') return record.latestMessageBy === 'requester';
  return !isClosedRequestStatus(status);
}

function fileMetadata(file) {
  return file ? { name: file.name, type: file.type, size: file.size } : null;
}

function renderIctQueue(snapshot) {
  const records = snapshot.docs.map((item) => ({ id: item.id, ...item.data() })).sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
  ictQueueRecords = records;
  ictRecords.clear();
  records.forEach((record) => ictRecords.set(record.id, record));
  renderIctQueueRecords(recordsWithLatestReplies(records));
  backfillTrackingIdentity(records);
}

function recordsWithLatestReplies(records) {
  return records.map((record) => {
    const reply = latestRequesterReplies.get(record.id);
    if (!reply || timestampMillis(reply.createdAt) <= timestampMillis(record.updatedAt)) return record;
    return { ...record, latestMessage: reply.message, latestMessageBy: 'requester' };
  });
}

function renderLatestRequesterReplies(snapshot) {
  latestRequesterReplies = new Map();
  snapshot.docs.forEach((item) => {
    const reply = item.data();
    if (!reply.requestId) return;
    const previous = latestRequesterReplies.get(reply.requestId);
    if (!previous || timestampMillis(reply.createdAt) > timestampMillis(previous.createdAt)) latestRequesterReplies.set(reply.requestId, reply);
  });
  renderIctQueueRecords(recordsWithLatestReplies(ictQueueRecords));
}

async function backfillTrackingIdentity(records) {
  const candidates = records.filter((record) => /^\d{9}$/.test(record.trackingNumber || '') && (record.requesterName || record.requesterEmail));
  await Promise.all(candidates.map(async (record) => {
    const trackingRef = doc(db, 'public_tracking', record.trackingNumber);
    const trackingSnapshot = await getDoc(trackingRef);
    if (!trackingSnapshot.exists()) return;
    const projection = trackingSnapshot.data();
    if (projection.requesterName === (record.requesterName || '') && projection.requesterEmail === (record.requesterEmail || '') && projection.service === (record.service || 'Service request')) return;
    const batch = writeBatch(db);
    batch.update(trackingRef, {
      service: record.service || 'Service request',
      requesterName: record.requesterName || '',
      requesterEmail: record.requesterEmail || '',
    });
    await batch.commit();
  })).catch((error) => setMessage('#ict-dashboard-message', error.message || 'Could not refresh public tracking details.', 'error'));
}

function renderIctQueueRecords(records) {
  const queue = $('#ict-queue');
  if (!queue) return;
  renderEmailApplications(records);
  const count = $('#ict-request-count');
  const activeCount = records.filter((record) => {
    const status = ICT_STATUSES.some(([value]) => value === record.status) ? record.status : 'submitted';
    return !isClosedRequestStatus(status);
  }).length;
  if (count) count.textContent = String(activeCount);
  const visibleRecords = records.filter(matchesIctQueueFilter);
  queue.innerHTML = visibleRecords.length ? visibleRecords.map((record) => {
    const currentStatus = ICT_STATUSES.some(([value]) => value === record.status) ? record.status : 'submitted';
    return `<article class="ict-queue-item ${currentStatus === 'completed' ? 'is-completed' : ''}" data-request-id="${escapeHtml(record.id)}" data-requester-uid="${escapeHtml(record.requesterUid || '')}">
      <div class="ict-queue-summary"><div class="queue-status-line"><span class="queue-status">${escapeHtml(statusLabel(currentStatus))}</span>${record.latestMessageBy === 'requester' ? '<span class="requester-reply-badge"><i></i> New reply</span>' : ''}</div><h3>${escapeHtml(record.service || 'Service request')}</h3><p>${escapeHtml(record.requesterName || record.requesterEmail || 'Anonymous requester')}</p>${record.latestMessage ? `<small class="queue-latest-message">${escapeHtml(record.latestMessage)}</small>` : ''}</div>
      <div class="queue-meta"><strong>${escapeHtml(formatTrackingNumber(record.trackingNumber || record.id))}</strong><small>${escapeHtml(activeStaffProfile?.unitId || 'Assigned unit')}</small><button class="queue-action-button" data-action="open-request" type="button">Take action <span>↗</span></button></div>
    </article>`;
  }).join('') : `<div class="ict-queue-empty"><span>✓</span><strong>${ictQueueFilter === 'completed' ? 'No completed requests yet' : ictQueueFilter === 'needs_reply' ? 'No new requester replies' : ictQueueFilter === 'declined' ? 'No declined requests' : 'No active requests'}</strong><small>Choose another view to see the rest of the request history.</small></div>`;
}

function renderEmailApplications(records) {
  const tableBody = $('#ict-email-applications');
  if (!tableBody) return;
  const allApplications = records.filter((record) => record.service === 'Request a new DepEd email account');
  const count = $('#ict-email-request-count');
  if (count) count.textContent = String(allApplications.length);
  const viewFilter = $('#ict-email-view-filter')?.value || ictEmailView;
  const sortOrder = $('#ict-email-sort')?.value || ictEmailSort;
  let applications = allApplications.filter((record) => {
    const status = ICT_STATUSES.some(([value]) => value === record.status) ? record.status : 'submitted';
    if (viewFilter === 'all') return true;
    if (viewFilter === 'completed') return status === 'completed';
    if (viewFilter === 'declined') return status === 'declined';
    if (viewFilter === 'needs_reply') return record.latestMessageBy === 'requester';
    return status !== 'completed' && status !== 'declined';
  });
  applications.sort((a, b) => {
    if (sortOrder === 'applicant') return (a.requesterName || '').localeCompare(b.requesterName || '', undefined, { sensitivity: 'base' });
    const aCreated = a.createdAt?.seconds || 0;
    const bCreated = b.createdAt?.seconds || 0;
    return sortOrder === 'oldest' ? aCreated - bCreated : bCreated - aCreated;
  });
  tableBody.innerHTML = applications.length ? applications.map((record) => {
    const currentStatus = ICT_STATUSES.some(([value]) => value === record.status) ? record.status : 'submitted';
    const remarks = record.latestMessage || record.details?.details || 'No remarks yet.';
    return `<tr class="${currentStatus === 'completed' ? 'is-completed' : ''}" data-request-id="${escapeHtml(record.id)}"><td><strong>${escapeHtml(record.requesterName || 'Unnamed applicant')}</strong><small>${escapeHtml(record.requesterEmail || '')}</small></td><td>${escapeHtml(record.details?.school || record.details?.office || '—')}</td><td>${escapeHtml(record.details?.schoolId || '—')}</td><td><span class="email-status-chip status-${escapeHtml(currentStatus)}">${escapeHtml(statusLabel(currentStatus))}</span></td><td><span class="email-remarks" title="${escapeHtml(remarks)}">${escapeHtml(remarks)}</span></td><td><button class="queue-action-button" data-action="open-request" type="button">Take action <span>↗</span></button></td></tr>`;
  }).join('') : `<tr><td colspan="6"><div class="ict-queue-empty"><span>✓</span><strong>${allApplications.length ? 'No applications match this view' : 'No new DepEd email applications'}</strong><small>${allApplications.length ? 'Choose another view or sort option.' : 'New account requests will appear here when submitted.'}</small></div></td></tr>`;
}

function setModalOpen(selector, isOpen) {
  const modal = $(selector);
  if (!modal) return;
  modal.hidden = !isOpen;
  document.body.classList.toggle('modal-open', isOpen);
  if (isOpen) window.setTimeout(() => modal.querySelector('button,select,textarea,input')?.focus(), 20);
}

function renderModalEvents(selector, requestRecord, events) {
  const target = $(selector);
  if (!target) return;
  const allEvents = events.length ? events : [{ status: requestRecord.status || 'submitted', message: requestRecord.latestMessage || 'Your request has been received.', createdAt: requestRecord.updatedAt || requestRecord.createdAt, senderRole: 'ict' }];
  target.innerHTML = allEvents.map((event, index) => `<div class="modal-event ${index === 0 ? 'is-newest' : ''}"><div><strong>${escapeHtml(statusLabel(event.status))}</strong><span>${index === 0 ? '<b class="newest-event-badge">LATEST</b>' : ''}${escapeHtml(event.senderRole === 'requester' ? 'Requester' : (event.senderUnit || 'ICT Unit'))}</span></div><p>${escapeHtml(event.message || 'Status updated.')} ${event.attachment?.name ? `<small class="event-attachment">Attachment: ${escapeHtml(event.attachment.name)}</small>` : ''}</p><time>${escapeHtml(formatTimestamp(event.createdAt))}</time></div>`).join('');
}

async function loadRequestEvents(requestId, requesterUid = null) {
  const filters = [where('requestId', '==', requestId)];
  if (requesterUid) filters.push(where('requesterUid', '==', requesterUid), where('visibleToRequester', '==', true));
  const snapshot = await getDocs(query(collection(db, 'request_events'), ...filters));
  return snapshot.docs.map((item) => item.data()).sort((a, b) => timestampMillis(b.createdAt) - timestampMillis(a.createdAt));
}

async function openIctRequestModal(requestId, button) {
  const record = ictRecords.get(requestId);
  if (!record) return;
  activeIctRecord = record;
  button?.classList.add('is-loading');
  if (button) button.disabled = true;
  const title = $('#ict-action-title');
  const requester = $('#ict-action-requester');
  const tracking = $('#ict-action-tracking');
  const details = $('#ict-action-details');
  const status = $('#ict-action-status');
  const message = $('#ict-action-message');
  const credentialRecipient = $('#ict-credential-recipient');
  const credentialDepedEmail = $('#ict-credential-deped-email');
  const temporaryPassword = $('#ict-temporary-password');
  const credentialPanel = document.querySelector('.credential-delivery-panel');
  const actionModal = $('#ict-action-modal');
  const attachmentField = document.querySelector('#ict-action-attachment')?.closest('.modal-upload');
  const actionSupportRow = document.querySelector('.action-support-row');
  const isCredentialRequest = /deped email/i.test(record.service || '');
  if (actionModal) {
    actionModal.classList.toggle('is-credential-request', isCredentialRequest);
    actionModal.classList.toggle('is-password-reset-request', /reset/i.test(record.service || ''));
  }
  if (credentialPanel) credentialPanel.hidden = !isCredentialRequest;
  if (attachmentField) attachmentField.hidden = isCredentialRequest;
  if (actionSupportRow) actionSupportRow.classList.toggle('without-attachment', isCredentialRequest);
  if (title) title.textContent = record.service || 'Service request';
  if (requester) requester.textContent = record.requesterName || record.requesterEmail || 'Anonymous requester';
  if (tracking) tracking.textContent = formatTrackingNumber(record.trackingNumber || record.id);
  const deleteRequestButton = $('#ict-delete-request');
  const canDeleteRequest = activeStaffProfile?.role === 'admin';
  if (deleteRequestButton) deleteRequestButton.hidden = !canDeleteRequest;
  setModalOpen('#ict-delete-modal', false);
  const saveUpdateButton = document.querySelector('.ict-action-modal-footer .modal-primary-action');
  if (saveUpdateButton) saveUpdateButton.disabled = false;
  if (details) details.innerHTML = orderedRequestDetails(record.details || {}).filter(([key]) => key !== 'fullName' && key !== 'email').map(([key, value]) => `<div><span>${escapeHtml(readableDetailLabel(key))}</span><strong>${escapeHtml(value)}</strong></div>`).join('') || '<p class="modal-muted">No additional request details.</p>';
  if (status) status.innerHTML = ICT_STATUSES.map(([value, label]) => `<option value="${value}" ${value === (record.status || 'submitted') ? 'selected' : ''}>${label}</option>`).join('');
  closeStatusPicker();
  syncStatusPicker();
  if (message) message.value = '';
  if (credentialRecipient) credentialRecipient.value = record.details?.recoveryEmail || record.requesterEmail || '';
  if (credentialDepedEmail) {
    const isPasswordReset = /reset/i.test(record.service || '');
    credentialDepedEmail.value = isPasswordReset ? (record.requesterEmail || '') : (record.details?.depedEmail || '');
    credentialDepedEmail.readOnly = isPasswordReset;
  }
  if (temporaryPassword) temporaryPassword.value = '';
  setMessage('#ict-credential-message', '', 'info');
  setMessage('#ict-action-form-message', '', 'info');
  const actionScrollContent = actionModal?.querySelector('.modal-scroll-content');
  if (actionScrollContent) actionScrollContent.scrollTop = 0;
  setModalOpen('#ict-action-modal', true);
  try {
    renderModalEvents('#ict-action-timeline', record, await loadRequestEvents(record.id));
  } catch (error) {
    setMessage('#ict-dashboard-message', error.message || 'Could not load request history.', 'error');
  } finally {
    button?.classList.remove('is-loading');
    if (button) button.disabled = false;
  }
}

const dashboard = $('#ict-dashboard-page');
if (dashboard && !isFirebaseConfigured) setMessage('#ict-dashboard-message', 'Firebase is not configured yet. Add the Web App config to open the unit queue.', 'warning');
if (dashboard && isFirebaseConfigured) {
  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      window.location.href = 'sign-in.html';
      return;
    }
    try {
      const profile = await getApprovedProfile(user);
      const profileUnit = String(profile.unitId || profile.unit || (profile.role === 'admin' ? 'ICT Unit' : '')).trim();
      if (profileUnit.toLowerCase() !== 'ict unit' && profile.role !== 'admin') throw new Error('This unit is not yet enabled for queue access.');
      if (!profileUnit) throw new Error('This account is not assigned to an SDO unit.');
      activeStaffProfile = profile;
      const dtrToolCard = $('#ict-dtr-tool');
      if (dtrToolCard) dtrToolCard.hidden = profileUnit.toLowerCase() !== 'ict unit' && profile.role !== 'admin';
      const resetStaffButton = document.querySelector('[data-open-password-reset]');
      if (resetStaffButton) resetStaffButton.hidden = profileUnit.toLowerCase() !== 'ict unit';
      const emailApplicationsCard = document.querySelector('.ict-email-applications-card');
      if (emailApplicationsCard) emailApplicationsCard.hidden = profileUnit.toLowerCase() !== 'ict unit';
      const workspaceKicker = document.querySelector('.ict-dashboard-top .eyebrow');
      if (workspaceKicker) workspaceKicker.textContent = `${profileUnit} · Staff workspace`;
      const queueTitle = document.querySelector('.ict-queue-card .queue-heading h2');
      if (queueTitle) queueTitle.textContent = `Incoming ${profileUnit} requests`;
      const queueContext = document.querySelector('.ict-dashboard-top > div:first-child > p:last-child');
      if (queueContext) queueContext.textContent = `Review incoming requests and keep each ${profileUnit} response moving.`;
      const name = $('#staff-name');
      const email = $('#staff-email-label');
      if (name) name.textContent = profile.displayName || user.displayName || 'Staff member';
      if (email) email.textContent = profile.email || user.email || '';
      onSnapshot(query(collection(db, 'requests'), where('unitId', '==', profileUnit)), renderIctQueue, (error) => setMessage('#ict-dashboard-message', error.message, 'error'));
      onSnapshot(query(collection(db, 'request_events'), where('senderRole', '==', 'requester')), renderLatestRequesterReplies, (error) => setMessage('#ict-dashboard-message', error.message, 'error'));
    } catch (error) {
      activeStaffProfile = null;
      await signOut(auth).catch(() => {});
      setMessage('#ict-dashboard-message', error.message, 'error');
      window.setTimeout(() => { window.location.href = 'sign-in.html'; }, 1600);
    }
  });
}

if (!dashboard && isFirebaseConfigured) {
  onAuthStateChanged(auth, async (user) => {
    if (!user || user.isAnonymous) return;
    try {
      const profile = await getApprovedProfile(user);
      const unit = String(profile.unitId || profile.unit || '').trim();
      if (unit.toLowerCase() === 'ict unit' || profile.role === 'admin') window.location.replace('ict-dashboard.html');
    } catch (error) {
      // Unprovisioned or non-staff sessions remain on the public portal.
    }
  });
}

const ictQueue = $('#ict-queue');
if (ictQueue) ictQueue.addEventListener('click', (event) => {
  const button = event.target.closest('[data-action="open-request"]');
  if (!button) return;
  const requestItem = button.closest('[data-request-id]');
  if (requestItem) openIctRequestModal(requestItem.dataset.requestId, button);
});

const ictEmailApplications = $('#ict-email-applications');
if (ictEmailApplications) ictEmailApplications.addEventListener('click', (event) => {
  const button = event.target.closest('[data-action="open-request"]');
  if (!button) return;
  const requestItem = button.closest('[data-request-id]');
  if (requestItem) openIctRequestModal(requestItem.dataset.requestId, button);
});

const ictStatusFilter = $('#ict-status-filter');
if (ictStatusFilter) ictStatusFilter.addEventListener('change', (event) => {
  ictQueueFilter = event.target.value;
  renderIctQueueRecords(ictQueueRecords);
});
const emailViewFilter = $('#ict-email-view-filter');
if (emailViewFilter) emailViewFilter.addEventListener('change', (event) => {
  ictEmailView = event.target.value;
  renderEmailApplications(ictQueueRecords);
});
const emailSortFilter = $('#ict-email-sort');
if (emailSortFilter) emailSortFilter.addEventListener('change', (event) => {
  ictEmailSort = event.target.value;
  renderEmailApplications(ictQueueRecords);
});

const ictActionForm = $('#ict-action-form');
if (ictActionForm) ictActionForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!activeIctRecord || !auth?.currentUser || !db) return;
  const button = ictActionForm.querySelector('button[type="submit"]');
  const status = $('#ict-action-status')?.value || 'submitted';
  const message = $('#ict-action-message')?.value.trim() || '';
  const attachment = fileMetadata($('#ict-action-attachment')?.files?.[0]);
  if (button) { button.disabled = true; button.classList.add('is-loading'); }
  setMessage('#ict-action-form-message', 'Saving update…', 'info');
  try {
    const batch = writeBatch(db);
    const publicUpdate = { status, message: message || `Request marked ${statusLabel(status).toLowerCase()}.`, senderRole: 'ict', createdAt: new Date() };
    batch.update(doc(db, 'requests', activeIctRecord.id), { status, latestMessage: message, latestMessageBy: 'ict', latestAttachment: attachment, updatedAt: serverTimestamp() });
    batch.set(doc(collection(db, 'request_events')), { requestId: activeIctRecord.id, requesterUid: activeIctRecord.requesterUid, status, message: message || `Request marked ${statusLabel(status).toLowerCase()}.`, visibleToRequester: true, senderRole: 'ict', senderUnit: activeStaffProfile?.unitId || activeStaffProfile?.unit || 'ICT Unit', attachment, createdBy: auth.currentUser.uid, createdAt: serverTimestamp() });
    if (/^\d{9}$/.test(activeIctRecord.trackingNumber || '')) {
      batch.update(doc(db, 'public_tracking', activeIctRecord.trackingNumber), { status, updatedAt: serverTimestamp() });
      batch.set(doc(collection(db, 'public_tracking', activeIctRecord.trackingNumber, 'updates')), publicUpdate);
    }
    await batch.commit();
    setMessage('#ict-action-form-message', 'Update saved. The requester can now see it.', 'success');
    renderModalEvents('#ict-action-timeline', { ...activeIctRecord, status, latestMessage: message }, [{ status, message: message || `Request marked ${statusLabel(status).toLowerCase()}.`, senderRole: 'ict', senderUnit: activeStaffProfile?.unitId || activeStaffProfile?.unit || 'ICT Unit', attachment, createdAt: new Date() }]);
    window.setTimeout(() => setModalOpen('#ict-action-modal', false), 650);
  } catch (error) {
    setMessage('#ict-action-form-message', error.message || 'Could not save this update.', 'error');
  } finally {
    if (button) { button.disabled = false; button.classList.remove('is-loading'); }
  }
});

const deleteRequestButton = $('#ict-delete-request');
const deleteConfirmation = $('#ict-delete-modal');
const deleteRequestConfirm = $('#ict-delete-confirm');
const deleteRequestCancel = $('#ict-delete-cancel');
const deleteRequestClose = $('#ict-delete-close');
if (deleteRequestButton && deleteConfirmation) deleteRequestButton.addEventListener('click', () => {
  if (activeStaffProfile?.role !== 'admin' || !activeIctRecord) {
    setMessage('#ict-action-form-message', 'Only administrator accounts can delete requests.', 'error');
    return;
  }
  const tracking = $('#ict-delete-tracking');
  if (tracking) tracking.textContent = formatTrackingNumber(activeIctRecord.trackingNumber || activeIctRecord.id);
  setMessage('#ict-delete-message', '', 'info');
  setModalOpen('#ict-action-modal', false);
  setModalOpen('#ict-delete-modal', true);
});
function closeDeleteConfirmation(returnToAction = true) {
  setModalOpen('#ict-delete-modal', false);
  if (returnToAction && activeIctRecord) setModalOpen('#ict-action-modal', true);
  if (returnToAction) window.setTimeout(() => deleteRequestButton?.focus(), 25);
}
if (deleteRequestCancel) deleteRequestCancel.addEventListener('click', () => closeDeleteConfirmation());
if (deleteRequestClose) deleteRequestClose.addEventListener('click', () => closeDeleteConfirmation());
if (deleteConfirmation) {
  deleteConfirmation.addEventListener('click', (event) => {
    if (event.target === deleteConfirmation) closeDeleteConfirmation();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !deleteConfirmation.hidden) {
      event.preventDefault();
      event.stopImmediatePropagation();
      closeDeleteConfirmation();
    }
  }, true);
}
if (deleteRequestConfirm) deleteRequestConfirm.addEventListener('click', async () => {
  if (!activeIctRecord || !auth?.currentUser || !db || activeStaffProfile?.role !== 'admin') {
    setMessage('#ict-delete-message', 'Only administrator accounts can delete requests.', 'error');
    return;
  }
  const record = activeIctRecord;
  const requestId = record.id;
  const trackingNumber = record.trackingNumber || requestId;
  deleteRequestConfirm.disabled = true;
  if (deleteRequestCancel) deleteRequestCancel.disabled = true;
  deleteRequestConfirm.classList.add('is-loading');
  setMessage('#ict-delete-message', 'Deleting the request and its timeline…', 'info');
  try {
    const [eventSnapshot, publicUpdateSnapshot] = await Promise.all([
      getDocs(query(collection(db, 'request_events'), where('requestId', '==', requestId))),
      /^\d{9}$/.test(trackingNumber) ? getDocs(collection(db, 'public_tracking', trackingNumber, 'updates')) : Promise.resolve({ docs: [] }),
    ]);
    const eventDocs = [...eventSnapshot.docs, ...publicUpdateSnapshot.docs];
    const batchSize = 450;
    if (!eventDocs.length) {
      const batch = writeBatch(db);
      batch.delete(doc(db, 'requests', requestId));
      batch.delete(doc(db, 'public_tracking', trackingNumber));
      await batch.commit();
    } else {
      for (let start = 0; start < eventDocs.length; start += batchSize) {
        const batch = writeBatch(db);
        const chunk = eventDocs.slice(start, start + batchSize);
        chunk.forEach((eventDoc) => batch.delete(eventDoc.ref));
        if (start + batchSize >= eventDocs.length) {
          batch.delete(doc(db, 'requests', requestId));
          batch.delete(doc(db, 'public_tracking', trackingNumber));
        }
        await batch.commit();
      }
    }
    ictRecords.delete(requestId);
    ictQueueRecords = ictQueueRecords.filter((item) => item.id !== requestId);
    activeIctRecord = null;
    setModalOpen('#ict-delete-modal', false);
    renderIctQueueRecords(ictQueueRecords);
    setMessage('#ict-dashboard-message', `Request ${trackingNumber} was deleted and removed from the queue.`, 'success');
  } catch (error) {
    setMessage('#ict-delete-message', error.message || 'The request could not be deleted.', 'error');
  } finally {
    deleteRequestConfirm.disabled = false;
    if (deleteRequestCancel) deleteRequestCancel.disabled = false;
    deleteRequestConfirm.classList.remove('is-loading');
  }
});
const credentialEmailButton = $('#ict-send-credential-email');
if (credentialEmailButton) credentialEmailButton.addEventListener('click', async () => {
  if (!activeIctRecord || !auth?.currentUser || !activeStaffProfile) {
    setMessage('#ict-credential-message', 'Your secure ICT session is not ready yet.', 'error');
    return;
  }
  if (!/DepEd email/i.test(activeIctRecord.service || '')) {
    setMessage('#ict-credential-message', 'Credential email delivery is available for DepEd email requests only.', 'error');
    return;
  }
  const recipientEmail = $('#ict-credential-recipient')?.value.trim().toLowerCase() || '';
  const depedEmail = $('#ict-credential-deped-email')?.value.trim().toLowerCase() || '';
  const temporaryPassword = $('#ict-temporary-password')?.value || '';
  if (!depedEmail || !recipientEmail || !temporaryPassword) {
    setMessage('#ict-credential-message', 'Enter the new DepEd email, recipient email, and unique temporary password first.', 'error');
    return;
  }
  if (!depedEmail.endsWith('@deped.gov.ph')) {
    setMessage('#ict-credential-message', 'The new account must use an official @deped.gov.ph address.', 'error');
    return;
  }
  if (temporaryPassword.length < 8) {
    setMessage('#ict-credential-message', 'Use the unique temporary password generated by Google Admin.', 'error');
    return;
  }
  credentialEmailButton.disabled = true;
  credentialEmailButton.classList.add('is-loading');
  setMessage('#ict-credential-message', 'Preparing your Gmail message…', 'info');
  try {
    const requesterName = activeIctRecord.requesterName || 'Requester';
    const subject = `Your DepEd email account is ready – ${depedEmail}`;
    const body = [
      '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
      'SDO ROMBLON ONESTOP',
      'DEPED EMAIL ACCOUNT ACTIVATION',
      '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
      '',
      `Hello ${requesterName},`,
      '',
      'Your DepEd email account has been created by the SDO Romblon ICT Unit.',
      '',
      'ACCOUNT DETAILS',
      `• DepEd email: ${depedEmail}`,
      `• Temporary password: ${temporaryPassword}`,
      '',
      'ACTION REQUIRED',
      '1. Sign in using the DepEd email and temporary password above.',
      '2. Change your temporary password immediately after signing in.',
      '3. Keep your new password private and do not share it with anyone.',
      '',
      'If you did not request this account, please contact the SDO Romblon ICT Unit.',
      '',
      'Regards,',
      'SDO Romblon ICT Unit',
      'SDO Romblon OneStop',
    ].join('\n');
    const composeUrl = `https://mail.google.com/mail/?view=cm&fs=1&tf=1&to=${encodeURIComponent(recipientEmail)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    const composeWindow = window.open(composeUrl, '_blank');
    if (!composeWindow) {
      throw new Error('Gmail could not be opened. Please allow pop-ups for this portal and try again.');
    }
    composeWindow.opener = null;
    $('#ict-temporary-password').value = '';
    const deliveryStatus = 'ready_for_activation';
    const activationMessage = 'A prepared activation email was opened for the requester. Send it from Gmail, then save this update to mark the account ready for activation.';
    const statusSelect = $('#ict-action-status');
    if (statusSelect) {
      statusSelect.value = deliveryStatus;
      syncStatusPicker();
    }
    const actionMessage = $('#ict-action-message');
    if (actionMessage && !actionMessage.value.trim()) actionMessage.value = activationMessage;
    activeIctRecord.status = deliveryStatus;
    activeIctRecord.latestMessage = activationMessage;
    activeIctRecord.latestMessageBy = 'ict';
    setMessage('#ict-credential-message', `Gmail draft opened for ${recipientEmail}. Send it, then click “Save update”. The temporary password was not stored in Firestore.`, 'success');
    setMessage('#ict-action-form-message', 'Prepared Gmail message ready. Send it first, then save this update.', 'info');
  } catch (error) {
    setMessage('#ict-credential-message', error.message || 'The Gmail message could not be prepared.', 'error');
  } finally {
    credentialEmailButton.disabled = false;
    credentialEmailButton.classList.remove('is-loading');
  }
});

function formatTimestamp(value) {
  const date = value?.toDate ? value.toDate() : (value ? new Date(value) : null);
  if (!date || Number.isNaN(date.getTime())) return 'Just now';
  return new Intl.DateTimeFormat('en-PH', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }).format(date);
}

function renderTrackedTimeline(requestRecord, events) {
  renderModalEvents('#request-detail-timeline', requestRecord, events);
  const status = $('#request-detail-status');
  const latestIctEvent = events.find((event) => event.senderRole === 'ict');
  const statusMessage = latestIctEvent?.message || 'Your request has been received.';
  if (status) status.innerHTML = `<span class="queue-status">CURRENT STATUS</span><strong>${escapeHtml(statusLabel(requestRecord.status || 'submitted'))}</strong><small>${escapeHtml(statusMessage || 'Your request has been received.')}</small>`;
}

async function trackRequest() {
  const input = $('#tracking-number');
  const enteredNumber = input?.value.trim();
  const number = (enteredNumber || '').replace(/\D/g, '');
  if (!/^\d{9}$/.test(number)) { setMessage('#tracker-message', 'Enter the 9-digit tracking code from your confirmation message.', 'error'); return; }
  if (!requireFirebase()) return;
  const button = $('.tracking-form .primary-action');
  if (button) { button.disabled = true; button.classList.add('is-loading'); }
  setMessage('#tracker-message', 'Looking up your request…', 'info');
  try {
    const snapshot = await getDoc(doc(db, 'public_tracking', number));
    if (!snapshot.exists()) {
      setMessage('#tracker-message', 'We could not find a request matching that tracking code. Check it and try again.', 'error');
      return;
    }
    const requestRecord = { trackingNumber: number, unitId: 'ICT Unit', ...snapshot.data() };
    const updatesSnapshot = await getDocs(collection(db, 'public_tracking', number, 'updates'));
    const events = updatesSnapshot.docs.map((item) => item.data()).sort((a, b) => timestampMillis(b.createdAt) - timestampMillis(a.createdAt));
    activeTrackedRequest = { ...requestRecord, events };
    const title = $('#request-detail-title');
    const subtitle = $('#request-detail-subtitle');
    const tracking = $('#request-detail-tracking');
    const requesterName = $('#requester-identity-name');
    const requesterEmail = $('#requester-identity-email');
    const requesterAvatar = $('#requester-identity-avatar');
    if (title) title.textContent = requestRecord.service || 'Service request';
    if (subtitle) subtitle.textContent = requestRecord.unitId || 'Assigned unit';
    if (tracking) tracking.textContent = formatTrackingNumber(number);
    if (requesterName) requesterName.textContent = requestRecord.requesterName || 'Requester';
    if (requesterEmail) requesterEmail.textContent = requestRecord.requesterEmail || 'No email provided';
    if (requesterAvatar) requesterAvatar.textContent = (requestRecord.requesterName || 'R').trim().charAt(0).toUpperCase();
    const replyInput = $('#requester-reply-message');
    if (replyInput) replyInput.value = '';
    setMessage('#requester-reply-message-status', '', 'info');
    renderTrackedTimeline(requestRecord, events);
    setModalOpen('#request-detail-modal', true);
    setMessage('#tracker-message', `${statusLabel(requestRecord.status)} · Last updated ${formatTimestamp(requestRecord.updatedAt)}.`, 'success');
  } catch (error) {
    setMessage('#tracker-message', error.message || 'The request could not be loaded.', 'error');
  } finally {
    if (button) { button.disabled = false; button.classList.remove('is-loading'); }
  }
}

const trackerButton = $('.tracking-form .primary-action');
if (trackerButton) trackerButton.addEventListener('click', trackRequest);
const trackerInput = $('#tracking-number');
if (trackerInput) {
  trackerInput.addEventListener('paste', (event) => {
    const pastedText = event.clipboardData?.getData('text');
    if (!pastedText) return;
    const digits = pastedText.replace(/\D/g, '').slice(0, 9);
    if (!digits) return;
    event.preventDefault();
    trackerInput.value = digits.match(/.{1,3}/g)?.join('-') || '';
    trackerInput.dispatchEvent(new Event('input', { bubbles: true }));
    trackerInput.setSelectionRange(trackerInput.value.length, trackerInput.value.length);
  });
  trackerInput.addEventListener('input', () => {
    const digits = trackerInput.value.replace(/\D/g, '').slice(0, 9);
    trackerInput.value = digits.match(/.{1,3}/g)?.join('-') || '';
  });
  trackerInput.addEventListener('keydown', (event) => { if (event.key === 'Enter') { event.preventDefault(); trackRequest(); } });
}

document.querySelectorAll('[data-open-password-reset]').forEach((button) => button.addEventListener('click', () => {
  setMessage('#password-reset-message', '', 'info');
  setModalOpen('#password-reset-modal', true);
  window.setTimeout(() => $('#password-reset-email')?.focus(), 30);
}));

const passwordResetForm = $('#password-reset-form');
if (passwordResetForm) passwordResetForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!requireFirebase()) return;
  const dashboardReset = Boolean($('#ict-dashboard-page'));
  if (dashboardReset && (!auth?.currentUser || !activeStaffProfile)) {
    setMessage('#password-reset-message', 'Your ICT session is still loading. Please try again in a moment.', 'error');
    return;
  }
  const email = $('#password-reset-email')?.value.trim().toLowerCase() || '';
  const button = passwordResetForm.querySelector('button[type="submit"]');
  if (!email) {
    setMessage('#password-reset-message', 'Enter an official email address.', 'error');
    return;
  }
  if (!email.endsWith('@deped.gov.ph')) {
    setMessage('#password-reset-message', 'Use the staff member’s official @deped.gov.ph email.', 'error');
    return;
  }
  if (button) { button.disabled = true; button.classList.add('is-loading'); }
  setMessage('#password-reset-message', 'Sending secure reset link…', 'info');
  try {
    await sendPasswordResetEmail(auth, email);
    setMessage('#password-reset-message', 'Password reset email sent. Check the official inbox and spam folder.', 'success');
  } catch (error) {
    const messages = {
      'auth/user-not-found': 'No Firebase account was found for that email.',
      'auth/invalid-email': 'Enter a valid official email address.',
      'auth/too-many-requests': 'Too many reset attempts. Please wait and try again.',
      'auth/operation-not-allowed': 'Email/password sign-in is not enabled in Firebase Authentication.',
    };
    setMessage('#password-reset-message', messages[error.code] || error.message || 'Could not send the reset email.', 'error');
  } finally {
    if (button) { button.disabled = false; button.classList.remove('is-loading'); }
  }
});

const requesterReplyForm = $('#requester-reply-form');
if (requesterReplyForm) requesterReplyForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!activeTrackedRequest || !db) return;
  const replyInput = $('#requester-reply-message');
  const message = replyInput?.value.trim() || '';
  if (!message) {
    setMessage('#requester-reply-message-status', 'Write a message before sending your reply.', 'error');
    return;
  }
  const button = $('#requester-reply-submit');
  if (button) { button.disabled = true; button.classList.add('is-loading'); }
  setMessage('#requester-reply-message-status', 'Sending your reply…', 'info');
  try {
    const code = activeTrackedRequest.trackingNumber;
    const status = activeTrackedRequest.status || 'submitted';
    const createdAt = serverTimestamp();
    const eventRef = doc(collection(db, 'request_events'));
    const updateRef = doc(db, 'public_tracking', code, 'updates', eventRef.id);
    const batch = writeBatch(db);
    batch.set(eventRef, { requestId: code, status, message, visibleToRequester: true, senderRole: 'requester', createdAt });
    batch.set(updateRef, { status, message, senderRole: 'requester', createdAt });
    await batch.commit();
    replyInput.value = '';
    setMessage('#requester-reply-message-status', 'Your reply was sent to the ICT Unit.', 'success');
    try {
      const updatesSnapshot = await getDocs(collection(db, 'public_tracking', code, 'updates'));
      activeTrackedRequest.events = updatesSnapshot.docs.map((item) => item.data()).sort((a, b) => timestampMillis(b.createdAt) - timestampMillis(a.createdAt));
      renderTrackedTimeline(activeTrackedRequest, activeTrackedRequest.events);
    } catch {
      // The reply is saved; keep the success message if the timeline refresh is delayed.
    }
  } catch (error) {
    setMessage('#requester-reply-message-status', error.message || 'Could not send your reply. Please try again.', 'error');
  } finally {
    if (button) { button.disabled = false; button.classList.remove('is-loading'); }
  }
});

document.querySelectorAll('[data-modal-close]').forEach((button) => button.addEventListener('click', () => setModalOpen(`#${button.closest('.modal-backdrop')?.id}`, false)));
document.querySelectorAll('.modal-backdrop').forEach((modal) => modal.addEventListener('click', (event) => { if (event.target === modal) setModalOpen(`#${modal.id}`, false); }));
document.addEventListener('keydown', (event) => { if (event.key === 'Escape') document.querySelectorAll('.modal-backdrop:not([hidden])').forEach((modal) => setModalOpen(`#${modal.id}`, false)); });

