const unitCatalog = {
  'ICT Unit': { intro: 'Digital services, DTR support, equipment concerns, and account-related assistance.', services: ['Request DTR', 'Report biometric or DTR concern', 'Request a new DepEd email account', 'Reset DepEd email account password', 'Request account access', 'Request technical or equipment support'] },
  'Budget Unit': { intro: 'Budget availability and obligation-related services.', services: ['Budget availability inquiry', 'Obligation request status'] },
  'Accounting Unit': { intro: 'Accounting, liquidation, and payroll-related inquiries.', services: ['Disbursement status inquiry', 'Liquidation inquiry', 'Payroll concern'] },
  'Cashier Unit': { intro: 'Payment and check-release related services.', services: ['Check release inquiry', 'Payment status inquiry'] },
  'Records Unit': { intro: 'Official document tracking, retrieval, and certification.', services: ['Track an incoming or outgoing document', 'Request certified true copy', 'Request document retrieval'] },
  'Personnel Unit': { intro: 'Employee records, leave, and personnel document requests.', services: ['Request service record', 'Leave concern', 'Request employment certification'] },
  'Supply Unit': { intro: 'Supply, property, and office equipment concerns.', services: ['Submit supply request', 'Report property or equipment concern'] },
  CID: { intro: 'Curriculum, learning resource, and instructional support services.', services: ['Curriculum support request', 'Learning resource concern', 'Instructional support inquiry'] },
  SGOD: { intro: 'School governance, learner support, training, and monitoring services.', services: ['Training or activity request', 'Learner support concern', 'Governance or monitoring inquiry'] },
  OSDS: { intro: 'Executive actions, travel orders, signatures, and approvals.', services: ['Travel order for signature', 'Memorandum or document approval', 'Follow up an executive action'] },
  'Legal Unit': { intro: 'Legal review and document-related consultation.', services: ['Request legal review', 'Request legal opinion or consultation'] },
  'Guided routing': { intro: 'Describe what you need. A designated service desk officer will guide or route your request.', services: ['Help me find the right office'] },
};

// Only units with a live workflow and unit-scoped queue may accept requests.
const enabledRequestUnits = ['ICT Unit'];

const ictRequestCatalog = {
  'Request DTR': {
    intro: 'Request your printed Daily Time Record or ask the ICT service desk to check a DTR concern.',
    copy: 'Tell us which DTR period you need and where it should be released.',
    fields: '<div class="ict-form-row"><label>Employee number<input name="employeeNumber" type="text" placeholder="e.g. 123456" /></label><label>School or office<input name="office" type="text" placeholder="Enter your school or office" /></label></div><div class="ict-form-row"><label>DTR period<input name="dtrPeriod" type="month" /></label><label>Preferred release method<select name="releaseMethod"><option value="Pick up at ICT Unit">Pick up at ICT Unit</option><option value="Coordinate with our office">Coordinate with our office</option></select></label></div><label>Additional notes<textarea name="details" rows="3" placeholder="Add a note for the ICT service desk (optional)."></textarea></label>',
  },
  'Report biometric or DTR concern': {
    intro: 'Report a missing log, incorrect time entry, or other concern with your biometric or DTR record.',
    copy: 'Give ICT enough detail to locate the record and investigate the concern.',
    fields: '<div class="ict-form-row"><label>Employee number<input name="employeeNumber" type="text" placeholder="e.g. 123456" /></label><label>School or office<input name="office" type="text" placeholder="Enter your school or office" /></label></div><div class="ict-form-row"><label>Concern date<input name="concernDate" type="date" /></label><label>Concern type<select name="concernType"><option value="Missing biometric log">Missing biometric log</option><option value="Incorrect time entry">Incorrect time entry</option><option value="DTR not available">DTR not available</option><option value="Other concern">Other concern</option></select></label></div><label>What happened?<textarea name="details" rows="3" placeholder="Describe the date, time, and concern."></textarea></label>',
  },
  'Reset DepEd email account password': {
    intro: 'Request assistance resetting your official DepEd email account password.',
    copy: 'Provide the identity and school details ICT needs to verify the account before assisting with the reset.',
    fields: '<div class="ict-form-row"><label>Birthday<input name="birthday" type="date" required /></label><label>School<input name="school" type="text" placeholder="Enter your school name" required /></label></div><label>School ID<input name="schoolId" type="text" placeholder="Enter your school ID" required /></label><label>Recovery email<input name="recoveryEmail" type="email" placeholder="your.personal@email.com" autocomplete="email" required /></label><label>Additional notes<textarea name="details" rows="3" placeholder="Tell ICT what happened (optional)."></textarea></label>',
  },
  'Request a new DepEd email account': {
    intro: 'Request an official DepEd email account for a newly hired or newly assigned employee.',
    copy: 'Provide complete identity and school details so ICT can verify the request before creating the account.',
    fields: '<div class="ict-form-row"><label>First name<input name="firstName" type="text" placeholder="Enter first name" autocomplete="given-name" required /></label><label>Middle name<input name="middleName" type="text" placeholder="If applicable" autocomplete="additional-name" /></label></div><div class="ict-form-row"><label>Last name<input name="lastName" type="text" placeholder="Enter last name" autocomplete="family-name" required /></label><label>Suffix<select name="suffix"><option value="">No suffix</option><option value="Jr.">Jr.</option><option value="Sr.">Sr.</option><option value="II">II</option><option value="III">III</option><option value="IV">IV</option><option value="V">V</option></select></label></div><div class="ict-form-row"><label>Position<input name="position" type="text" placeholder="Enter your position" required /></label><label>School or office<input name="school" type="text" placeholder="Enter your school or office" required /></label></div><div class="ict-form-row"><label>School ID<input name="schoolId" type="text" placeholder="Enter your school ID" required /></label><label>Birthday<input name="birthday" type="date" required /></label></div><label>Additional notes<textarea name="details" rows="3" placeholder="Add any onboarding details for ICT (optional)."></textarea></label>',
  },
  'Request account access': {
    intro: 'Request access to an SDO system or ask ICT to review an account concern.',
    copy: 'Access requests are checked by ICT before an account is created or updated.',
    fields: '<div class="ict-form-row"><label>Employee number<input name="employeeNumber" type="text" placeholder="e.g. 123456" /></label><label>School or office<input name="office" type="text" placeholder="Enter your school or office" /></label></div><div class="ict-form-row"><label>System or service<select name="system"><option value="SDO OneStop">SDO OneStop</option><option value="DTR System">DTR System</option><option value="Other SDO system">Other SDO system</option></select></label><label>Access needed<select name="accessType"><option value="New account">New account</option><option value="Reset or unlock">Reset or unlock</option><option value="Update access">Update access</option></select></label></div><label>Reason for access<textarea name="details" rows="3" placeholder="Explain why this access is needed."></textarea></label>',
  },
  'Request technical or equipment support': {
    intro: 'Send a technical concern to the ICT service desk for review and assignment.',
    copy: 'Include the location, device, and urgency so ICT can respond efficiently.',
    fields: '<div class="ict-form-row"><label>School or office<input name="office" type="text" placeholder="Enter the location" /></label><label>Urgency<select name="urgency"><option value="Routine">Routine</option><option value="Needed this week">Needed this week</option><option value="Urgent service interruption">Urgent service interruption</option></select></label></div><div class="ict-form-row"><label>Concern type<select name="concernType"><option value="Computer or laptop">Computer or laptop</option><option value="Network or internet">Network or internet</option><option value="Printer or peripheral">Printer or peripheral</option><option value="Other technical concern">Other technical concern</option></select></label><label>Device or asset tag<input name="assetTag" type="text" placeholder="Optional asset number" /></label></div><label>Describe the concern<textarea name="details" rows="3" placeholder="What is happening? Include any error message."></textarea></label>',
  },
};

// Keep the public navigation identical on every page. Individual pages can stay
// focused on their content while this shared shell keeps links, search, and the
// responsive menu consistent across the OneStop experience.
function normalizeSharedHeader() {
  const header = document.querySelector('.site-header');
  if (!header) return;
  header.innerHTML = `
    <a class="brand" href="index.html" aria-label="SDO Romblon OneStop home">
      <span class="sdo-logo logo-mask"><img src="../assets/logos/deped-romblon.png" alt="SDO Romblon seal" /></span>
      <span class="brand-copy"><small>Schools Division Office</small><strong>Romblon OneStop</strong></span>
    </a>
    <button class="menu-toggle" type="button" aria-expanded="false" aria-controls="site-navigation"><span></span><span></span><span></span><b>Menu</b></button>
    <nav class="site-nav" id="site-navigation" aria-label="Primary navigation">
      <div class="nav-dropdown">
        <button class="nav-dropdown-trigger" type="button" aria-expanded="false" aria-controls="unit-menu">Choose a unit <span class="chevron" aria-hidden="true"></span></button>
        <div class="unit-menu" id="unit-menu">
          <p>Start a request</p>
          <a href="choose-unit.html">View all offices <span>↗</span></a>
          <a href="unit-services.html?unit=ICT%20Unit">ICT Unit <span>↗</span></a>
          <a href="unit-services.html?unit=OSDS">OSDS <span>↗</span></a>
          <a href="unit-services.html?unit=Personnel%20Unit">Personnel Unit <span>↗</span></a>
        </div>
      </div>
      <a href="how-it-works.html">How it works</a>
      <a href="help.html">Help</a>
      <a class="nav-sign-in" href="sign-in.html">Sign in <span>→</span></a>
    </nav>`;
}

normalizeSharedHeader();

function createPageLoader() {
  if (document.querySelector('.page-loader')) return document.querySelector('.page-loader');
  const loader = document.createElement('div');
  loader.className = 'page-loader';
  loader.setAttribute('aria-hidden', 'true');
  loader.innerHTML = '<div class="loader-orbit loader-orbit-one"></div><div class="loader-orbit loader-orbit-two"></div><div class="loader-card"><span class="loader-logo logo-mask"><img src="../assets/logos/deped-romblon.png" alt="" /></span><span class="loader-spinner"></span><strong>SDO Romblon OneStop</strong><small class="loader-message">Opening your request space</small><span class="loader-progress"><i></i></span></div>';
  document.body.appendChild(loader);
  return loader;
}

function showPageLoader(message = 'Opening your request space', duration = 520) {
  const loader = createPageLoader();
  const messageElement = loader.querySelector('.loader-message');
  if (messageElement) messageElement.textContent = message;
  loader.classList.remove('is-hidden');
  window.clearTimeout(loader.hideTimer);
  if (duration > 0) loader.hideTimer = window.setTimeout(() => loader.classList.add('is-hidden'), duration);
}

function hidePageLoader() {
  const loader = document.querySelector('.page-loader');
  if (!loader) return;
  window.clearTimeout(loader.hideTimer);
  loader.classList.add('is-hidden');
}

window.showPageLoader = showPageLoader;
window.hidePageLoader = hidePageLoader;

function enablePageTransitions() {
  document.addEventListener('click', (event) => {
    const link = event.target.closest('a');
    if (!link || link.getAttribute('aria-disabled') === 'true' || link.target === '_blank' || link.hasAttribute('download')) return;
    const href = link.getAttribute('href');
    if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('http')) return;
    event.preventDefault();
    showPageLoader('Opening ' + (link.textContent.trim() || 'your request'), 420);
    window.setTimeout(() => { window.location.href = href; }, 190);
  });
  document.querySelectorAll('button.primary-action[type="button"]:not(.ict-review-button):not(.ict-submit-preview)').forEach((button) => button.addEventListener('click', () => showPageLoader('Preparing your secure request', 760)));
}

enablePageTransitions();

function addAgencyFooter() {
  if (document.body.classList.contains('home-page') || document.querySelector('.agency-footer')) return;
  const footer = document.createElement('footer');
  footer.className = 'agency-footer';
  footer.innerHTML = '<div class="footer-brand"><span class="footer-sdo-logo logo-mask"><img src="../assets/logos/deped-romblon.png" alt="SDO Romblon seal" /></span><span><strong>SDO Romblon OneStop</strong><small>Schools Division Office of Romblon</small></span></div><p>One secure place for requests, updates, and released documents.</p><span class="footer-deped-logo logo-mask"><img src="../assets/logos/kagawaran-ng-edukasyon.png" alt="Kagawaran ng Edukasyon" /></span>';
  document.body.appendChild(footer);
}

addAgencyFooter();

const commandEntries = [
  { title: 'Choose a unit', detail: 'Browse all SDO Romblon offices', href: 'choose-unit.html', terms: 'office unit services' },
  { title: 'Track a request', detail: 'Open a private request timeline', href: 'track-request.html', terms: 'tracking number follow up status' },
  { title: 'Sign in', detail: 'Access your OneStop account', href: 'sign-in.html', terms: 'login account employee staff' },
  { title: 'Help me find the right office', detail: 'Guided routing for uncertain requests', href: 'unit-services.html?unit=Guided%20routing', terms: 'help unsure guide route routing' },
  { title: 'Request DTR', detail: 'ICT Unit', href: 'request-form.html?service=Request%20DTR', terms: 'dtr biometric attendance print ict' },
  { title: 'Request a new DepEd email account', detail: 'ICT Unit', href: 'request-form.html?service=Request%20a%20new%20DepEd%20email%20account', terms: 'new employee deped email account registration ict' },
  { title: 'Reset DepEd email account password', detail: 'ICT Unit', href: 'request-form.html?service=Reset%20DepEd%20email%20account%20password', terms: 'deped email password reset account recovery ict' },
  { title: 'Travel order for signature', detail: 'OSDS', href: 'request-form.html?service=Travel%20order%20for%20signature', terms: 'travel order signature osds approval' },
  { title: 'Request service record', detail: 'Personnel Unit', href: 'request-form.html?service=Request%20service%20record', terms: 'service record personnel employment certificate' },
  { title: 'Check release inquiry', detail: 'Cashier Unit', href: 'request-form.html?service=Check%20release%20inquiry', terms: 'check payment cashier release' },
  { title: 'Budget availability inquiry', detail: 'Budget Unit', href: 'request-form.html?service=Budget%20availability%20inquiry', terms: 'budget allocation obligation' },
  { title: 'ICT Unit', detail: 'DTR, accounts, technical and equipment support', href: 'unit-services.html?unit=ICT%20Unit', terms: 'information communications technology computer system' },
  { title: 'OSDS', detail: 'Travel orders, signatures, and executive actions', href: 'unit-services.html?unit=OSDS', terms: 'superintendent memorandum approval executive' },
  { title: 'Personnel Unit', detail: 'Leave, employment, and employee records', href: 'unit-services.html?unit=Personnel%20Unit', terms: 'hr leave certificate employee' },
  { title: 'Records Unit', detail: 'Document tracking, retrieval, and certified copies', href: 'unit-services.html?unit=Records%20Unit', terms: 'records document ctc certified copy' },
];

function addCommandSearch() {
  const header = document.querySelector('.site-header');
  if (!header) return;

  const trigger = document.createElement('button');
  trigger.className = 'command-trigger';
  trigger.type = 'button';
  trigger.innerHTML = '<span class="search-mark" aria-hidden="true"></span><span class="command-label">Search</span><kbd>Ctrl K</kbd>';
  trigger.setAttribute('aria-haspopup', 'dialog');
  trigger.setAttribute('aria-label', 'Search services and actions. Press Control K.');

  const nav = header.querySelector('.site-nav');
  const compactSignIn = header.querySelector('.compact-sign-in');
  if (nav) nav.insertBefore(trigger, nav.querySelector('.nav-sign-in'));
  else if (compactSignIn) header.insertBefore(trigger, compactSignIn);
  else header.appendChild(trigger);

  const dialog = document.createElement('div');
  dialog.className = 'command-dialog';
  dialog.hidden = true;
  dialog.innerHTML = `
    <div class="command-backdrop" data-command-close></div>
    <section class="command-panel" role="dialog" aria-modal="true" aria-labelledby="command-title">
      <div class="command-search-row">
        <span class="search-mark" aria-hidden="true"></span>
        <input id="command-search-input" type="search" autocomplete="off" placeholder="Search a service, office, or action…" />
        <button type="button" class="command-close" data-command-close>Esc</button>
      </div>
      <div class="command-results" id="command-results" aria-live="polite"></div>
      <p class="command-footer" id="command-title"><span>Use ↑ ↓ to move</span><span>Enter to open</span><span>Esc to close</span></p>
    </section>`;
  document.body.appendChild(dialog);

  const input = dialog.querySelector('#command-search-input');
  const results = dialog.querySelector('#command-results');
  let activeIndex = 0;
  let visibleEntries = commandEntries;

  const renderResults = () => {
    const value = input.value.trim().toLowerCase();
    visibleEntries = commandEntries.filter((entry) => `${entry.title} ${entry.detail} ${entry.terms}`.toLowerCase().includes(value));
    activeIndex = Math.min(activeIndex, Math.max(visibleEntries.length - 1, 0));
    results.innerHTML = visibleEntries.length
      ? visibleEntries.map((entry, index) => `<a class="command-result${index === activeIndex ? ' is-active' : ''}" href="${entry.href}" data-command-index="${index}"><span><strong>${entry.title}</strong><small>${entry.detail}</small></span><b>↗</b></a>`).join('')
      : '<p class="no-results">No services found. Try a unit name, “DTR,” “travel order,” or “track request.”</p>';
  };

  const openDialog = () => { dialog.hidden = false; document.body.classList.add('command-open'); input.value = ''; activeIndex = 0; renderResults(); requestAnimationFrame(() => input.focus()); };
  const closeDialog = () => { dialog.hidden = true; document.body.classList.remove('command-open'); trigger.focus(); };

  trigger.addEventListener('click', openDialog);
  dialog.querySelectorAll('[data-command-close]').forEach((button) => button.addEventListener('click', closeDialog));
  input.addEventListener('input', () => { activeIndex = 0; renderResults(); });
  input.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowDown' && visibleEntries.length) { event.preventDefault(); activeIndex = (activeIndex + 1) % visibleEntries.length; renderResults(); }
    if (event.key === 'ArrowUp' && visibleEntries.length) { event.preventDefault(); activeIndex = (activeIndex - 1 + visibleEntries.length) % visibleEntries.length; renderResults(); }
    if (event.key === 'Enter' && visibleEntries[activeIndex]) window.location.href = visibleEntries[activeIndex].href;
  });
  document.addEventListener('keydown', (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); dialog.hidden ? openDialog() : closeDialog(); }
    if (event.key === 'Escape' && !dialog.hidden) closeDialog();
  });
}

addCommandSearch();

const menuToggle = document.querySelector('.menu-toggle');
const siteNav = document.querySelector('.site-nav');
const dropdownTrigger = document.querySelector('.nav-dropdown-trigger');
const unitMenu = document.querySelector('.unit-menu');

if (menuToggle && siteNav) {
  const closeNavigation = () => {
    siteNav.classList.remove('is-open');
    menuToggle.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('nav-open');
    if (unitMenu && dropdownTrigger) {
      unitMenu.classList.remove('is-open');
      dropdownTrigger.setAttribute('aria-expanded', 'false');
    }
  };

  menuToggle.addEventListener('click', () => {
    const isOpen = siteNav.classList.toggle('is-open');
    menuToggle.setAttribute('aria-expanded', String(isOpen));
    document.body.classList.toggle('nav-open', isOpen);
  });

  document.addEventListener('click', (event) => {
    if (siteNav.classList.contains('is-open') && !event.target.closest('.site-header')) closeNavigation();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && siteNav.classList.contains('is-open')) closeNavigation();
  });
  siteNav.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeNavigation));
}

if (dropdownTrigger && unitMenu) {
  dropdownTrigger.addEventListener('click', () => {
    const isOpen = unitMenu.classList.toggle('is-open');
    dropdownTrigger.setAttribute('aria-expanded', String(isOpen));
  });
}

document.addEventListener('click', (event) => {
  if (dropdownTrigger && unitMenu && !event.target.closest('.nav-dropdown')) {
    unitMenu.classList.remove('is-open');
    dropdownTrigger.setAttribute('aria-expanded', 'false');
  }
});

const serviceOptions = document.querySelector('#service-options');
if (serviceOptions) {
  const params = new URLSearchParams(window.location.search);
  const unitName = params.get('unit') || '';
  const unit = unitCatalog[unitName] || unitCatalog['Guided routing'];
  const title = document.querySelector('#unit-title');
  const description = document.querySelector('#unit-description');
  const statusLabel = document.querySelector('.service-page > .eyebrow');
  if (title) title.textContent = unitName in unitCatalog ? unitName : 'Choose an office';

  const isGuidedRouting = unitName === 'Guided routing';
  if (!enabledRequestUnits.includes(unitName) && !isGuidedRouting) {
    if (statusLabel) statusLabel.textContent = 'COMING SOON';
    if (description) description.textContent = unitName
      ? `Online requests for ${unitName in unitCatalog ? unitName : 'this office'} are not available yet. We are preparing this service. ICT Unit is currently accepting requests.`
      : 'Choose an office to see its online request status. ICT Unit is currently accepting requests.';
    serviceOptions.classList.add('service-options-unavailable');
    const notice = document.createElement('section');
    notice.className = 'service-unavailable-card';
    notice.setAttribute('role', 'status');
    const heading = document.createElement('strong');
    heading.textContent = 'Coming soon';
    const copy = document.createElement('p');
    copy.textContent = unitName ? `Services for ${unitName in unitCatalog ? unitName : 'this office'} are being prepared.` : 'Choose an office to view available services.';
    const link = document.createElement('a');
    link.href = 'unit-services.html?unit=ICT%20Unit';
    link.textContent = 'Browse available ICT services';
    notice.append(heading, copy, link);
    serviceOptions.replaceChildren(notice);
  } else {
    if (statusLabel) statusLabel.textContent = isGuidedRouting ? 'GUIDED HELP' : 'AVAILABLE SERVICES';
    if (description) description.textContent = unit.intro;
    serviceOptions.innerHTML = unit.services.map((service) => `<a href="request-form.html?service=${encodeURIComponent(service)}&unit=${encodeURIComponent(unitName)}">${service}<span>↗</span></a>`).join('');
  }
}
const requestTitle = document.querySelector('#request-service-title');
if (requestTitle) {
  const service = new URLSearchParams(window.location.search).get('service');
  if (service) requestTitle.textContent = service;
}

const requestParameters = new URLSearchParams(window.location.search);
const requestedService = requestParameters.get('service') || 'Request DTR';
const requestedUnit = requestParameters.get('unit') || Object.entries(unitCatalog).find(([, unit]) => unit.services.includes(requestedService))?.[0] || '';
const isGuidedRoutingRequest = requestedUnit === 'Guided routing' && requestedService === 'Help me find the right office';
const requestFormAvailable = (enabledRequestUnits.includes(requestedUnit) || isGuidedRoutingRequest)
  && Boolean(unitCatalog[requestedUnit]?.services.includes(requestedService));
const ictFields = document.querySelector('#ict-fields');
if (ictFields && !requestFormAvailable) {
  const card = ictFields.closest('.ict-request-card');
  const form = document.querySelector('#ict-request-form');
  const introKicker = card?.querySelector('.ict-card-intro .form-kicker');
  const introTitle = card?.querySelector('#request-service-title');
  const introCopy = card?.querySelector('#request-service-intro');
  if (introKicker) introKicker.textContent = 'SERVICE COMING SOON';
  if (introTitle) introTitle.textContent = requestedService;
  if (introCopy) introCopy.textContent = `Online requests for ${requestedUnit || 'this service'} are not available yet. ICT Unit is currently accepting requests.`;
  const formHeading = card?.querySelector('.ict-form-heading');
  if (formHeading) formHeading.hidden = true;
  if (form) form.hidden = true;
  const notice = document.createElement('section');
  notice.className = 'request-unavailable-notice';
  notice.setAttribute('role', 'status');
  const heading = document.createElement('strong');
  heading.textContent = 'Coming soon';
  const copy = document.createElement('p');
  copy.textContent = `We are preparing ${requestedUnit || 'this service'} for online requests.`;
  const link = document.createElement('a');
  link.className = 'primary-action';
  link.href = `unit-services.html?unit=${encodeURIComponent(enabledRequestUnits[0])}`;
  link.textContent = 'Browse available services';
  notice.append(heading, copy, link);
  if (form) form.before(notice);
}
const ictRequestForm = document.querySelector('#ict-request-form');
if (ictFields && ictRequestForm && requestFormAvailable) {
  const selectedService = new URLSearchParams(window.location.search).get('service') || 'Request DTR';
  const selectedUnitService = ictRequestCatalog[selectedService] || {
    intro: isGuidedRoutingRequest ? 'Tell us what you need. The ICT service desk will help identify the right office.' : `Send your ${requestedUnit} request to the appropriate service desk for review.`,
    copy: isGuidedRoutingRequest ? 'Describe what you are trying to do or ask about.' : `Add the details ${requestedUnit} needs to review and respond to your request.`,
    fields: `<label>${isGuidedRoutingRequest ? 'What do you need help with?' : 'Request details'}<textarea name="details" rows="4" placeholder="${isGuidedRoutingRequest ? 'Describe what you need help with.' : `Describe your ${requestedUnit} request and include any useful reference numbers.`}"></textarea></label>`,
  };
  const resolvedTitle = selectedService;
  const intro = document.querySelector('#request-service-intro');
  const contextTitle = document.querySelector('#service-context-title');
  const contextCopy = document.querySelector('#service-context-copy');
  if (requestTitle) requestTitle.textContent = resolvedTitle;
  if (intro) intro.textContent = selectedUnitService.intro;
  if (contextTitle) contextTitle.textContent = resolvedTitle;
  if (contextCopy) contextCopy.textContent = selectedUnitService.copy;
  ictFields.innerHTML = selectedUnitService.fields;
  const requesterEmailLabel = ictRequestForm.querySelector('#requester-email-label');
  const requesterEmailInput = ictRequestForm.querySelector('input[name="email"]');
  const requesterEmailHelper = document.querySelector('#requester-email-helper');
  const requesterNameLabel = ictRequestForm.querySelector('#requester-name-label');
  const requesterNameInput = ictRequestForm.querySelector('#requester-full-name');
  const isDepedEmailReset = selectedService === 'Reset DepEd email account password';
  const isNewDepedEmail = selectedService === 'Request a new DepEd email account';
  if (requesterEmailLabel) requesterEmailLabel.firstChild.textContent = isDepedEmailReset ? 'DepEd email' : isNewDepedEmail ? 'Personal/recovery email' : 'Official email';
  if (requesterEmailInput) {
    if (isDepedEmailReset) requesterEmailInput.setAttribute('pattern', '^[^\\s@]+@deped\\.gov\\.ph$');
    else requesterEmailInput.removeAttribute('pattern');
    requesterEmailInput.placeholder = isDepedEmailReset ? 'name@deped.gov.ph' : isNewDepedEmail ? 'your.personal@email.com' : 'name@deped.gov.ph';
    requesterEmailInput.title = isDepedEmailReset ? 'Use the official @deped.gov.ph email address.' : '';
  }
  if (requesterEmailHelper) requesterEmailHelper.textContent = isDepedEmailReset ? 'This identifies the existing DepEd account. The notice will be sent to the recovery email below.' : isNewDepedEmail ? 'ICT will send the activation notice to this personal/recovery email.' : 'Use an email address ICT can use for request updates.';
  let syncNewEmployeeName = () => {};
  if (requesterNameLabel && requesterNameInput) {
    requesterNameLabel.hidden = isNewDepedEmail;
    requesterNameInput.required = !isNewDepedEmail;
    if (isNewDepedEmail) {
      syncNewEmployeeName = () => {
        const first = ictRequestForm.querySelector('[name="firstName"]')?.value.trim() || '';
        const middle = ictRequestForm.querySelector('[name="middleName"]')?.value.trim() || '';
        const last = ictRequestForm.querySelector('[name="lastName"]')?.value.trim() || '';
        const suffix = ictRequestForm.querySelector('[name="suffix"]')?.value.trim() || '';
        requesterNameInput.value = [first, middle, last, suffix].filter(Boolean).join(' ');
      };
      ictRequestForm.querySelectorAll('[name="firstName"],[name="middleName"],[name="lastName"],[name="suffix"]').forEach((field) => field.addEventListener('input', syncNewEmployeeName));
      ictRequestForm.querySelectorAll('[name="suffix"]').forEach((field) => field.addEventListener('change', syncNewEmployeeName));
      syncNewEmployeeName();
    }
  }

  const reviewModal = document.querySelector('#ict-review-modal');
  const reviewSummary = document.querySelector('#ict-review-summary');
  const reviewButton = document.querySelector('.ict-review-button');
  const reviewCloseButtons = document.querySelectorAll('[data-review-close]');
  const renderReview = () => {
    if (!reviewSummary) return;
    syncNewEmployeeName();
    const escapeReviewValue = (value) => String(value ?? '').replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character]));
    const values = Array.from(ictRequestForm.querySelectorAll('input, select, textarea')).filter((field) => field.type !== 'file' && field.value.trim() && !(isNewDepedEmail && field.name === 'fullName'));
    const attachment = document.querySelector('#ict-attachment');
    const rows = values.map((field) => {
      const label = field.closest('label');
      const labelText = label ? Array.from(label.childNodes).find((node) => node.nodeType === Node.TEXT_NODE)?.textContent.trim() : '';
      const readableName = field.name.replace(/([A-Z])/g, ' $1').replace(/^./, (character) => character.toUpperCase());
      return `<div><span>${escapeReviewValue(labelText || readableName)}</span><strong>${escapeReviewValue(field.value)}</strong></div>`;
    });
    if (attachment && attachment.files[0]) rows.push(`<div><span>Supporting file</span><strong>${escapeReviewValue(attachment.files[0].name)}</strong></div>`);
    reviewSummary.innerHTML = rows.length ? rows.join('') : '<p class="ict-empty-review">Add your details before reviewing this request.</p>';
  };
  const closeReviewModal = () => {
    if (!reviewModal) return;
    reviewModal.hidden = true;
    document.body.classList.remove('modal-open');
  };
  if (reviewButton && reviewModal) reviewButton.addEventListener('click', () => {
    if (!ictRequestForm.reportValidity()) return;
    renderReview();
    reviewModal.hidden = false;
    document.body.classList.add('modal-open');
    reviewModal.querySelector('.modal-close')?.focus();
  });
  reviewCloseButtons.forEach((button) => button.addEventListener('click', closeReviewModal));
  if (reviewModal) reviewModal.addEventListener('click', (event) => { if (event.target === reviewModal) closeReviewModal(); });
}

const passwordToggle = document.querySelector('.password-toggle');
const passwordInput = document.querySelector('#staff-password');
if (passwordToggle && passwordInput) {
  passwordToggle.addEventListener('click', () => {
    const isVisible = passwordInput.type === 'text';
    passwordInput.type = isVisible ? 'password' : 'text';
    passwordToggle.textContent = isVisible ? 'Show' : 'Hide';
    passwordToggle.setAttribute('aria-label', isVisible ? 'Show password' : 'Hide password');
  });
}

// Mark units that are not accepting online requests yet. Keep the notice
// inside the selected card and clear it when the pointer or focus leaves.
const unitDirectory = document.querySelector('.unit-directory-page .unit-grid');
if (unitDirectory) {
  const unavailableUnitCards = [];
  unitDirectory.querySelectorAll(':scope > a').forEach((card) => {
    const href = new URL(card.href, window.location.href);
    const unitName = href.searchParams.get('unit') || '';
    const status = card.querySelector('b');
    if (card.classList.contains('guided-unit')) return;
    if (enabledRequestUnits.includes(unitName)) {
      if (status) status.textContent = 'Available ↗';
      return;
    }

    card.classList.add('unit-card-unavailable');
    card.setAttribute('aria-disabled', 'true');
    card.setAttribute('href', '#coming-soon');
    if (status) status.textContent = 'Coming soon';
    const face = document.createElement('span');
    face.className = 'unit-card-face';
    while (card.firstChild) face.append(card.firstChild);
    const notice = document.createElement('span');
    notice.className = 'unit-card-notice';
    notice.setAttribute('role', 'status');
    notice.setAttribute('aria-hidden', 'true');
    notice.innerHTML = '<strong>Coming soon</strong><small>Online requests for this office are being prepared. ICT Unit is currently accepting requests.</small>';
    card.append(face, notice);

    let clickedOpen = false;
    const showNotice = () => {
      card.classList.add('is-unavailable-open');
      face.setAttribute('aria-hidden', 'true');
      notice.setAttribute('aria-hidden', 'false');
    };
    const hideNotice = () => {
      card.classList.remove('is-unavailable-open');
      face.setAttribute('aria-hidden', 'false');
      notice.setAttribute('aria-hidden', 'true');
    };
    const closeIfLeft = () => {
      if (!card.matches(':hover') && !card.matches(':focus')) hideNotice();
    };
    const dismissNotice = () => { clickedOpen = false; hideNotice(); };
    card.addEventListener('pointerenter', showNotice);
    card.addEventListener('pointerleave', () => { if (!clickedOpen && !card.matches(':focus')) hideNotice(); });
    card.addEventListener('focus', showNotice);
    card.addEventListener('blur', closeIfLeft);
    card.addEventListener('click', (event) => {
      event.preventDefault();
      clickedOpen = !clickedOpen;
      if (clickedOpen) showNotice();
      else hideNotice();
    });
    card.addEventListener('keydown', (event) => {
      if (event.key === ' ') {
        event.preventDefault();
        clickedOpen = !clickedOpen;
        if (clickedOpen) showNotice();
        else hideNotice();
      }
    });
    unavailableUnitCards.push({ card, dismissNotice });
  });
  document.addEventListener('pointerdown', (event) => {
    unavailableUnitCards.forEach(({ card, dismissNotice }) => {
      if (!card.contains(event.target)) dismissNotice();
    });
  });
}
// Load the shared Firebase session guard on every portal page. Pages that
// already include the module reuse the browser's cached module instance.
if (!document.querySelector('script[src$="firebase-client.js"]')) {
  import('./firebase-client.js').catch(() => {});
}
