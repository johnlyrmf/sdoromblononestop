// Only template-derived school summaries leave the browser; source rows are never saved.
const xml = text => {
  const doc = new DOMParser().parseFromString(text, 'application/xml');
  if (doc.querySelector('parsererror')) throw new Error('The workbook contains invalid XML.');
  return doc;
};

const nodes = (parent, tag) => [...parent.getElementsByTagName(tag)];
const firstText = (parent, tag) => parent.getElementsByTagName(tag)[0]?.textContent ?? '';
const titleCase = value => String(value || '').trim().toLowerCase().replace(/\b\p{L}/gu, letter => letter.toUpperCase());
const check = value => /^(✓|✔|true|yes|1)$/i.test(String(value || '').trim());

async function readSheets(file) {
  if (!window.JSZip) throw new Error('The Excel reader did not load.');
  const zip = await window.JSZip.loadAsync(file);
  const bookFile = zip.file('xl/workbook.xml');
  const relFile = zip.file('xl/_rels/workbook.xml.rels');
  if (!bookFile || !relFile) throw new Error('This is not a supported .xlsx workbook.');
  const [book, relations, stringsFile] = await Promise.all([
    bookFile.async('string'), relFile.async('string'), zip.file('xl/sharedStrings.xml')?.async('string'),
  ]);
  const shared = stringsFile ? nodes(xml(stringsFile), 'si').map(item => item.textContent) : [];
  const targets = new Map(nodes(xml(relations), 'Relationship').map(rel => [rel.getAttribute('Id'), rel.getAttribute('Target')]));
  const sheets = {};
  for (const sheet of nodes(xml(book), 'sheet')) {
    const name = sheet.getAttribute('name');
    if (!['Stakeholder Profile', 'Personnel', 'Equipment', 'Internet Connectivity'].includes(name)) continue;
    const target = targets.get(sheet.getAttribute('r:id'));
    if (!target) throw new Error(`The ${name} sheet is missing.`);
    const path = target.startsWith('/') ? target.slice(1) : `xl/${target.replace(/^\.\.\//, '')}`;
    const entry = zip.file(path);
    if (!entry) throw new Error(`The ${name} sheet could not be read.`);
    const doc = xml(await entry.async('string'));
    const rows = new Map();
    for (const row of nodes(doc, 'row')) {
      const cells = {};
      for (const cell of nodes(row, 'c')) {
        const ref = cell.getAttribute('r');
        const column = ref?.match(/^[A-Z]+/)?.[0];
        if (!column) continue;
        const type = cell.getAttribute('t');
        const raw = type === 'inlineStr' ? firstText(cell, 'is') : firstText(cell, 'v');
        cells[column] = type === 's' ? shared[Number(raw)] ?? '' : raw;
      }
      rows.set(Number(row.getAttribute('r')), cells);
    }
    sheets[name] = rows;
  }
  return sheets;
}

const at = (sheet, row, column) => sheet?.get(row)?.[column] ?? '';

export async function parseSchoolWorkbook(file) {
  if (!/\.xlsx$/i.test(file.name)) throw new Error('Use an .xlsx school inventory workbook.');
  if (file.size > 30 * 1024 * 1024) throw new Error('This workbook exceeds the 30 MB import limit.');
  const sheets = await readSheets(file);
  const profile = sheets['Stakeholder Profile'];
  const personnel = sheets.Personnel;
  const equipment = sheets.Equipment;
  if (!profile || !personnel || !equipment) throw new Error('The required Stakeholder Profile, Personnel, or Equipment sheet is missing.');

  const id = String(Number(at(profile, 8, 'D')) || '').trim();
  const name = String(at(profile, 7, 'D')).trim();
  const districtBase = titleCase(at(profile, 6, 'D'));
  const district = /\bdistrict$/i.test(districtBase) ? districtBase : `${districtBase} District`;
  const municipality = titleCase(at(profile, 10, 'D'));
  const barangay = titleCase(at(profile, 12, 'D'));
  const lng = Number(at(profile, 39, 'D'));
  const lat = Number(at(profile, 40, 'D'));
  if (!/^\d{6}$/.test(id) || !name || !districtBase || !municipality) throw new Error('School ID, name, district, or municipality is missing.');
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat < 11.5 || lat > 13.3 || lng < 121.4 || lng > 122.7) throw new Error('The school coordinates are missing or outside the Romblon area.');

  let teachers = 0;
  for (const [row, cells] of personnel) {
    if (row < 3 || check(cells.T)) continue;
    if (/^(?:Master\s+)?Teacher\b/i.test(String(cells.J || '').trim())) teachers++;
  }

  let equipmentRecords = 0, laptops = 0, donatedLaptops = 0, donatedDevices = 0, functional = 0, attention = 0, dcpLabeledRows = 0, dcpConflicts = 0;
  const itemCounts = {};
  for (const [row, cells] of equipment) {
    const item = String(cells.E || '').trim();
    if (row < 6 || !/^\d+(?:\.0+)?$/.test(String(cells.A || '')) || !item) continue;
    equipmentRecords++;
    itemCounts[item] = (itemCounts[item] || 0) + 1;
    const isLaptop = /\blaptop\b/i.test(item);
    const isDonation = /donation/i.test(String(cells.T || ''));
    if (isLaptop) laptops++;
    if (isDonation) donatedDevices++;
    if (isLaptop && isDonation) donatedLaptops++;
    const condition = String(cells.AP || '').trim();
    if (/^serviceable$/i.test(condition)) functional++;
    else if (/repair|unserviceable|non.functional|disposal/i.test(condition)) attention++;
    if (String(cells.K || '').trim()) { dcpLabeledRows++; if (check(cells.J)) dcpConflicts++; }
  }
  const warnings = [];
  if (dcpConflicts) warnings.push(`${dcpConflicts} DCP-labeled equipment rows also have Non-DCP checked; package count remains unverified.`);
  if (functional + attention < equipmentRecords) warnings.push(`${equipmentRecords - functional - attention} equipment records have no recognized condition.`);
  if (!teachers) warnings.push('No Teacher or Master Teacher positions were counted.');
  const internet = sheets['Internet Connectivity'];
  const connectivity = internet && String(at(internet, 23, 'D')).trim() && Number(at(internet, 34, 'D')) === 0
    ? 'Subscription marked in workbook; ISP details unavailable'
    : 'Not verified from inventory workbook';
  const digest = await crypto.subtle.digest('SHA-256', await file.arrayBuffer());
  const sourceHash = [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, '0')).join('');
  const record = {
    id, name: titleCase(name), district, municipality, barangay,
    level: /\b(?:HS|HIGH SCHOOL|NHS|SHS)\b/i.test(name) ? 'Secondary' : /\b(?:ES|ELEMENTARY SCHOOL)\b/i.test(name) ? 'Elementary' : 'Unspecified',
    lat, lng, teachers, equipmentRecords, laptops, donatedLaptops, donatedDevices,
    dcpLabeledRows, dcpPackages: null, itemCounts, functional, attention, connectivity,
    sourceFile: file.name, sourceHash, importedOn: new Date().toISOString().slice(0, 10), parserVersion: 1, warnings,
  };
  return { record, warnings };
}
