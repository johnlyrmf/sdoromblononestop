import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js';
import { collection, doc, getDoc, getFirestore, onSnapshot, serverTimestamp, setDoc } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js';
import { firebaseConfig, isFirebaseConfigured } from '../../firebase-config.js';
import { parseSchoolWorkbook } from './workbook-parser.js';

const $ = id => document.getElementById(id);
const status = (message, kind = 'info') => {
  $('dcp-import-status').textContent = message;
  $('dcp-import-status').dataset.kind = kind;
};
let approvedUser = null;
let candidates = [];
let databaseReady = false;
let busy = false;
const dropzone = $('dcp-dropzone');
const saveButton = $('dcp-save');
const fileInput = $('dcp-files');
const paint = () => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
const updateSave = () => { saveButton.disabled = busy || !approvedUser || !databaseReady || !candidates.length; };
function progress(title, detail) {
  $('dcp-progress-title').textContent = title;
  $('dcp-progress-detail').textContent = detail;
  $('dcp-progress').hidden = false;
}
function setBusy(value, mode = '') {
  busy = value;
  dropzone.classList.toggle('is-busy', value);
  dropzone.setAttribute('aria-disabled', String(value));
  fileInput.disabled = value;
  saveButton.classList.toggle('is-busy', value && mode === 'save');
  saveButton.setAttribute('aria-busy', String(value && mode === 'save'));
  $('dcp-save-label').textContent = value && mode === 'save' ? 'Saving schools…' : 'Save valid schools';
  updateSave();
}

function previewItem(result) {
  const card = document.createElement('article');
  card.className = `dcp-preview-item${result.error ? ' is-error' : ''}`;
  const mark = document.createElement('span');
  mark.className = 'dcp-preview-mark';
  mark.setAttribute('aria-hidden', 'true');
  mark.textContent = result.error ? '!' : '✓';
  const body = document.createElement('div');
  body.className = 'dcp-preview-body';
  const title = document.createElement('strong');
  const details = document.createElement('p');
  title.textContent = result.record ? `${result.record.name} · ${result.record.id}` : result.file;
  details.textContent = result.error || `${result.record.district} · ${result.record.municipality} · ${result.file}`;
  body.append(title, details);
  if (result.record) {
    const stats = document.createElement('div');
    stats.className = 'dcp-preview-stats';
    for (const value of [`${result.record.teachers} teachers`, `${result.record.equipmentRecords} equipment records`, `${result.record.lat}, ${result.record.lng}`]) {
      const chip = document.createElement('span'); chip.textContent = value; stats.append(chip);
    }
    body.append(stats);
  }
  for (const warning of result.warnings || []) {
    const line = document.createElement('p');
    line.className = 'dcp-warning';
    line.textContent = warning;
    body.append(line);
  }
  card.append(mark, body);
  return card;
}

async function readFiles(files) {
  if (busy || !files.length) return;
  candidates = [];
  $('dcp-preview').replaceChildren();
  setBusy(true, 'read');
  progress('Reading school workbooks', `Preparing ${files.length} file${files.length === 1 ? '' : 's'}…`);
  status('Checking files and building school previews.');
  await paint();
  const seen = new Set();
  let index = 0;
  for (const file of files) {
    index++;
    progress('Reading school workbooks', `File ${index} of ${files.length} · ${file.name}`);
    await paint();
    try {
      const parsed = await parseSchoolWorkbook(file);
      if (seen.has(parsed.record.id)) throw new Error(`School ID ${parsed.record.id} appears more than once in this batch.`);
      seen.add(parsed.record.id);
      const result = { file: file.name, ...parsed };
      candidates.push(result);
      $('dcp-preview').append(previewItem(result));
    } catch (error) {
      $('dcp-preview').append(previewItem({ file: file.name, error: error.message }));
    }
  }
  $('dcp-progress').hidden = true;
  setBusy(false);
  fileInput.value = '';
  status(candidates.length ? `${candidates.length} school${candidates.length === 1 ? '' : 's'} ready. Review the summaries, then save.` : 'No valid schools found. Check the file details above.', candidates.length ? 'info' : 'error');
}
fileInput.addEventListener('change', () => readFiles([...fileInput.files]));
dropzone.addEventListener('click', () => { if (!busy) fileInput.click(); });
dropzone.addEventListener('keydown', event => {
  if ((event.key === 'Enter' || event.key === ' ') && !busy) { event.preventDefault(); fileInput.click(); }
});
for (const name of ['dragenter', 'dragover']) dropzone.addEventListener(name, event => {
  event.preventDefault(); if (!busy) dropzone.classList.add('is-dragging');
});
for (const name of ['dragleave', 'drop']) dropzone.addEventListener(name, event => {
  event.preventDefault(); dropzone.classList.remove('is-dragging');
});
dropzone.addEventListener('drop', event => readFiles([...event.dataTransfer.files]));

if (!isFirebaseConfigured) {
  $('dcp-access-message').textContent = 'OneStop Firebase is not configured. Ask ICT to check the existing portal configuration.';
  $('dcp-access-message').hidden = false;
} else {
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);
  onAuthStateChanged(auth, async user => {
    if (!user || user.isAnonymous) {
      location.replace('../../sign-in.html');
      return;
    }
    try {
      const profileSnapshot = await getDoc(doc(db, 'users', user.uid));
      if (!profileSnapshot.exists()) throw new Error('Your OneStop staff account is not provisioned.');
      const profile = profileSnapshot.data();
      const active = profile.active === true || profile.status === 'active';
      const ict = String(profile.unitId || profile.unit || '').trim().toLowerCase() === 'ict unit';
      if (!active || (!ict && profile.role !== 'admin')) throw new Error('This tool is available to approved ICT staff and administrators.');
      approvedUser = user;
      document.body.classList.remove('dcp-locked');
      updateSave();
      onSnapshot(collection(db, 'dcp_schools'), snapshot => {
        databaseReady = true;
        $('dcp-service-status').hidden = true;
        updateSave();
        window.updateSchoolData(snapshot.docs.map(item => item.data()));
      }, error => {
        databaseReady = false;
        updateSave();
        $('dcp-service-status').textContent = error.code === 'permission-denied'
          ? 'The DCP database access rules are not active yet. ICT can preview files here; saving will be available after the rules are deployed.'
          : `School data could not load: ${error.message}`;
        $('dcp-service-status').hidden = false;
        $('map-note').textContent = 'School data unavailable';
      });
    } catch (error) {
      $('dcp-access-message').textContent = error.message;
      $('dcp-access-message').hidden = false;
    }
  });

  $('dcp-save').addEventListener('click', async () => {
    if (!approvedUser || !databaseReady || !candidates.length || busy) return;
    setBusy(true, 'save');
    progress('Saving school summaries', `0 of ${candidates.length} saved`);
    status('Saving approved summaries to the ICT database.');
    await paint();
    let saved = 0;
    const failures = [];
    let completed = 0;
    for (const candidate of candidates) {
      progress('Saving school summaries', `${completed + 1} of ${candidates.length} · ${candidate.record.name}`);
      await paint();
      try {
        await setDoc(doc(db, 'dcp_schools', candidate.record.id), {
          ...candidate.record,
          uploadedBy: approvedUser.uid,
          updatedAt: serverTimestamp(),
        });
        saved++;
      } catch (error) {
        failures.push(`${candidate.record.id}: ${error.message}`);
      }
      completed++;
    }
    $('dcp-progress').hidden = true;
    status(`${saved} school${saved === 1 ? '' : 's'} saved${failures.length ? `. ${failures.length} failed: ${failures.join('; ')}` : '. The live map is updating.'}`, failures.length ? 'error' : 'success');
    candidates = candidates.filter(candidate => failures.some(text => text.startsWith(`${candidate.record.id}:`)));
    setBusy(false);
  });
}
