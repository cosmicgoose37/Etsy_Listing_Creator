const SIZE = 2000;

if (window.pdfjsLib) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
}

const PROFILES_STORAGE_KEY = 'etsyImageMaker.profiles.v2';
const OLD_BRAND_STORAGE_KEY = 'etsyImageMaker.brand.v1';
const THEME_KEY = 'etsyImageMaker.theme';
const WATERMARK_SECTION_OPEN_KEY = 'etsyImageMaker.watermarkSectionOpen';
const PRODUCT_NAME_HISTORY_KEY = 'etsyImageMaker.productNameHistory';
const PRODUCT_NAME_HISTORY_MAX = 30;

// Four fixed color schemes for now, in place of a full custom color picker.
const COLOR_SCHEME_KEY = 'etsyImageMaker.colorScheme';
const COLOR_SCHEMES = [
  { id: 'orange', name: 'Orange', primary: '#c96b4f', accent: '#f4e9dd' },
  { id: 'teal', name: 'Dark Teal', primary: '#1f5f58', accent: '#e7f2f0' },
  { id: 'plum', name: 'Plum', primary: '#7d3b60', accent: '#f7ebf1' },
  { id: 'navy', name: 'Navy', primary: '#2f4a68', accent: '#eaf0f7' },
];

// =========================================================================
// Shared product-data facts — every template pulls wording from here so the
// same claim (page sizes, digital-only status, ZIP count) can't drift into
// inconsistent copy across the 7 listing images.
// =========================================================================
const PLACEHOLDER_SIZES = [9, 16, 25];
const PLACEHOLDER_SIZES_LIST = PLACEHOLDER_SIZES.join(', ').replace(/, ([^,]*)$/, ' or $1');
const IS_DIGITAL_PRODUCT = true;
const ZIP_FILE_COUNT = 1;
const DIGITAL_DISCLAIMER = 'Digital product only • No physical item will be shipped';

function zipFileWord(count) {
  return count === 1 ? 'ZIP file' : 'ZIP files';
}

// =========================================================================
// Theme (dark mode)
// =========================================================================
function systemPrefersDark() {
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function isEffectivelyDark() {
  const explicit = document.documentElement.getAttribute('data-theme');
  return explicit === 'dark' || (!explicit && systemPrefersDark());
}

function updateThemeIcon() {
  const dark = isEffectivelyDark();
  const sun = document.getElementById('themeIconSun');
  const moon = document.getElementById('themeIconMoon');
  // toggleAttribute (not .hidden=) — some browsers don't reflect the JS
  // `hidden` property back to the content attribute on SVG elements, which
  // silently breaks the CSS [hidden] selector these icons rely on.
  if (sun) sun.toggleAttribute('hidden', dark);
  if (moon) moon.toggleAttribute('hidden', !dark);
}

function initTheme() {
  updateThemeIcon();
  const toggle = document.getElementById('themeToggle');
  if (toggle) {
    toggle.addEventListener('click', () => {
      const next = isEffectivelyDark() ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      try { localStorage.setItem(THEME_KEY, next); } catch (e) { /* ignore */ }
      updateThemeIcon();
    });
  }
  if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
      if (!document.documentElement.getAttribute('data-theme')) updateThemeIcon();
    });
  }
}

initTheme();

const els = {
  form: document.getElementById('listingForm'),
  profileSelect: document.getElementById('profileSelect'),
  newProfileBtn: document.getElementById('newProfileBtn'),
  renameProfileBtn: document.getElementById('renameProfileBtn'),
  deleteProfileBtn: document.getElementById('deleteProfileBtn'),
  companyName: document.getElementById('companyName'),
  colorSchemeRow: document.getElementById('colorSchemeRow'),
  fontChoice: document.getElementById('fontChoice'),
  productType: document.getElementById('productType'),
  gradeSubjectRow: document.getElementById('gradeSubjectRow'),
  checklistImagesSection: document.getElementById('checklistImagesSection'),
  checklistImgChecklist: document.getElementById('checklistImgChecklist'),
  checklistImgChecklistPreview: document.getElementById('checklistImgChecklistPreview'),
  checklistImgChecklistStatus: document.getElementById('checklistImgChecklistStatus'),
  checklistImgColor: document.getElementById('checklistImgColor'),
  checklistImgColorPreview: document.getElementById('checklistImgColorPreview'),
  checklistImgColorStatus: document.getElementById('checklistImgColorStatus'),
  checklistImgGrey: document.getElementById('checklistImgGrey'),
  checklistImgGreyPreview: document.getElementById('checklistImgGreyPreview'),
  checklistImgGreyStatus: document.getElementById('checklistImgGreyStatus'),
  checklistImgSize9: document.getElementById('checklistImgSize9'),
  checklistImgSize9Preview: document.getElementById('checklistImgSize9Preview'),
  checklistImgSize9Status: document.getElementById('checklistImgSize9Status'),
  checklistImgSize16: document.getElementById('checklistImgSize16'),
  checklistImgSize16Preview: document.getElementById('checklistImgSize16Preview'),
  checklistImgSize16Status: document.getElementById('checklistImgSize16Status'),
  checklistImgSize25: document.getElementById('checklistImgSize25'),
  checklistImgSize25Preview: document.getElementById('checklistImgSize25Preview'),
  checklistImgSize25Status: document.getElementById('checklistImgSize25Status'),
  productName: document.getElementById('productName'),
  productNameHistory: document.getElementById('productNameHistory'),
  clearProductNameHistoryBtn: document.getElementById('clearProductNameHistoryBtn'),
  gradeLevel: document.getElementById('gradeLevel'),
  subject: document.getElementById('subject'),
  tagline: document.getElementById('tagline'),
  bullets: document.getElementById('bullets'),
  howItWorks: document.getElementById('howItWorks'),
  clearTypeContentBtn: document.getElementById('clearTypeContentBtn'),
  typeContentStatus: document.getElementById('typeContentStatus'),
  badgeOptions: document.getElementById('badgeOptions'),
  customBadge: document.getElementById('customBadge'),
  gallery: document.getElementById('gallery'),
  emptyState: document.getElementById('emptyState'),
  validationWarnings: document.getElementById('validationWarnings'),
  downloadAllBtn: document.getElementById('downloadAllBtn'),
  statusMsg: document.getElementById('statusMsg'),
  seoPanel: document.getElementById('seoPanel'),
  seoTitles: document.getElementById('seoTitles'),
  seoTags: document.getElementById('seoTags'),
  seoTagCount: document.getElementById('seoTagCount'),
  copyTagsBtn: document.getElementById('copyTagsBtn'),
  watermarkSection: document.getElementById('watermarkSection'),
  watermarkEnabled: document.getElementById('watermarkEnabled'),
  watermarkOptions: document.getElementById('watermarkOptions'),
  watermarkText: document.getElementById('watermarkText'),
  watermarkStyle: document.getElementById('watermarkStyle'),
  watermarkColor: document.getElementById('watermarkColor'),
  watermarkColorHex: document.getElementById('watermarkColorHex'),
  watermarkOpacity: document.getElementById('watermarkOpacity'),
  watermarkOpacityLabel: document.getElementById('watermarkOpacityLabel'),
  watermarkTargets: document.getElementById('watermarkTargets'),
};

let generatedCanvases = []; // { name, canvas }
let lastTags = [];

// Pre-export validation — collected while drawing, surfaced as a non-
// blocking banner after generation so nothing is ever silently clipped or
// distorted without the user knowing about it.
let generationWarnings = [];
function warnOnce(msg) {
  if (!generationWarnings.includes(msg)) generationWarnings.push(msg);
}

// =========================================================================
// Color scheme (2 fixed options, saved locally)
// =========================================================================
function loadColorSchemeId() {
  try {
    const saved = localStorage.getItem(COLOR_SCHEME_KEY);
    if (COLOR_SCHEMES.some(s => s.id === saved)) return saved;
  } catch (e) { /* ignore */ }
  return COLOR_SCHEMES[0].id;
}

let selectedColorSchemeId = loadColorSchemeId();

function renderColorSchemeOptions() {
  els.colorSchemeRow.querySelectorAll('.color-scheme-option').forEach(btn => {
    btn.classList.toggle('selected', btn.dataset.scheme === selectedColorSchemeId);
  });
}

els.colorSchemeRow.querySelectorAll('.color-scheme-option').forEach(btn => {
  btn.addEventListener('click', () => {
    selectedColorSchemeId = btn.dataset.scheme;
    try { localStorage.setItem(COLOR_SCHEME_KEY, selectedColorSchemeId); } catch (e) { /* ignore */ }
    renderColorSchemeOptions();
  });
});
renderColorSchemeOptions();

// =========================================================================
// Brand profiles
// =========================================================================
function defaultProfile(name) {
  return {
    id: 'p_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
    name: name || 'My Shop',
    companyName: '',
    font: 'Poppins',
    watermarkEnabled: false,
    watermarkText: '',
    watermarkStyle: 'tiled',
    watermarkColor: '#ffffff',
    watermarkOpacity: 30,
    watermarkTargets: ['hero', 'showcase', 'sizes', 'printstyle', 'checklistguide'],
  };
}

function loadProfilesState() {
  try {
    const raw = localStorage.getItem(PROFILES_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) { /* fall through */ }

  // migrate from the old single-brand storage if present
  try {
    const oldRaw = localStorage.getItem(OLD_BRAND_STORAGE_KEY);
    if (oldRaw) {
      const old = JSON.parse(oldRaw);
      const p = defaultProfile(old.companyName || 'My Shop');
      p.companyName = old.companyName || '';
      p.font = old.font || p.font;
      return { profiles: [p], activeId: p.id };
    }
  } catch (e) { /* fall through */ }

  const p = defaultProfile('My Shop');
  return { profiles: [p], activeId: p.id };
}

let profilesState = loadProfilesState();

// One-time seed: make "CurrentTrove" available as a selectable Brand
// profile. Purely additive — never renames or overwrites a profile the
// user has already set up. If the only profile that exists is still the
// pristine, untouched default (blank Shop Name), switch to the new one so
// it's immediately usable instead of requiring a manual selection first.
if (!profilesState.profiles.some(p => p.name === 'CurrentTrove')) {
  const wasUntouchedDefault = profilesState.profiles.length === 1 &&
    profilesState.profiles[0].name === 'My Shop' &&
    !profilesState.profiles[0].companyName;
  const currentTroveProfile = defaultProfile('CurrentTrove');
  currentTroveProfile.companyName = 'CurrentTrove';
  profilesState.profiles.push(currentTroveProfile);
  if (wasUntouchedDefault) profilesState.activeId = currentTroveProfile.id;
  saveProfilesState();
}

function saveProfilesState() {
  localStorage.setItem(PROFILES_STORAGE_KEY, JSON.stringify(profilesState));
}

function getActiveProfile() {
  return profilesState.profiles.find(p => p.id === profilesState.activeId) || profilesState.profiles[0];
}

function renderProfileSelect() {
  els.profileSelect.innerHTML = '';
  profilesState.profiles.forEach(p => {
    const opt = document.createElement('option');
    opt.value = p.id;
    opt.textContent = p.name;
    if (p.id === profilesState.activeId) opt.selected = true;
    els.profileSelect.appendChild(opt);
  });
  // Belt-and-suspenders: some browsers restore a <select>'s value from their
  // own form-history cache after a background tab reload/bfcache restore,
  // silently overriding the `selected` attribute above. Force it explicitly
  // so the dropdown can never drift from our own saved active profile.
  els.profileSelect.value = profilesState.activeId;
}

// Re-assert the correct profile whenever this tab regains focus/visibility —
// guards against the browser's own background-tab reload or form-restore
// logic swapping the visible profile out from under the user.
function resyncProfileUI() {
  profilesState = loadProfilesState();
  renderProfileSelect();
  applyProfileToForm(getActiveProfile());
}

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') resyncProfileUI();
});
window.addEventListener('pageshow', () => resyncProfileUI());

function applyProfileToForm(p) {
  els.companyName.value = p.companyName || '';
  els.fontChoice.value = p.font || 'Poppins';

  els.watermarkEnabled.checked = !!p.watermarkEnabled;
  els.watermarkOptions.hidden = !p.watermarkEnabled;
  els.watermarkText.value = p.watermarkText || '';
  els.watermarkStyle.value = p.watermarkStyle || 'tiled';
  els.watermarkColor.value = p.watermarkColor || '#ffffff';
  els.watermarkColorHex.value = els.watermarkColor.value.toUpperCase();
  els.watermarkOpacity.value = p.watermarkOpacity != null ? p.watermarkOpacity : 30;
  els.watermarkOpacityLabel.textContent = `${els.watermarkOpacity.value}%`;
  const targets = new Set(p.watermarkTargets || ['hero', 'showcase', 'sizes', 'printstyle', 'checklistguide']);
  els.watermarkTargets.querySelectorAll('input[type=checkbox]').forEach(cb => {
    cb.checked = targets.has(cb.value);
  });
}

function persistFormToActiveProfile() {
  const p = getActiveProfile();
  if (!p) return;
  p.companyName = els.companyName.value;
  p.font = els.fontChoice.value;
  p.watermarkEnabled = els.watermarkEnabled.checked;
  p.watermarkText = els.watermarkText.value;
  p.watermarkStyle = els.watermarkStyle.value;
  p.watermarkColor = els.watermarkColor.value;
  p.watermarkOpacity = Number(els.watermarkOpacity.value);
  p.watermarkTargets = [...els.watermarkTargets.querySelectorAll('input[type=checkbox]:checked')].map(cb => cb.value);
  saveProfilesState();
}

renderProfileSelect();
applyProfileToForm(getActiveProfile());

els.profileSelect.addEventListener('change', () => {
  profilesState.activeId = els.profileSelect.value;
  saveProfilesState();
  applyProfileToForm(getActiveProfile());
});

els.newProfileBtn.addEventListener('click', () => {
  const name = prompt('New brand profile name:', 'New Shop');
  if (!name) return;
  const p = defaultProfile(name.trim());
  profilesState.profiles.push(p);
  profilesState.activeId = p.id;
  saveProfilesState();
  renderProfileSelect();
  applyProfileToForm(p);
  setStatus(`Created profile "${p.name}".`);
});

els.renameProfileBtn.addEventListener('click', () => {
  const p = getActiveProfile();
  if (!p) return;
  const name = prompt('Rename brand profile:', p.name);
  if (!name) return;
  p.name = name.trim();
  saveProfilesState();
  renderProfileSelect();
  setStatus('Profile renamed.');
});

els.deleteProfileBtn.addEventListener('click', () => {
  if (profilesState.profiles.length <= 1) {
    alert("You need at least one brand profile — create another before deleting this one.");
    return;
  }
  const p = getActiveProfile();
  if (!confirm(`Delete brand profile "${p.name}"? This can't be undone.`)) return;
  profilesState.profiles = profilesState.profiles.filter(x => x.id !== p.id);
  profilesState.activeId = profilesState.profiles[0].id;
  saveProfilesState();
  renderProfileSelect();
  applyProfileToForm(getActiveProfile());
  setStatus('Profile deleted.');
});

[els.companyName, els.fontChoice,
  els.watermarkText, els.watermarkStyle, els.watermarkColor].forEach(el => {
  el.addEventListener('input', persistFormToActiveProfile);
  el.addEventListener('change', persistFormToActiveProfile);
});

els.watermarkEnabled.addEventListener('change', () => {
  els.watermarkOptions.hidden = !els.watermarkEnabled.checked;
  persistFormToActiveProfile();
});

els.watermarkOpacity.addEventListener('input', () => {
  els.watermarkOpacityLabel.textContent = `${els.watermarkOpacity.value}%`;
  persistFormToActiveProfile();
});

els.watermarkTargets.querySelectorAll('input[type=checkbox]').forEach(cb => {
  cb.addEventListener('change', persistFormToActiveProfile);
});

// Collapsed by default — it takes real space and most listings never touch
// it after the first setup, but remembers whichever state you leave it in.
try {
  if (localStorage.getItem(WATERMARK_SECTION_OPEN_KEY) === 'true') els.watermarkSection.open = true;
} catch (e) { /* ignore */ }
els.watermarkSection.addEventListener('toggle', () => {
  try { localStorage.setItem(WATERMARK_SECTION_OPEN_KEY, String(els.watermarkSection.open)); } catch (e) { /* ignore */ }
});

function syncGradeSubjectVisibility() {
  els.gradeSubjectRow.hidden = els.productType.value !== 'classroom';
}

// =========================================================================
// Checklist product type — one explicitly-labeled required image (the Color
// Placeholders preview) that builds the Hero Cover (see drawChecklistHero).
// Kept separate from the generic multi-image uploader so there's no
// ambiguity about which photo it is.
// =========================================================================
const checklistImages = { checklist: null, color: null, grey: null, size9: null, size16: null, size25: null };

function syncChecklistImagesVisibility() {
  els.checklistImagesSection.hidden = els.productType.value !== 'checklist';
}

function isPdfFile(file) {
  return file.type === 'application/pdf' || /\.pdf$/i.test(file.name);
}

// Renders page 1 of a PDF to a PNG data URL at a resolution large enough for
// the 2000x2000 exports, without ever upscaling past the page's own size.
async function renderPdfFirstPageToDataUrl(file) {
  const buf = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
  const page = await pdf.getPage(1);
  const unscaled = page.getViewport({ scale: 1 });
  const targetPx = 1800;
  const scale = Math.min(3, targetPx / Math.max(unscaled.width, unscaled.height));
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(viewport.width);
  canvas.height = Math.round(viewport.height);
  await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
  return canvas.toDataURL('image/png');
}

function loadChecklistImageFromDataUrl(dataUrl, key, previewEl, statusEl) {
  const img = new Image();
  img.onload = () => {
    checklistImages[key] = img;
    previewEl.innerHTML = `<img src="${dataUrl}" alt="" />`;
    statusEl.textContent = '— uploaded';
  };
  img.src = dataUrl;
}

function bindChecklistImageUpload(inputEl, previewEl, statusEl, key) {
  inputEl.addEventListener('change', async () => {
    const file = inputEl.files[0];
    if (!file) return;

    if (isPdfFile(file)) {
      statusEl.textContent = '— rendering PDF page 1…';
      try {
        const dataUrl = await renderPdfFirstPageToDataUrl(file);
        loadChecklistImageFromDataUrl(dataUrl, key, previewEl, statusEl);
      } catch (e) {
        statusEl.textContent = '— required';
        alert('Could not read that PDF. Please try a different file, or upload an image screenshot instead.');
      }
      return;
    }

    const reader = new FileReader();
    reader.onload = () => loadChecklistImageFromDataUrl(reader.result, key, previewEl, statusEl);
    reader.readAsDataURL(file);
  });
}

bindChecklistImageUpload(els.checklistImgChecklist, els.checklistImgChecklistPreview, els.checklistImgChecklistStatus, 'checklist');
bindChecklistImageUpload(els.checklistImgColor, els.checklistImgColorPreview, els.checklistImgColorStatus, 'color');
bindChecklistImageUpload(els.checklistImgGrey, els.checklistImgGreyPreview, els.checklistImgGreyStatus, 'grey');
bindChecklistImageUpload(els.checklistImgSize9, els.checklistImgSize9Preview, els.checklistImgSize9Status, 'size9');
bindChecklistImageUpload(els.checklistImgSize16, els.checklistImgSize16Preview, els.checklistImgSize16Status, 'size16');
bindChecklistImageUpload(els.checklistImgSize25, els.checklistImgSize25Preview, els.checklistImgSize25Status, 'size25');

function missingChecklistImageLabels() {
  const missing = [];
  if (!checklistImages.checklist) missing.push('Checklist Screenshot');
  if (!checklistImages.color) missing.push('Color Placeholders Preview');
  if (!checklistImages.grey) missing.push('Greyscale Placeholders Preview');
  if (!checklistImages.size9) missing.push('9 Cards/Page Layout Preview');
  if (!checklistImages.size16) missing.push('16 Cards/Page Layout Preview');
  if (!checklistImages.size25) missing.push('25 Cards/Page Layout Preview');
  return missing;
}

// Some badges don't make sense for certain product types (e.g. a checklist
// isn't "editable in Canva" or "no prep"). Types not listed here show every
// badge — this is an allowlist only for types that need it trimmed down.
const BADGE_ALLOWLIST_BY_TYPE = {
  checklist: ['Instant Download', 'Printable', 'Black & White + Color'],
};

function syncBadgeVisibility() {
  const allowed = BADGE_ALLOWLIST_BY_TYPE[els.productType.value];
  els.badgeOptions.querySelectorAll('.chip').forEach(chip => {
    const cb = chip.querySelector('input[type=checkbox]');
    const show = !allowed || allowed.includes(cb.value);
    chip.hidden = !show;
    if (!show && cb.checked) cb.checked = false;
  });
}

// =========================================================================
// Per-product-type content — Tagline, What's Included, How It Works, and
// Badges are remembered per Product Type rather than per brand profile,
// since the same kind of listing tends to reuse the same wording/badges
// regardless of which shop it's for.
// =========================================================================
const TYPE_CONTENT_KEY = 'etsyImageMaker.typeContent.v1';
const DEFAULT_TYPE_CONTENT = { tagline: '', bullets: '', howItWorks: '', customBadge: '', badges: ['Instant Download'] };

function loadTypeContent() {
  try {
    const raw = localStorage.getItem(TYPE_CONTENT_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) { /* ignore corrupt storage */ }
  return {};
}

let typeContent = loadTypeContent();
let suppressTypeContentSave = false;

function saveTypeContentState() {
  localStorage.setItem(TYPE_CONTENT_KEY, JSON.stringify(typeContent));
}

function updateTypeContentStatus() {
  const hasSaved = !!typeContent[els.productType.value];
  els.typeContentStatus.textContent = hasSaved
    ? 'Showing saved content for this type.'
    : 'No saved content yet for this type — saves automatically as you type.';
}

function saveCurrentFieldsToType() {
  if (suppressTypeContentSave) return;
  typeContent[els.productType.value] = {
    tagline: els.tagline.value,
    bullets: els.bullets.value,
    howItWorks: els.howItWorks.value,
    customBadge: els.customBadge.value,
    badges: [...els.badgeOptions.querySelectorAll('input[type=checkbox]:checked')].map(cb => cb.value),
  };
  saveTypeContentState();
  updateTypeContentStatus();
}

function applyTypeContent(type) {
  const saved = typeContent[type] || DEFAULT_TYPE_CONTENT;
  suppressTypeContentSave = true;
  els.tagline.value = saved.tagline || '';
  els.bullets.value = saved.bullets || '';
  els.howItWorks.value = saved.howItWorks || '';
  els.customBadge.value = saved.customBadge || '';
  const checkedSet = new Set(saved.badges || []);
  els.badgeOptions.querySelectorAll('input[type=checkbox]').forEach(cb => {
    cb.checked = checkedSet.has(cb.value);
  });
  suppressTypeContentSave = false;
}

function handleProductTypeChange() {
  syncGradeSubjectVisibility();
  syncChecklistImagesVisibility();
  applyTypeContent(els.productType.value);
  syncBadgeVisibility();
  updateTypeContentStatus();
}
els.productType.addEventListener('change', handleProductTypeChange);

[els.tagline, els.bullets, els.howItWorks, els.customBadge].forEach(el => {
  el.addEventListener('input', saveCurrentFieldsToType);
});
els.badgeOptions.querySelectorAll('input[type=checkbox]').forEach(cb => {
  cb.addEventListener('change', saveCurrentFieldsToType);
});

els.clearTypeContentBtn.addEventListener('click', () => {
  const type = els.productType.value;
  const label = els.productType.options[els.productType.selectedIndex].text;
  if (!confirm(`Clear saved Tagline/What's Included/How It Works/Badges for "${label}"?`)) return;
  delete typeContent[type];
  saveTypeContentState();
  applyTypeContent(type);
  syncBadgeVisibility();
  updateTypeContentStatus();
  setStatus('Cleared saved content for this type.');
});

// =========================================================================
// Product Name history — Product Name has no sensible "default" to save
// per profile or per type (unlike Tagline/Badges/etc.), since it's usually
// different for every listing. Instead, remember every name that's ever
// been used to generate images so a new listing that follows the same
// naming pattern (e.g. "{Artist} Illustrator {Set} TCG") can be picked from
// a list and tweaked, rather than retyped from scratch each time.
function loadProductNameHistory() {
  try {
    const raw = JSON.parse(localStorage.getItem(PRODUCT_NAME_HISTORY_KEY) || '[]');
    return Array.isArray(raw) ? raw.filter(v => typeof v === 'string') : [];
  } catch (e) {
    return [];
  }
}

function saveProductNameHistory(list) {
  try { localStorage.setItem(PRODUCT_NAME_HISTORY_KEY, JSON.stringify(list)); } catch (e) { /* ignore */ }
}

let productNameHistory = loadProductNameHistory();

function renderProductNameHistory() {
  const current = els.productNameHistory.value;
  els.productNameHistory.innerHTML = '<option value="">Reuse a previous name…</option>' +
    productNameHistory.map(name => `<option value="${name.replace(/"/g, '&quot;')}">${name}</option>`).join('');
  els.productNameHistory.value = productNameHistory.includes(current) ? current : '';
}

function rememberProductName(name) {
  name = name.trim();
  if (!name) return;
  const existingIndex = productNameHistory.findIndex(n => n.toLowerCase() === name.toLowerCase());
  if (existingIndex !== -1) productNameHistory.splice(existingIndex, 1);
  productNameHistory.unshift(name);
  if (productNameHistory.length > PRODUCT_NAME_HISTORY_MAX) productNameHistory.length = PRODUCT_NAME_HISTORY_MAX;
  saveProductNameHistory(productNameHistory);
  renderProductNameHistory();
}

els.productNameHistory.addEventListener('change', () => {
  if (!els.productNameHistory.value) return;
  els.productName.value = els.productNameHistory.value;
  els.productName.focus();
});

els.clearProductNameHistoryBtn.addEventListener('click', () => {
  if (!productNameHistory.length) return;
  if (!confirm('Clear the list of previously used product names? This can\'t be undone.')) return;
  productNameHistory = [];
  saveProductNameHistory(productNameHistory);
  renderProductNameHistory();
});

renderProductNameHistory();

// Apply whatever's saved (or the sensible defaults) for the initially-selected type.
syncGradeSubjectVisibility();
syncChecklistImagesVisibility();
applyTypeContent(els.productType.value);
syncBadgeVisibility();
updateTypeContentStatus();

// ---- hex <-> color-picker sync ----
function isValidHex(v) {
  return /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(v);
}
function expandHex(v) {
  if (/^#([0-9a-f]{3})$/i.test(v)) {
    return '#' + v.slice(1).split('').map(c => c + c).join('');
  }
  return v;
}
function bindColorHex(colorEl, hexEl) {
  colorEl.addEventListener('input', () => {
    hexEl.value = colorEl.value.toUpperCase();
  });
  hexEl.addEventListener('input', () => {
    let v = hexEl.value.trim();
    if (v && !v.startsWith('#')) v = '#' + v;
    if (isValidHex(v)) {
      colorEl.value = expandHex(v).toLowerCase();
      colorEl.dispatchEvent(new Event('input', { bubbles: true }));
      colorEl.dispatchEvent(new Event('change', { bubbles: true }));
    }
  });
  hexEl.addEventListener('blur', () => {
    hexEl.value = colorEl.value.toUpperCase();
  });
}

bindColorHex(els.watermarkColor, els.watermarkColorHex);

// =========================================================================
// Generic drawing helpers
// =========================================================================
function roundRect(ctx, x, y, w, h, r) {
  if (typeof r === 'number') r = { tl: r, tr: r, br: r, bl: r };
  ctx.beginPath();
  ctx.moveTo(x + r.tl, y);
  ctx.lineTo(x + w - r.tr, y);
  ctx.arcTo(x + w, y, x + w, y + r.tr, r.tr);
  ctx.lineTo(x + w, y + h - r.br);
  ctx.arcTo(x + w, y + h, x + w - r.br, y + h, r.br);
  ctx.lineTo(x + r.bl, y + h);
  ctx.arcTo(x, y + h, x, y + h - r.bl, r.bl);
  ctx.lineTo(x, y + r.tl);
  ctx.arcTo(x, y, x + r.tl, y, r.tl);
  ctx.closePath();
}

// Crop-to-fill: preserves the box's aspect ratio by cropping the image.
// Use for decorative/marketing photos where filling the frame matters more
// than showing every pixel. Not used for real product previews — see
// drawContain below.
function drawCover(ctx, x, y, w, h, img) {
  const ir = img.width / img.height;
  const r = w / h;
  let sx, sy, sw, sh;
  if (ir > r) {
    sh = img.height;
    sw = sh * r;
    sx = (img.width - sw) / 2;
    sy = 0;
  } else {
    sw = img.width;
    sh = sw / r;
    sx = 0;
    sy = (img.height - sh) / 2;
  }
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
}

// Letterbox fit: shows the entire image, uncropped, centered inside the box
// with the given background filling any leftover space. This is the default
// for real product/document/PDF previews so nothing important is ever cut
// off — a checklist or placeholder screenshot with a different aspect ratio
// than its display box must still be shown in full.
function drawContain(ctx, x, y, w, h, img, bgColor = '#ffffff') {
  ctx.fillStyle = bgColor;
  ctx.fillRect(x, y, w, h);
  const ir = img.width / img.height;
  const r = w / h;
  let dw, dh, dx, dy;
  if (ir > r) {
    dw = w;
    dh = w / ir;
    dx = x;
    dy = y + (h - dh) / 2;
  } else {
    dh = h;
    dw = h * ir;
    dx = x + (w - dw) / 2;
    dy = y;
  }
  ctx.drawImage(img, dx, dy, dw, dh);
}

// Pure word-wrap: measures with whatever font is already set on ctx and
// returns the line array without drawing anything, so callers can check
// how many lines a piece of text will need before committing to draw it.
function wrapLines(ctx, text, maxWidth) {
  const words = text.split(' ');
  let line = '';
  const lines = [];
  words.forEach(word => {
    const test = line ? line + ' ' + word : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  });
  if (line) lines.push(line);
  return lines;
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight, align = 'left') {
  let curY = y;
  wrapLines(ctx, text, maxWidth).forEach(l => {
    ctx.textAlign = align;
    ctx.fillText(l, x, curY);
    curY += lineHeight;
  });
  return curY;
}

// Truncates a single line of text with an ellipsis so it never runs past
// maxWidth, regardless of font size. Used as the last-resort safety net
// after auto-shrinking has already hit its minimum size.
function truncateToWidth(ctx, text, maxWidth) {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let lo = 0, hi = text.length;
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2);
    const candidate = text.slice(0, mid).trimEnd() + '…';
    if (ctx.measureText(candidate).width <= maxWidth) lo = mid; else hi = mid - 1;
  }
  return lo > 0 ? text.slice(0, lo).trimEnd() + '…' : '…';
}

// Overflow-safe multi-line text: shrinks the font size in steps until the
// wrapped text fits within maxLines, then draws it. If it still doesn't fit
// at minSize, the last visible line is truncated with an ellipsis rather
// than letting text run past its container or off the canvas. Returns the Y
// position after the last line, the font size actually used, and whether
// truncation was needed (for surfacing in the pre-export validation pass).
function fitLines(ctx, text, x, y, opts) {
  const {
    maxWidth, maxLines, lineHeightRatio = 1.06,
    startSize, minSize = Math.round(startSize * 0.55), step = 4,
    weight = 700, family, align = 'left', label,
  } = opts;

  let fontSize = startSize;
  let lines;
  for (;;) {
    ctx.font = `${weight} ${fontSize}px "${family}"`;
    lines = wrapLines(ctx, text, maxWidth);
    if (lines.length <= maxLines || fontSize <= minSize) break;
    fontSize -= step;
  }

  let truncated = false;
  if (lines.length > maxLines) {
    truncated = true;
    lines = lines.slice(0, maxLines);
    ctx.font = `${weight} ${fontSize}px "${family}"`;
    lines[maxLines - 1] = truncateToWidth(ctx, lines[maxLines - 1], maxWidth);
  }

  const lineHeight = Math.round(fontSize * lineHeightRatio);
  ctx.font = `${weight} ${fontSize}px "${family}"`;
  ctx.textAlign = align;
  let curY = y;
  lines.forEach(l => {
    ctx.fillText(l, x, curY);
    curY += lineHeight;
  });
  if (truncated) {
    warnOnce(`${label || 'Text'} was too long to fit and got shortened — consider a shorter value.`);
  }
  return { bottom: curY, fontSize, truncated };
}

// Overflow-safe single line: shrinks first, then truncates with an ellipsis
// as a last resort. Used for user-entered values that must stay on one line
// (a shop name in a header, a card title) no matter how long they are.
function fitSingleLine(ctx, text, x, y, opts) {
  const {
    maxWidth, startSize, minSize = Math.round(startSize * 0.6), step = 2,
    weight = 700, family, align = 'left', label,
  } = opts;

  let fontSize = startSize;
  ctx.font = `${weight} ${fontSize}px "${family}"`;
  while (ctx.measureText(text).width > maxWidth && fontSize > minSize) {
    fontSize -= step;
    ctx.font = `${weight} ${fontSize}px "${family}"`;
  }
  let out = text;
  let truncated = false;
  if (ctx.measureText(out).width > maxWidth) {
    out = truncateToWidth(ctx, out, maxWidth);
    truncated = true;
  }
  ctx.textAlign = align;
  ctx.fillText(out, x, y);
  if (truncated) {
    warnOnce(`${label || 'Text'} was too long to fit and got shortened — consider a shorter value.`);
  }
  return { fontSize, truncated };
}

function hexToRgb(hex) {
  const m = hex.replace('#', '');
  const bigint = parseInt(m.length === 3 ? m.split('').map(c => c + c).join('') : m, 16);
  return { r: (bigint >> 16) & 255, g: (bigint >> 8) & 255, b: bigint & 255 };
}

function luminance(hex) {
  const { r, g, b } = hexToRgb(hex);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

function contrastText(hex) {
  return luminance(hex) > 0.6 ? '#2b2320' : '#ffffff';
}

async function ensureFont(family) {
  try {
    await Promise.all([
      document.fonts.load(`400 60px "${family}"`),
      document.fonts.load(`700 60px "${family}"`),
    ]);
  } catch (e) { /* fall back silently */ }
}

// =========================================================================
// Watermark
// =========================================================================
function drawWatermark(ctx, text, opts, bounds) {
  if (!text) return;
  bounds = bounds || { x: 0, y: 0, w: SIZE, h: SIZE };
  const minDim = Math.min(bounds.w, bounds.h);
  ctx.save();
  ctx.fillStyle = opts.color;
  ctx.globalAlpha = opts.opacity;

  if (opts.style === 'corner') {
    const fontSize = Math.max(16, Math.min(34, minDim * 0.07));
    const margin = Math.max(14, Math.min(50, minDim * 0.08));
    ctx.font = `600 ${fontSize}px sans-serif`;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'bottom';
    ctx.fillText(text, bounds.x + bounds.w - margin, bounds.y + bounds.h - margin);
  } else {
    const fontSize = Math.max(20, Math.min(48, minDim * 0.14));
    ctx.font = `700 ${fontSize}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const cx = bounds.x + bounds.w / 2, cy = bounds.y + bounds.h / 2;
    ctx.translate(cx, cy);
    ctx.rotate(-Math.PI / 6);
    const stepX = ctx.measureText(text).width + fontSize * 3.3;
    const stepY = fontSize * 5;
    const range = Math.max(bounds.w, bounds.h) * 0.75 + Math.max(stepX, stepY);
    for (let y = -range; y < range; y += stepY) {
      for (let x = -range; x < range; x += stepX) {
        ctx.fillText(text, x, y);
      }
    }
  }
  ctx.restore();
}

function getWatermarkConfig(brand) {
  const enabled = els.watermarkEnabled.checked;
  const text = els.watermarkText.value.trim() || brand.companyName;
  const targets = new Set([...els.watermarkTargets.querySelectorAll('input[type=checkbox]:checked')].map(cb => cb.value));
  return {
    enabled,
    text,
    style: els.watermarkStyle.value,
    color: els.watermarkColor.value,
    opacity: Number(els.watermarkOpacity.value) / 100,
    targets,
  };
}

// =========================================================================
// Template generators
// =========================================================================
function getBrand() {
  const scheme = COLOR_SCHEMES.find(s => s.id === selectedColorSchemeId) || COLOR_SCHEMES[0];
  return {
    companyName: els.companyName.value.trim() || 'Your Shop',
    logoImgSrc: null,
    primaryColor: scheme.primary,
    accentColor: scheme.accent,
    font: els.fontChoice.value,
  };
}


function getProduct() {
  const badges = [...els.badgeOptions.querySelectorAll('input[type=checkbox]:checked')].map(cb => cb.value);
  const custom = els.customBadge.value.trim();
  if (custom) badges.push(custom);
  return {
    type: els.productType.value,
    name: els.productName.value.trim() || 'Your Product Name',
    gradeLevel: els.gradeLevel.value.trim(),
    subject: els.subject.value.trim(),
    tagline: els.tagline.value.trim(),
    bullets: els.bullets.value.split('\n').map(s => s.trim()).filter(Boolean),
    howItWorks: els.howItWorks.value.split('\n').map(s => s.trim()).filter(Boolean),
    badges,
  };
}

// Splits a "What's Included" line like "3 Placeholder Sizes — 9, 16, 25 per
// page" into a bold label + smaller subtext, for the checklist hero's
// feature boxes. Lines without a dash just render as a single label line.
function splitFeatureLine(text) {
  const parts = text.split(/\s+[—-]\s+/);
  if (parts.length >= 2) return { label: parts[0], sub: parts.slice(1).join(' - ') };
  return { label: text, sub: '' };
}

function drawChecklistHero(ctx, brand, product, colorImg, watermark) {
  ctx.fillStyle = brand.accentColor;
  ctx.fillRect(0, 0, SIZE, SIZE);
  const textColor = contrastText(brand.accentColor);
  const margin = 100;
  const contentW = SIZE - margin * 2;

  // ---- Header — shop name is user-entered and unbounded in length, so it
  // shrinks (then truncates as a last resort) rather than ever overflowing
  // past the canvas edge. ----
  ctx.fillStyle = brand.primaryColor;
  fitSingleLine(ctx, brand.companyName.toUpperCase(), margin, 108, {
    maxWidth: contentW, startSize: 32, minSize: 20, weight: 700, family: brand.font, label: 'Shop name',
  });

  ctx.strokeStyle = brand.primaryColor;
  ctx.globalAlpha = 0.25;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(margin, 128);
  ctx.lineTo(SIZE - margin, 128);
  ctx.stroke();
  ctx.globalAlpha = 1;

  // ---- Headline — capped at 2 lines, auto-shrinking first and truncating
  // only as a last resort, so a long product name can never push the
  // tagline/feature line/image area off the canvas. ----
  ctx.fillStyle = textColor;
  const titleFit = fitLines(ctx, product.name, margin, 232, {
    maxWidth: contentW, maxLines: 2, startSize: 104, minSize: 60, step: 4, weight: 700, family: brand.font, label: 'Product name (Hero Cover)',
  });
  let y = titleFit.bottom;

  if (product.tagline) {
    ctx.fillStyle = textColor;
    ctx.globalAlpha = 0.7;
    y = fitLines(ctx, product.tagline, margin, y + 4, {
      maxWidth: contentW, maxLines: 1, startSize: 38, minSize: 24, step: 2, weight: 500, family: brand.font, label: 'Tagline (Hero Cover)',
    }).bottom;
    ctx.globalAlpha = 1;
  }

  // ---- Feature line — up to 4 short badges, joined into one line that
  // shrinks (then truncates) rather than clipping or running off the page.
  const features = (product.bullets.length ? product.bullets : ['Instant Download', 'High Quality', 'Easy to Use'])
    .slice(0, 4)
    .map(raw => splitFeatureLine(raw).label);
  ctx.fillStyle = brand.primaryColor;
  const featureY = y + 56;
  const featureBottom = fitLines(ctx, features.join('   •   ').toUpperCase(), margin, featureY, {
    maxWidth: contentW, maxLines: 1, startSize: 34, minSize: 22, step: 2, weight: 600, family: brand.font, label: 'Feature list (Hero Cover)',
  }).bottom;

  // ---- One large showcase image — the Color Placeholders preview. The top
  // edge follows the text above it, but never eats into a minimum image
  // height even in a worst-case pile-up of shrunk/truncated text. ----
  const imgBottom = SIZE - 170;
  const MIN_IMG_H = 550;
  const imgTop = Math.min(featureBottom + 40, imgBottom - MIN_IMG_H);
  const imgH = imgBottom - imgTop;

  ctx.save();
  roundRect(ctx, margin, imgTop, contentW, imgH, 16);
  ctx.clip();
  if (colorImg) {
    drawContain(ctx, margin, imgTop, contentW, imgH, colorImg);
  } else {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(margin, imgTop, contentW, imgH);
  }
  if (watermark) {
    drawWatermark(ctx, watermark.text, watermark, { x: margin, y: imgTop, w: contentW, h: imgH });
  }
  ctx.restore();

  ctx.strokeStyle = 'rgba(0,0,0,0.1)';
  ctx.lineWidth = 2;
  roundRect(ctx, margin, imgTop, contentW, imgH, 16);
  ctx.stroke();
}

// "Everything Included" showcase — layout is fixed on purpose (title, badge,
// card labels, size options, and steps never change); only the subtitle
// reflects the product name, since this image always describes the same
// Checklist + Placeholders deliverables.
const SHOWCASE_SIZE_OPTIONS = [
  { n: '9', label: 'cards/page', desc: 'regular card size' },
  { n: '16', label: 'cards/page', desc: 'smaller layout' },
  { n: '25', label: 'cards/page', desc: 'most compact' },
];
// The actual file inventory — not a repeat of the "3 Easy Steps" walkthrough
// image, which already covers how to use the download.
const SHOWCASE_FILE_INVENTORY = [
  'Fillable checklist',
  ...PLACEHOLDER_SIZES.map(n => `${n}/page Color + Greyscale`),
];
const SHOWCASE_CARDS = [
  { key: 'checklist', title: 'Fillable Checklist', desc: 'Use digitally or print it' },
  { key: 'color', title: 'Color Placeholders', desc: 'Included in all 3 sizes' },
  { key: 'grey', title: 'Greyscale Placeholders', desc: 'Ink-friendly option' },
];

function drawIncludedShowcase(ctx, brand, product, images, watermark) {
  ctx.fillStyle = brand.accentColor;
  ctx.fillRect(0, 0, SIZE, SIZE);
  const textColor = contrastText(brand.accentColor);
  const margin = 100;
  const contentW = SIZE - margin * 2;

  // ---- Header — leaves clearance for the corner badge so a long shop
  // name can never run underneath it. ----
  const badgeW = 380, badgeH = 172, badgeX = SIZE - margin - badgeW, badgeY = 56;
  ctx.fillStyle = brand.primaryColor;
  fitSingleLine(ctx, brand.companyName.toUpperCase(), margin, 108, {
    maxWidth: badgeX - margin - 40, startSize: 32, minSize: 20, weight: 700, family: brand.font, label: 'Shop name',
  });

  // The rule stops short of the badge instead of running its full width —
  // otherwise it shows through the badge's semi-transparent fill.
  ctx.strokeStyle = brand.primaryColor;
  ctx.globalAlpha = 0.25;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(margin, 128);
  ctx.lineTo(badgeX - 30, 128);
  ctx.stroke();
  ctx.globalAlpha = 1;

  // ---- "Digital Download" badge, top right ----
  ctx.fillStyle = brand.primaryColor;
  ctx.globalAlpha = 0.12;
  roundRect(ctx, badgeX, badgeY, badgeW, badgeH, 20);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.fillStyle = brand.primaryColor;
  ctx.font = `700 40px "${brand.font}"`;
  ctx.textAlign = 'left';
  wrapText(ctx, 'DIGITAL DOWNLOAD', badgeX + 36, badgeY + 66, badgeW - 72, 46, 'left');
  ctx.fillStyle = textColor;
  ctx.globalAlpha = 0.75;
  ctx.font = `500 30px "${brand.font}"`;
  ctx.fillText('Instant access', badgeX + 36, badgeY + 136);
  ctx.globalAlpha = 1;

  // ---- Title (fixed) ----
  ctx.fillStyle = textColor;
  ctx.font = `700 84px "${brand.font}"`;
  ctx.textAlign = 'left';
  ctx.fillText('Everything Included', margin, 250);
  ctx.fillText('in Your Download', margin, 340);

  // ---- Subtitle — the one editable piece, built from the product name.
  // Capped at 2 lines so an unusually long product name can't push the
  // cards below off the canvas. ----
  ctx.fillStyle = textColor;
  ctx.globalAlpha = 0.7;
  const subtitle = `A complete ${product.name} toolkit for planning and tracking your binder.`;
  const subtitleBottom = fitLines(ctx, subtitle, margin, 416, {
    maxWidth: contentW, maxLines: 2, startSize: 38, minSize: 26, step: 2, weight: 500, family: brand.font, label: 'Product name (Everything Included subtitle)',
  }).bottom;
  ctx.globalAlpha = 1;

  // ---- Three preview cards ----
  const cardsTop = Math.max(560, subtitleBottom + 40);
  const cardGap = 40;
  const cardW = (contentW - cardGap * 2) / 3;
  const cardH = 640;
  const pad = 28;
  const imgH = cardH * 0.72;

  SHOWCASE_CARDS.forEach((card, i) => {
    const cardX = margin + i * (cardW + cardGap);
    ctx.fillStyle = '#ffffff';
    roundRect(ctx, cardX, cardsTop, cardW, cardH, 20);
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.08)';
    ctx.lineWidth = 2;
    roundRect(ctx, cardX, cardsTop, cardW, cardH, 20);
    ctx.stroke();

    const imgX = cardX + pad, imgY = cardsTop + pad, imgW = cardW - pad * 2;
    ctx.save();
    roundRect(ctx, imgX, imgY, imgW, imgH, 12);
    ctx.clip();
    const img = images[card.key];
    if (img) {
      drawContain(ctx, imgX, imgY, imgW, imgH, img);
    } else {
      ctx.fillStyle = '#f1ece4';
      ctx.fillRect(imgX, imgY, imgW, imgH);
    }
    if (watermark) {
      drawWatermark(ctx, watermark.text, watermark, { x: imgX, y: imgY, w: imgW, h: imgH });
    }
    ctx.restore();

    ctx.fillStyle = '#1f1b17';
    ctx.font = `700 42px "${brand.font}"`;
    ctx.textAlign = 'left';
    const titleY = imgY + imgH + 56;
    ctx.fillText(card.title, imgX, titleY);

    ctx.fillStyle = '#6b6259';
    ctx.font = `500 28px "${brand.font}"`;
    ctx.fillText(card.desc, imgX, titleY + 40);
  });

  // ---- Bottom info box: sizes + how-to-use, side by side ----
  const boxTop = cardsTop + cardH + 50;
  const boxH = 480;
  const boxBottom = boxTop + boxH;
  ctx.strokeStyle = brand.primaryColor;
  ctx.globalAlpha = 0.3;
  ctx.lineWidth = 2;
  roundRect(ctx, margin, boxTop, contentW, boxH, 20);
  ctx.stroke();
  ctx.globalAlpha = 1;

  const midX = margin + contentW / 2;
  ctx.strokeStyle = brand.primaryColor;
  ctx.globalAlpha = 0.2;
  ctx.beginPath();
  ctx.moveTo(midX, boxTop + 50);
  ctx.lineTo(midX, boxBottom - 50);
  ctx.stroke();
  ctx.globalAlpha = 1;

  const colPad = 60;

  // Left column — placeholder sizes
  const leftX = margin + colPad;
  ctx.fillStyle = brand.primaryColor;
  ctx.font = `700 34px "${brand.font}"`;
  ctx.textAlign = 'left';
  ctx.fillText('3 PLACEHOLDER SIZES', leftX, boxTop + 84);

  const leftColW = contentW / 2 - colPad - 40;
  const circleR = 68;
  const circleGap = (leftColW - circleR * 2 * SHOWCASE_SIZE_OPTIONS.length) / (SHOWCASE_SIZE_OPTIONS.length - 1) + circleR * 2;
  const circleCy = boxTop + 84 + 150;
  SHOWCASE_SIZE_OPTIONS.forEach((opt, i) => {
    const cx = leftX + circleR + i * circleGap;
    ctx.fillStyle = brand.primaryColor;
    ctx.globalAlpha = 0.14;
    ctx.beginPath();
    ctx.arc(cx, circleCy, circleR, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    ctx.fillStyle = brand.primaryColor;
    ctx.font = `700 56px "${brand.font}"`;
    ctx.textAlign = 'center';
    ctx.fillText(opt.n, cx, circleCy + 20);

    ctx.fillStyle = textColor;
    ctx.font = `700 28px "${brand.font}"`;
    ctx.fillText(opt.label, cx, circleCy + circleR + 46);

    ctx.fillStyle = textColor;
    ctx.globalAlpha = 0.6;
    ctx.font = `500 24px "${brand.font}"`;
    ctx.fillText(opt.desc, cx, circleCy + circleR + 78);
    ctx.globalAlpha = 1;
  });

  // Right column — the actual file inventory (not a repeat of the "how to
  // use it" walkthrough, which already has its own dedicated listing image)
  const rightX = midX + colPad;
  ctx.fillStyle = brand.primaryColor;
  ctx.font = `700 34px "${brand.font}"`;
  ctx.textAlign = 'left';
  ctx.fillText('FILES INCLUDED', rightX, boxTop + 84);

  const iconR = 24;
  const itemTextX = rightX + iconR * 2 + 24;
  const itemTextMaxW = margin + contentW - itemTextX - colPad + 40;
  const itemsTop = boxTop + 84 + 60;
  const itemGap = (boxH - 84 - 60 - 30) / SHOWCASE_FILE_INVENTORY.length;
  SHOWCASE_FILE_INVENTORY.forEach((item, i) => {
    const cy = itemsTop + i * itemGap + iconR;
    ctx.fillStyle = brand.primaryColor;
    ctx.globalAlpha = 0.14;
    ctx.beginPath();
    ctx.arc(rightX + iconR, cy, iconR, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.strokeStyle = brand.primaryColor;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(rightX + iconR - 10, cy);
    ctx.lineTo(rightX + iconR - 3, cy + 7);
    ctx.lineTo(rightX + iconR + 10, cy - 9);
    ctx.stroke();

    ctx.fillStyle = textColor;
    ctx.font = `600 32px "${brand.font}"`;
    ctx.textAlign = 'left';
    ctx.fillText(item, itemTextX, cy + 11, itemTextMaxW);
  });

  // ---- Footer — the shop name's available width is computed from the
  // disclaimer's actual rendered width, not a guess, so a long shop name
  // can never collide with it regardless of either string's length. ----
  ctx.fillStyle = textColor;
  ctx.globalAlpha = 0.55;
  ctx.font = `500 28px "${brand.font}"`;
  ctx.textAlign = 'left';
  ctx.fillText(DIGITAL_DISCLAIMER, margin, SIZE - 55);
  const disclaimerW = ctx.measureText(DIGITAL_DISCLAIMER).width;
  ctx.globalAlpha = 1;

  ctx.fillStyle = brand.primaryColor;
  fitSingleLine(ctx, brand.companyName.toUpperCase(), SIZE - margin, SIZE - 55, {
    maxWidth: contentW - disclaimerW - 60, startSize: 30, minSize: 18, weight: 700, family: brand.font, align: 'right', label: 'Shop name',
  });
}

// "Choose the Size" guide — layout is fixed on purpose (title, subtitle,
// card labels/descriptions/badges, and the highlight box never change);
// only the 3 layout-preview images differ, one per card size.
const SIZE_GUIDE_CARDS = [
  { key: 'size9', n: '9', label: 'FULL SIZE', desc: 'Regular trading card size', caption: '9 cards/page' },
  { key: 'size16', n: '16', label: 'COMPACT', desc: 'Smaller layout • saves paper', caption: '16 cards/page' },
  { key: 'size25', n: '25', label: 'MINI', desc: 'Most compact • maximum efficiency', caption: '25 cards/page' },
];

function drawSizeGuide(ctx, brand, product, images, watermark) {
  ctx.fillStyle = brand.accentColor;
  ctx.fillRect(0, 0, SIZE, SIZE);
  const textColor = contrastText(brand.accentColor);
  const margin = 100;
  const contentW = SIZE - margin * 2;

  // ---- Header ----
  ctx.fillStyle = brand.primaryColor;
  fitSingleLine(ctx, brand.companyName.toUpperCase(), margin, 108, {
    maxWidth: contentW, startSize: 32, minSize: 20, weight: 700, family: brand.font, label: 'Shop name',
  });

  ctx.strokeStyle = brand.primaryColor;
  ctx.globalAlpha = 0.25;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(margin, 128);
  ctx.lineTo(SIZE - margin, 128);
  ctx.stroke();
  ctx.globalAlpha = 1;

  // ---- Title (fixed) ----
  ctx.fillStyle = textColor;
  ctx.font = `700 84px "${brand.font}"`;
  ctx.textAlign = 'left';
  ctx.fillText('Choose the Size That', margin, 250);
  ctx.fillText('Fits Your Binder', margin, 340);

  // ---- Subtitle (fixed — this image never reflects the product name) ----
  ctx.fillStyle = textColor;
  ctx.globalAlpha = 0.7;
  ctx.font = `500 38px "${brand.font}"`;
  wrapText(ctx, 'All 3 placeholder layouts are included — print only the version you want.', margin, 416, contentW, 48, 'left');
  ctx.globalAlpha = 1;

  // ---- Three size cards ----
  const cardsTop = 560;
  const cardGap = 40;
  const cardW = (contentW - cardGap * 2) / 3;
  const cardH = 1000;
  const pad = 28;

  SIZE_GUIDE_CARDS.forEach((opt, i) => {
    const cardX = margin + i * (cardW + cardGap);
    const cx = cardX + cardW / 2;

    ctx.fillStyle = '#ffffff';
    roundRect(ctx, cardX, cardsTop, cardW, cardH, 20);
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.08)';
    ctx.lineWidth = 2;
    roundRect(ctx, cardX, cardsTop, cardW, cardH, 20);
    ctx.stroke();

    ctx.fillStyle = '#1f1b17';
    ctx.font = `700 84px "${brand.font}"`;
    ctx.textAlign = 'center';
    ctx.fillText(opt.n, cx, cardsTop + 112);

    ctx.fillStyle = brand.primaryColor;
    ctx.font = `700 30px "${brand.font}"`;
    ctx.fillText(opt.label, cx, cardsTop + 164);

    ctx.fillStyle = '#6b6259';
    ctx.font = `500 25px "${brand.font}"`;
    ctx.fillText(opt.desc, cx, cardsTop + 200);

    const imgX = cardX + pad, imgY = cardsTop + 244, imgW = cardW - pad * 2, imgH = 560;
    ctx.save();
    roundRect(ctx, imgX, imgY, imgW, imgH, 12);
    ctx.clip();
    const img = images[opt.key];
    if (img) {
      drawContain(ctx, imgX, imgY, imgW, imgH, img);
    } else {
      ctx.fillStyle = '#f1ece4';
      ctx.fillRect(imgX, imgY, imgW, imgH);
    }
    if (watermark) {
      drawWatermark(ctx, watermark.text, watermark, { x: imgX, y: imgY, w: imgW, h: imgH });
    }
    ctx.restore();
    ctx.strokeStyle = 'rgba(0,0,0,0.08)';
    ctx.lineWidth = 2;
    roundRect(ctx, imgX, imgY, imgW, imgH, 12);
    ctx.stroke();

    ctx.fillStyle = textColor;
    ctx.globalAlpha = 0.65;
    ctx.font = `500 28px "${brand.font}"`;
    ctx.textAlign = 'center';
    ctx.fillText(opt.caption, cx, imgY + imgH + 60);
    ctx.globalAlpha = 1;
  });

  // ---- Highlighted note box ----
  const boxTop = cardsTop + cardH + 50;
  const boxH = 160;
  ctx.fillStyle = brand.primaryColor;
  ctx.globalAlpha = 0.12;
  roundRect(ctx, margin, boxTop, contentW, boxH, 20);
  ctx.fill();
  ctx.globalAlpha = 1;

  ctx.fillStyle = '#1f1b17';
  ctx.font = `700 40px "${brand.font}"`;
  ctx.textAlign = 'center';
  ctx.fillText('ALL 3 SIZES INCLUDED IN COLOR + GREYSCALE', SIZE / 2, boxTop + 66);

  ctx.fillStyle = textColor;
  ctx.globalAlpha = 0.65;
  ctx.font = `500 28px "${brand.font}"`;
  ctx.fillText('Choose your preferred layout • print only what you need', SIZE / 2, boxTop + 114);
  ctx.globalAlpha = 1;

  // ---- Footer ----
  ctx.strokeStyle = brand.primaryColor;
  ctx.globalAlpha = 0.2;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(margin, SIZE - 100);
  ctx.lineTo(SIZE - margin, SIZE - 100);
  ctx.stroke();
  ctx.globalAlpha = 1;

  ctx.fillStyle = brand.primaryColor;
  fitSingleLine(ctx, brand.companyName.toUpperCase(), margin, SIZE - 55, {
    maxWidth: contentW - 500, startSize: 30, minSize: 18, weight: 700, family: brand.font, label: 'Shop name',
  });

  ctx.fillStyle = '#1f1b17';
  ctx.font = `700 30px "${brand.font}"`;
  ctx.textAlign = 'right';
  ctx.fillText('DIGITAL DOWNLOAD', SIZE - margin, SIZE - 55);
}

// "Choose Your Print Style" guide — layout is fixed on purpose (title,
// subtitle, card labels/descriptions/badges/notes, and the highlight box
// never change); only the 2 preview images differ, one per print style.
const PRINT_STYLE_CARDS = [
  { key: 'color', title: 'COLOR', subtitle: 'Full-color placeholders', badge: 'FULL COLOR', caption: 'Bright, visual binder planning', note: 'Available in 9 • 16 • 25 cards/page' },
  { key: 'grey', title: 'GREYSCALE', subtitle: 'Ink-friendly placeholders', badge: 'INK FRIENDLY', caption: 'Cleaner, lower-ink printing option', note: 'Available in 9 • 16 • 25 cards/page' },
];

function drawPrintStyleGuide(ctx, brand, product, images, watermark) {
  ctx.fillStyle = brand.accentColor;
  ctx.fillRect(0, 0, SIZE, SIZE);
  const textColor = contrastText(brand.accentColor);
  const margin = 100;
  const contentW = SIZE - margin * 2;

  // ---- Header ----
  ctx.fillStyle = brand.primaryColor;
  fitSingleLine(ctx, brand.companyName.toUpperCase(), margin, 108, {
    maxWidth: contentW, startSize: 32, minSize: 20, weight: 700, family: brand.font, label: 'Shop name',
  });

  ctx.strokeStyle = brand.primaryColor;
  ctx.globalAlpha = 0.25;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(margin, 128);
  ctx.lineTo(SIZE - margin, 128);
  ctx.stroke();
  ctx.globalAlpha = 1;

  // ---- Title (fixed, single line) ----
  ctx.fillStyle = textColor;
  ctx.font = `700 84px "${brand.font}"`;
  ctx.textAlign = 'left';
  ctx.fillText('Choose Your Print Style', margin, 250);

  // ---- Subtitle (fixed) ----
  ctx.globalAlpha = 0.7;
  ctx.font = `500 38px "${brand.font}"`;
  wrapText(ctx, 'Both versions are included — print whichever works best for your binder.', margin, 330, contentW, 48, 'left');
  ctx.globalAlpha = 1;

  // ---- Two print-style cards ----
  const cardsTop = 460;
  const cardGap = 50;
  const cardW = (contentW - cardGap) / 2;
  const cardH = 1000;
  const pad = 36;

  PRINT_STYLE_CARDS.forEach((c, i) => {
    const cardX = margin + i * (cardW + cardGap);
    const cx = cardX + cardW / 2;

    ctx.fillStyle = '#ffffff';
    roundRect(ctx, cardX, cardsTop, cardW, cardH, 22);
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.08)';
    ctx.lineWidth = 2;
    roundRect(ctx, cardX, cardsTop, cardW, cardH, 22);
    ctx.stroke();

    ctx.fillStyle = '#1f1b17';
    ctx.font = `700 44px "${brand.font}"`;
    ctx.textAlign = 'center';
    ctx.fillText(c.title, cx, cardsTop + 70);

    ctx.fillStyle = '#6b6259';
    ctx.font = `500 26px "${brand.font}"`;
    ctx.fillText(c.subtitle, cx, cardsTop + 112);

    const imgX = cardX + pad, imgY = cardsTop + 155, imgW = cardW - pad * 2, imgH = 610;
    ctx.save();
    roundRect(ctx, imgX, imgY, imgW, imgH, 14);
    ctx.clip();
    const img = images[c.key];
    if (img) {
      drawContain(ctx, imgX, imgY, imgW, imgH, img);
    } else {
      ctx.fillStyle = '#f1ece4';
      ctx.fillRect(imgX, imgY, imgW, imgH);
    }
    if (watermark) {
      drawWatermark(ctx, watermark.text, watermark, { x: imgX, y: imgY, w: imgW, h: imgH });
    }
    ctx.restore();
    ctx.strokeStyle = 'rgba(0,0,0,0.08)';
    ctx.lineWidth = 2;
    roundRect(ctx, imgX, imgY, imgW, imgH, 14);
    ctx.stroke();

    const badgeY = imgY + imgH + 40;
    ctx.font = `700 22px "${brand.font}"`;
    const badgeW = ctx.measureText(c.badge).width + 44;
    const badgeH = 54;
    const badgeX = cx - badgeW / 2;
    ctx.fillStyle = brand.primaryColor;
    ctx.globalAlpha = 0.12;
    roundRect(ctx, badgeX, badgeY, badgeW, badgeH, badgeH / 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.fillStyle = brand.primaryColor;
    ctx.textAlign = 'center';
    ctx.fillText(c.badge, cx, badgeY + badgeH / 2 + 8);

    ctx.fillStyle = textColor;
    ctx.font = `600 32px "${brand.font}"`;
    ctx.fillText(c.caption, cx, badgeY + badgeH + 46);

    ctx.fillStyle = textColor;
    ctx.globalAlpha = 0.6;
    ctx.font = `500 24px "${brand.font}"`;
    ctx.fillText(c.note, cx, badgeY + badgeH + 84);
    ctx.globalAlpha = 1;
  });

  // ---- Highlighted note box ----
  const boxTop = cardsTop + cardH + 50;
  const boxH = 160;
  ctx.fillStyle = brand.primaryColor;
  ctx.globalAlpha = 0.12;
  roundRect(ctx, margin, boxTop, contentW, boxH, 20);
  ctx.fill();
  ctx.globalAlpha = 1;

  ctx.fillStyle = '#1f1b17';
  ctx.font = `700 40px "${brand.font}"`;
  ctx.textAlign = 'center';
  ctx.fillText('YOU GET BOTH VERSIONS', SIZE / 2, boxTop + 66);

  ctx.fillStyle = textColor;
  ctx.globalAlpha = 0.65;
  ctx.font = `500 28px "${brand.font}"`;
  ctx.fillText('No need to choose before purchase', SIZE / 2, boxTop + 114);
  ctx.globalAlpha = 1;

  // ---- Footer ----
  ctx.strokeStyle = brand.primaryColor;
  ctx.globalAlpha = 0.2;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(margin, SIZE - 100);
  ctx.lineTo(SIZE - margin, SIZE - 100);
  ctx.stroke();
  ctx.globalAlpha = 1;

  ctx.fillStyle = brand.primaryColor;
  fitSingleLine(ctx, brand.companyName.toUpperCase(), margin, SIZE - 55, {
    maxWidth: contentW - 500, startSize: 30, minSize: 18, weight: 700, family: brand.font, label: 'Shop name',
  });

  ctx.fillStyle = '#1f1b17';
  ctx.font = `700 30px "${brand.font}"`;
  ctx.textAlign = 'right';
  ctx.fillText('DIGITAL DOWNLOAD', SIZE - margin, SIZE - 55);
}

// "3 Easy Steps" guide — entirely fixed (no images, no product-specific
// text) since it always describes the same Checklist + Placeholders
// workflow regardless of which product this happens to be.
const EASY_STEPS_CARDS = [
  {
    n: '1', heading: 'CHOOSE',
    bullets: ['Pick Color or Greyscale', 'Choose 9, 16, or 25 cards/page', 'Print only the version you want'],
  },
  {
    n: '2', heading: 'PRINT + CUT',
    bullets: ['Print your selected placeholder pages', 'Cut along the placeholder edges', 'Print at 100% — do not use Fit to Page'],
  },
  {
    n: '3', heading: 'PLACE IN BINDER',
    bullets: ['Slip placeholders into empty binder pockets', 'See exactly which cards you still need', 'Replace placeholders as you collect the real cards'],
  },
];

function drawEasySteps(ctx, brand, product) {
  ctx.fillStyle = brand.accentColor;
  ctx.fillRect(0, 0, SIZE, SIZE);
  const textColor = contrastText(brand.accentColor);
  const margin = 100;
  const contentW = SIZE - margin * 2;

  // ---- Header — leaves clearance for the corner badge so a long shop
  // name can never run underneath it. ----
  const badgeW = 380, badgeH = 172, badgeX = SIZE - margin - badgeW, badgeY = 56;
  ctx.fillStyle = brand.primaryColor;
  fitSingleLine(ctx, brand.companyName.toUpperCase(), margin, 108, {
    maxWidth: badgeX - margin - 40, startSize: 32, minSize: 20, weight: 700, family: brand.font, label: 'Shop name',
  });

  // The rule stops short of the badge instead of running its full width —
  // otherwise it shows through the badge's semi-transparent fill.
  ctx.strokeStyle = brand.primaryColor;
  ctx.globalAlpha = 0.25;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(margin, 128);
  ctx.lineTo(badgeX - 30, 128);
  ctx.stroke();
  ctx.globalAlpha = 1;

  // ---- "Instant Download" badge, top right ----
  ctx.fillStyle = brand.primaryColor;
  ctx.globalAlpha = 0.12;
  roundRect(ctx, badgeX, badgeY, badgeW, badgeH, 20);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.fillStyle = brand.primaryColor;
  ctx.font = `700 40px "${brand.font}"`;
  ctx.textAlign = 'left';
  wrapText(ctx, 'INSTANT DOWNLOAD', badgeX + 36, badgeY + 66, badgeW - 72, 46, 'left');
  ctx.fillStyle = textColor;
  ctx.globalAlpha = 0.75;
  ctx.font = `500 28px "${brand.font}"`;
  ctx.fillText('Unzip → choose → print', badgeX + 36, badgeY + 136);
  ctx.globalAlpha = 1;

  // ---- Title (fixed) ----
  ctx.fillStyle = textColor;
  ctx.font = `700 84px "${brand.font}"`;
  ctx.textAlign = 'left';
  ctx.fillText('From Download to Binder', margin, 250);
  ctx.fillText('in 3 Easy Steps', margin, 340);

  // ---- Subtitle (fixed) ----
  ctx.globalAlpha = 0.7;
  ctx.font = `500 38px "${brand.font}"`;
  wrapText(ctx, 'Everything you need to start using your placeholder set right away.', margin, 416, contentW, 48, 'left');
  ctx.globalAlpha = 1;

  // ---- Three step cards ----
  const cardsTop = 560;
  const cardGap = 40;
  const cardW = (contentW - cardGap * 2) / 3;
  const cardH = 700;
  const pad = 44;
  const circleR = 54;
  const bulletSlotH = 90;

  EASY_STEPS_CARDS.forEach((card, i) => {
    const cardX = margin + i * (cardW + cardGap);
    const cx = cardX + cardW / 2;

    ctx.fillStyle = '#ffffff';
    roundRect(ctx, cardX, cardsTop, cardW, cardH, 20);
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.08)';
    ctx.lineWidth = 2;
    roundRect(ctx, cardX, cardsTop, cardW, cardH, 20);
    ctx.stroke();

    const circleCy = cardsTop + pad + circleR;
    ctx.fillStyle = brand.primaryColor;
    ctx.globalAlpha = 0.14;
    ctx.beginPath();
    ctx.arc(cx, circleCy, circleR, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.fillStyle = brand.primaryColor;
    ctx.font = `700 44px "${brand.font}"`;
    ctx.textAlign = 'center';
    ctx.fillText(card.n, cx, circleCy + 16);

    const headingY = circleCy + circleR + 66;
    ctx.fillStyle = '#1f1b17';
    ctx.font = `700 32px "${brand.font}"`;
    ctx.fillText(card.heading, cx, headingY);

    const ruleY = headingY + 26;
    ctx.strokeStyle = brand.primaryColor;
    ctx.globalAlpha = 0.2;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cardX + pad, ruleY);
    ctx.lineTo(cardX + cardW - pad, ruleY);
    ctx.stroke();
    ctx.globalAlpha = 1;

    const bulletsTop = ruleY + 46;
    const textX = cardX + pad + 26;
    const textMaxW = cardW - pad * 2 - 26;
    card.bullets.forEach((bullet, bi) => {
      const by = bulletsTop + bi * bulletSlotH;
      ctx.fillStyle = brand.primaryColor;
      ctx.globalAlpha = 0.55;
      ctx.beginPath();
      ctx.arc(cardX + pad + 6, by - 8, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;

      ctx.fillStyle = textColor;
      fitLines(ctx, bullet, textX, by, {
        maxWidth: textMaxW, maxLines: 2, startSize: 26, minSize: 18, step: 2, weight: 500, family: brand.font, label: 'List item',
      });
    });
  });

  // ---- Highlighted note box ----
  const boxTop = cardsTop + cardH + 50;
  const boxH = 320;
  ctx.fillStyle = brand.primaryColor;
  ctx.globalAlpha = 0.12;
  roundRect(ctx, margin, boxTop, contentW, boxH, 20);
  ctx.fill();
  ctx.globalAlpha = 1;

  ctx.fillStyle = '#1f1b17';
  ctx.font = `700 40px "${brand.font}"`;
  ctx.textAlign = 'center';
  ctx.fillText('BUILD YOUR COLLECTION AT YOUR OWN PACE', SIZE / 2, boxTop + 100);

  ctx.fillStyle = textColor;
  ctx.globalAlpha = 0.75;
  ctx.font = `500 30px "${brand.font}"`;
  ctx.fillText('Replace each placeholder with the real card as your binder grows.', SIZE / 2, boxTop + 160);
  ctx.globalAlpha = 1;

  ctx.fillStyle = textColor;
  ctx.globalAlpha = 0.6;
  ctx.font = `500 26px "${brand.font}"`;
  ctx.fillText('Simple • Flexible • Easy to print again whenever you need it', SIZE / 2, boxTop + 220);
  ctx.globalAlpha = 1;

  // ---- Footer ----
  ctx.fillStyle = textColor;
  ctx.globalAlpha = 0.55;
  ctx.font = `500 26px "${brand.font}"`;
  ctx.textAlign = 'center';
  ctx.fillText(DIGITAL_DISCLAIMER, SIZE / 2, SIZE - 140);
  ctx.globalAlpha = 1;

  ctx.strokeStyle = brand.primaryColor;
  ctx.globalAlpha = 0.2;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(margin, SIZE - 100);
  ctx.lineTo(SIZE - margin, SIZE - 100);
  ctx.stroke();
  ctx.globalAlpha = 1;

  ctx.fillStyle = brand.primaryColor;
  fitSingleLine(ctx, brand.companyName.toUpperCase(), margin, SIZE - 55, {
    maxWidth: contentW - 500, startSize: 30, minSize: 18, weight: 700, family: brand.font, label: 'Shop name',
  });

  ctx.fillStyle = '#1f1b17';
  ctx.font = `700 30px "${brand.font}"`;
  ctx.textAlign = 'right';
  ctx.fillText('DIGITAL DOWNLOAD', SIZE - margin, SIZE - 55);
}

// "Track Your Collection Your Way" guide — layout, columns, and bullets are
// fixed on purpose; only the checklist screenshot itself differs.
const CHECKLIST_GUIDE_COLUMNS = [
  {
    heading: 'DIGITAL',
    bullets: ['Open the fillable PDF', 'Click checkboxes as you collect cards', 'Save your progress', 'Reopen and keep updating anytime'],
  },
  {
    heading: 'PRINTED',
    bullets: ['Print the checklist', 'Check cards off by hand', 'Keep it with your binder', 'Use it as a quick collection reference'],
  },
];

function drawChecklistGuide(ctx, brand, product, images, watermark) {
  ctx.fillStyle = brand.accentColor;
  ctx.fillRect(0, 0, SIZE, SIZE);
  const textColor = contrastText(brand.accentColor);
  const margin = 100;
  const contentW = SIZE - margin * 2;

  // ---- Header ----
  ctx.fillStyle = brand.primaryColor;
  fitSingleLine(ctx, brand.companyName.toUpperCase(), margin, 108, {
    maxWidth: contentW, startSize: 32, minSize: 20, weight: 700, family: brand.font, label: 'Shop name',
  });

  ctx.strokeStyle = brand.primaryColor;
  ctx.globalAlpha = 0.25;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(margin, 128);
  ctx.lineTo(SIZE - margin, 128);
  ctx.stroke();
  ctx.globalAlpha = 1;

  // ---- Title (fixed, two lines) ----
  ctx.fillStyle = textColor;
  ctx.font = `700 84px "${brand.font}"`;
  ctx.textAlign = 'left';
  ctx.fillText('Track Your Collection', margin, 250);
  ctx.fillText('Your Way', margin, 340);

  // ---- Subtitle (fixed) ----
  ctx.globalAlpha = 0.7;
  ctx.font = `500 38px "${brand.font}"`;
  wrapText(ctx, 'Use the included checklist digitally or print it and track by hand.', margin, 416, contentW, 48, 'left');
  ctx.globalAlpha = 1;

  // ---- Large checklist preview image ----
  const imgTop = 560, imgH = 560;
  ctx.save();
  roundRect(ctx, margin, imgTop, contentW, imgH, 18);
  ctx.clip();
  const img = images.checklist;
  if (img) {
    drawContain(ctx, margin, imgTop, contentW, imgH, img);
  } else {
    ctx.fillStyle = '#f1ece4';
    ctx.fillRect(margin, imgTop, contentW, imgH);
  }
  if (watermark) {
    drawWatermark(ctx, watermark.text, watermark, { x: margin, y: imgTop, w: contentW, h: imgH });
  }
  ctx.restore();
  ctx.strokeStyle = 'rgba(0,0,0,0.1)';
  ctx.lineWidth = 2;
  roundRect(ctx, margin, imgTop, contentW, imgH, 18);
  ctx.stroke();

  // ---- "Actual Checklist Preview" badge, overlaid top-left on the image ----
  ctx.font = `700 24px "${brand.font}"`;
  const badgeLabel = 'ACTUAL CHECKLIST PREVIEW';
  const badgePadX = 20, badgeH = 46;
  const badgeW = ctx.measureText(badgeLabel).width + badgePadX * 2;
  const badgeX = margin + 24, badgeY = imgTop + 24;
  ctx.fillStyle = '#faf6ef';
  ctx.globalAlpha = 0.92;
  roundRect(ctx, badgeX, badgeY, badgeW, badgeH, badgeH / 2);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#1f1b17';
  ctx.textAlign = 'left';
  ctx.fillText(badgeLabel, badgeX + badgePadX, badgeY + badgeH / 2 + 8);

  // ---- Two columns: Digital / Printed ----
  const colsTop = imgTop + imgH + 50;
  const colGap = 40;
  const colW = (contentW - colGap) / 2;
  const colH = 460;
  const bulletSlotH = 72;

  CHECKLIST_GUIDE_COLUMNS.forEach((col, i) => {
    const colX = margin + i * (colW + colGap);
    const cx = colX + colW / 2;

    ctx.fillStyle = '#ffffff';
    roundRect(ctx, colX, colsTop, colW, colH, 20);
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.08)';
    ctx.lineWidth = 2;
    roundRect(ctx, colX, colsTop, colW, colH, 20);
    ctx.stroke();

    const headingY = colsTop + 64;
    ctx.fillStyle = '#1f1b17';
    ctx.font = `700 32px "${brand.font}"`;
    ctx.textAlign = 'center';
    ctx.fillText(col.heading, cx, headingY);

    const ruleY = headingY + 24;
    ctx.strokeStyle = brand.primaryColor;
    ctx.globalAlpha = 0.2;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(colX + 40, ruleY);
    ctx.lineTo(colX + colW - 40, ruleY);
    ctx.stroke();
    ctx.globalAlpha = 1;

    const bulletsTop = ruleY + 46;
    const textX = colX + 66;
    const textMaxW = colW - 106;
    col.bullets.forEach((bullet, bi) => {
      const by = bulletsTop + bi * bulletSlotH;
      ctx.fillStyle = brand.primaryColor;
      ctx.globalAlpha = 0.55;
      ctx.beginPath();
      ctx.arc(colX + 40, by - 8, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;

      ctx.fillStyle = textColor;
      fitLines(ctx, bullet, textX, by, {
        maxWidth: textMaxW, maxLines: 2, startSize: 26, minSize: 18, step: 2, weight: 500, family: brand.font, label: 'List item',
      });
    });
  });

  // ---- Highlighted note box ----
  const boxTop = colsTop + colH + 50;
  const boxH = 140;
  ctx.fillStyle = brand.primaryColor;
  ctx.globalAlpha = 0.12;
  roundRect(ctx, margin, boxTop, contentW, boxH, 20);
  ctx.fill();
  ctx.globalAlpha = 1;

  ctx.fillStyle = '#1f1b17';
  ctx.font = `700 38px "${brand.font}"`;
  ctx.textAlign = 'center';
  ctx.fillText('USE IT DIGITALLY OR PRINT IT — BOTH OPTIONS ARE INCLUDED', SIZE / 2, boxTop + 58);

  ctx.fillStyle = textColor;
  ctx.globalAlpha = 0.6;
  ctx.font = `500 26px "${brand.font}"`;
  ctx.fillText('Standard + Reverse Holo variants are tracked separately', SIZE / 2, boxTop + 102);
  ctx.globalAlpha = 1;

  // ---- Footer ----
  ctx.strokeStyle = brand.primaryColor;
  ctx.globalAlpha = 0.2;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(margin, SIZE - 100);
  ctx.lineTo(SIZE - margin, SIZE - 100);
  ctx.stroke();
  ctx.globalAlpha = 1;

  ctx.fillStyle = brand.primaryColor;
  fitSingleLine(ctx, brand.companyName.toUpperCase(), margin, SIZE - 55, {
    maxWidth: contentW - 500, startSize: 30, minSize: 18, weight: 700, family: brand.font, label: 'Shop name',
  });

  ctx.fillStyle = '#1f1b17';
  ctx.font = `700 30px "${brand.font}"`;
  ctx.textAlign = 'right';
  ctx.fillText('DIGITAL DOWNLOAD', SIZE - margin, SIZE - 55);
}

// "How to Access Your Download" guide — entirely fixed (no images, no
// product-specific text), the last of the 7 listing images. Always the same
// post-purchase walkthrough regardless of which product this happens to be.
// A function rather than a plain constant so the ZIP step can pluralize
// correctly if zip_file_count is ever more than 1.
function getDownloadReadySteps() {
  const zipCount = ZIP_FILE_COUNT;
  const zipPhrase = zipCount === 1 ? `the downloaded ${zipFileWord(zipCount)}` : `all ${zipCount} downloaded ${zipFileWord(zipCount)}`;
  return [
    { n: '1', heading: 'PURCHASE', desc: 'Complete your Etsy order.' },
    { n: '2', heading: 'DOWNLOAD', desc: 'Access your digital files from Etsy.' },
    { n: '3', heading: 'UNZIP', desc: `Open ${zipPhrase}.` },
    { n: '4', heading: 'CHOOSE YOUR FILES', desc: 'Pick color or greyscale, your preferred size, and the checklist.' },
    { n: '5', heading: 'START COLLECTING', desc: 'Print your placeholders and/or use the checklist digitally.' },
  ];
}

function drawDownloadReady(ctx, brand, product) {
  const DOWNLOAD_READY_STEPS = getDownloadReadySteps();
  ctx.fillStyle = brand.accentColor;
  ctx.fillRect(0, 0, SIZE, SIZE);
  const textColor = contrastText(brand.accentColor);
  const margin = 100;
  const contentW = SIZE - margin * 2;

  // ---- Header ----
  ctx.fillStyle = brand.primaryColor;
  fitSingleLine(ctx, brand.companyName.toUpperCase(), margin, 108, {
    maxWidth: contentW, startSize: 32, minSize: 20, weight: 700, family: brand.font, label: 'Shop name',
  });

  ctx.strokeStyle = brand.primaryColor;
  ctx.globalAlpha = 0.25;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(margin, 128);
  ctx.lineTo(SIZE - margin, 128);
  ctx.stroke();
  ctx.globalAlpha = 1;

  // ---- Title (fixed, two lines) ----
  ctx.fillStyle = textColor;
  ctx.font = `700 84px "${brand.font}"`;
  ctx.textAlign = 'left';
  ctx.fillText('How to Access', margin, 250);
  ctx.fillText('Your Download', margin, 340);

  // ---- Subtitle (fixed) ----
  ctx.globalAlpha = 0.7;
  ctx.font = `500 38px "${brand.font}"`;
  wrapText(ctx, 'What happens after you purchase.', margin, 416, contentW, 48, 'left');
  ctx.globalAlpha = 1;

  // ---- Five stacked step rows, connected by arrows ----
  const rowsTop = 560;
  const rowH = 160;
  const rowGap = 40;
  const circleR = 40;
  const circleCx = margin + 70;
  const textX = margin + 150;
  const textMaxW = contentW - 190;

  DOWNLOAD_READY_STEPS.forEach((step, i) => {
    const rowTop = rowsTop + i * (rowH + rowGap);
    const cy = rowTop + rowH / 2;

    ctx.fillStyle = '#ffffff';
    roundRect(ctx, margin, rowTop, contentW, rowH, 18);
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.08)';
    ctx.lineWidth = 2;
    roundRect(ctx, margin, rowTop, contentW, rowH, 18);
    ctx.stroke();

    ctx.fillStyle = brand.primaryColor;
    ctx.globalAlpha = 0.14;
    ctx.beginPath();
    ctx.arc(circleCx, cy, circleR, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.fillStyle = brand.primaryColor;
    ctx.font = `700 34px "${brand.font}"`;
    ctx.textAlign = 'center';
    ctx.fillText(step.n, circleCx, cy + 12);

    ctx.fillStyle = '#1f1b17';
    ctx.font = `700 30px "${brand.font}"`;
    ctx.textAlign = 'left';
    ctx.fillText(step.heading, textX, cy - 12);

    ctx.fillStyle = textColor;
    ctx.globalAlpha = 0.75;
    ctx.font = `500 24px "${brand.font}"`;
    wrapText(ctx, step.desc, textX, cy + 26, textMaxW, 30, 'left');
    ctx.globalAlpha = 1;

    if (i < DOWNLOAD_READY_STEPS.length - 1) {
      const arrowCy = rowTop + rowH + rowGap / 2;
      ctx.fillStyle = brand.primaryColor;
      ctx.globalAlpha = 0.5;
      ctx.beginPath();
      ctx.moveTo(circleCx - 9, arrowCy - 8);
      ctx.lineTo(circleCx + 9, arrowCy - 8);
      ctx.lineTo(circleCx, arrowCy + 8);
      ctx.closePath();
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  });

  // ---- Highlighted note box ----
  const boxTop = rowsTop + DOWNLOAD_READY_STEPS.length * (rowH + rowGap) - rowGap + 50;
  const boxH = 170;
  ctx.fillStyle = brand.primaryColor;
  ctx.globalAlpha = 0.12;
  roundRect(ctx, margin, boxTop, contentW, boxH, 20);
  ctx.fill();
  ctx.globalAlpha = 1;

  ctx.fillStyle = '#1f1b17';
  ctx.font = `700 38px "${brand.font}"`;
  ctx.textAlign = 'center';
  ctx.fillText('PRINT ONLY WHAT YOU NEED', SIZE / 2, boxTop + 64);

  ctx.fillStyle = textColor;
  ctx.globalAlpha = 0.65;
  ctx.font = `500 26px "${brand.font}"`;
  ctx.fillText('You do not need to print every file — just choose the version you want.', SIZE / 2, boxTop + 112);
  ctx.globalAlpha = 1;

  // ---- Footer ----
  ctx.fillStyle = textColor;
  ctx.globalAlpha = 0.55;
  ctx.font = `500 26px "${brand.font}"`;
  ctx.textAlign = 'center';
  ctx.fillText(DIGITAL_DISCLAIMER, SIZE / 2, SIZE - 140);
  ctx.globalAlpha = 1;

  ctx.strokeStyle = brand.primaryColor;
  ctx.globalAlpha = 0.2;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(margin, SIZE - 100);
  ctx.lineTo(SIZE - margin, SIZE - 100);
  ctx.stroke();
  ctx.globalAlpha = 1;

  ctx.fillStyle = brand.primaryColor;
  fitSingleLine(ctx, brand.companyName.toUpperCase(), margin, SIZE - 55, {
    maxWidth: contentW - 500, startSize: 30, minSize: 18, weight: 700, family: brand.font, label: 'Shop name',
  });

  ctx.fillStyle = '#1f1b17';
  ctx.font = `700 30px "${brand.font}"`;
  ctx.textAlign = 'right';
  ctx.fillText('DIGITAL DOWNLOAD', SIZE - margin, SIZE - 55);
}

// =========================================================================
// SEO title & tag generator (rule-based, offline)
// =========================================================================
const STOPWORDS = new Set(['a', 'an', 'the', 'for', 'with', 'and', 'of', 'to', 'in', 'on', 'your', 'my', 'our',
  'is', 'it', 'this', 'that', 'or', 'by', 'at', 'as', 'be', 'are']);

const BADGE_TAG_MAP = {
  'instant download': 'instant download',
  'editable in canva': 'editable canva',
  'commercial use': 'commercial use',
  'printable': 'printable',
  'high resolution': 'high resolution',
  'diy editable': 'diy editable',
  'no prep': 'no prep',
  'print & go': 'print and go',
  'answer key included': 'answer key',
  'black & white + color': 'bw and color',
  'google slides included': 'google slides',
  'common core aligned': 'common core',
};

const TYPE_INFO = {
  classroom: { phrase: 'Printable Worksheet', tags: ['printable worksheet', 'classroom resource', 'teacher resource'] },
  background: { phrase: 'Digital Wallpaper', tags: ['digital wallpaper', 'phone wallpaper', 'background design'] },
  checklist: { phrase: 'Printable Checklist', tags: ['printable checklist', 'checklist template', 'planner placeholder'] },
  mixed: { phrase: 'Digital Download', tags: ['digital download', 'instant download'] },
};

function tokenizeWords(text) {
  return (text || '')
    .toLowerCase()
    .split(/[^a-z0-9']+/)
    .filter(w => w && !STOPWORDS.has(w));
}

function ngramsFromText(text, sizes) {
  const words = tokenizeWords(text);
  const out = [];
  sizes.forEach(n => {
    for (let i = 0; i + n <= words.length; i++) {
      out.push(words.slice(i, i + n).join(' '));
    }
  });
  return out;
}

function dedupeCapped(list, cap) {
  const seen = new Set();
  const out = [];
  for (const item of list) {
    const key = item.trim().toLowerCase();
    if (!key || seen.has(key) || key.length > 20 || key.length < 3) continue;
    seen.add(key);
    out.push(key);
    if (out.length >= cap) break;
  }
  return out;
}

function generateSEO(brand, product) {
  const typeInfo = TYPE_INFO[product.type] || TYPE_INFO.mixed;

  // ---- Tags ----
  const gradeSubjectNgrams = [
    ...ngramsFromText(product.gradeLevel, [2, 1]),
    ...ngramsFromText(product.subject, [2, 1]),
  ];
  const gradeSubjectPhrase = [product.gradeLevel, product.subject].filter(Boolean).join(' ').trim().toLowerCase();
  const nameNgrams = ngramsFromText(product.name, [3, 2, 1]);
  const badgeTags = product.badges
    .map(b => BADGE_TAG_MAP[b.toLowerCase()] || b.toLowerCase())
    .filter(Boolean);
  const taglineNgrams = ngramsFromText(product.tagline, [3, 2]);
  const bulletNgrams = product.bullets.flatMap(b => ngramsFromText(b, [2, 3]));
  const generic = ['digital download', 'instant download', 'printable pdf'];

  const tagPool = [
    gradeSubjectPhrase,
    ...gradeSubjectNgrams,
    ...nameNgrams,
    ...badgeTags,
    ...typeInfo.tags,
    ...taglineNgrams,
    ...bulletNgrams,
    ...generic,
  ];
  const tags = dedupeCapped(tagPool, 13);

  // ---- Titles ----
  const truncate = (s) => s.length <= 140 ? s : s.slice(0, 140).replace(/\s+\S*$/, '');
  const joinUnique = (parts, sep) => {
    const seen = new Set();
    const out = [];
    parts.filter(Boolean).forEach(p => {
      const key = p.trim().toLowerCase();
      if (seen.has(key)) return;
      seen.add(key);
      out.push(p.trim());
    });
    return out.join(sep);
  };

  const gradeSubjectTitle = [product.gradeLevel, product.subject].filter(Boolean).join(' ');

  const candidates = [
    joinUnique([gradeSubjectTitle, product.name, typeInfo.phrase, ...product.badges.slice(0, 3)], ', '),
    joinUnique([product.name, gradeSubjectTitle, typeInfo.phrase, product.tagline], ' - '),
    joinUnique([typeInfo.phrase, gradeSubjectTitle, product.name, product.badges.join(', ')], ' - '),
  ].map(truncate).filter((v, i, arr) => v && arr.indexOf(v) === i);

  return { titles: candidates, tags };
}

function renderSEO(brand, product) {
  const { titles, tags } = generateSEO(brand, product);
  lastTags = tags;

  els.seoTitles.innerHTML = '';
  titles.forEach(title => {
    const row = document.createElement('div');
    row.className = 'seo-title-row';
    row.innerHTML = `<span class="title-text"></span><span class="char-count">${title.length}/140</span><button type="button">Copy</button>`;
    row.querySelector('.title-text').textContent = title;
    row.querySelector('button').addEventListener('click', () => copyText(title, row.querySelector('button')));
    els.seoTitles.appendChild(row);
  });

  els.seoTags.innerHTML = '';
  tags.forEach(tag => {
    const span = document.createElement('span');
    span.className = 'seo-tag';
    span.textContent = tag;
    els.seoTags.appendChild(span);
  });
  els.seoTagCount.textContent = tags.length;

  els.seoPanel.hidden = false;
}

function copyText(text, btn) {
  navigator.clipboard.writeText(text).then(() => {
    if (btn) {
      const original = btn.textContent;
      btn.textContent = 'Copied!';
      setTimeout(() => { btn.textContent = original; }, 1500);
    }
  }).catch(() => setStatus('Could not copy to clipboard.'));
}

els.copyTagsBtn.addEventListener('click', () => {
  copyText(lastTags.join(', '), els.copyTagsBtn);
});

// =========================================================================
// Generation pipeline
// =========================================================================
function setStatus(msg) {
  els.statusMsg.textContent = msg;
  if (msg) setTimeout(() => { if (els.statusMsg.textContent === msg) els.statusMsg.textContent = ''; }, 4000);
}

function makeCanvas() {
  const c = document.createElement('canvas');
  c.width = SIZE;
  c.height = SIZE;
  return c;
}

function addCard(name, canvas) {
  const card = document.createElement('div');
  card.className = 'card';
  const footer = document.createElement('div');
  footer.className = 'card-footer';
  footer.innerHTML = `<span class="name">${name}</span>`;
  const btn = document.createElement('button');
  btn.textContent = 'Download PNG';
  btn.addEventListener('click', () => downloadCanvas(canvas, name));
  footer.appendChild(btn);
  card.appendChild(canvas);
  card.appendChild(footer);
  els.gallery.appendChild(card);
}

function downloadCanvas(canvas, name) {
  const link = document.createElement('a');
  link.download = `${name.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
}

// Checklist/placeholder screenshots now display via drawContain (letterbox,
// full image always visible) rather than cropping. An upload whose aspect
// ratio is very different from a "normal" screenshot will still show in
// full, but with a lot of background padding around it — worth flagging so
// the user can swap in a closer-fitting image if that's not what they want.
const CHECKLIST_IMAGE_LABELS = {
  checklist: 'Checklist Screenshot', color: 'Color Placeholders Preview', grey: 'Greyscale Placeholders Preview',
  size9: '9 Cards/Page Layout Preview', size16: '16 Cards/Page Layout Preview', size25: '25 Cards/Page Layout Preview',
};
function checkImageAspectRatios() {
  Object.entries(checklistImages).forEach(([key, img]) => {
    if (!img) return;
    const ar = img.naturalWidth / img.naturalHeight;
    if (ar < 0.4 || ar > 2.5) {
      warnOnce(`${CHECKLIST_IMAGE_LABELS[key] || key} has an unusual aspect ratio (${img.naturalWidth}×${img.naturalHeight}) — it will show with noticeable background padding around it rather than filling its frame.`);
    }
  });
}

function renderValidationWarnings() {
  if (!els.validationWarnings) return;
  if (!generationWarnings.length) {
    els.validationWarnings.hidden = true;
    els.validationWarnings.innerHTML = '';
    return;
  }
  els.validationWarnings.hidden = false;
  els.validationWarnings.innerHTML = `
    <strong>Before you publish, review:</strong>
    <ul>${generationWarnings.map(w => `<li>${w}</li>`).join('')}</ul>
  `;
}

els.form.addEventListener('submit', async e => {
  e.preventDefault();

  if (els.productType.value === 'checklist') {
    const missing = missingChecklistImageLabels();
    if (missing.length) {
      alert(`Please upload the following before generating:\n\n${missing.map(m => '- ' + m).join('\n')}`);
      els.checklistImagesSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
  }

  els.downloadAllBtn.disabled = true;
  setStatus('Generating images…');
  els.gallery.innerHTML = '';
  generatedCanvases = [];
  generationWarnings = [];
  els.emptyState.style.display = 'none';
  checkImageAspectRatios();

  const brand = getBrand();
  const product = getProduct();
  rememberProductName(product.name);
  await ensureFont(brand.font);

  const watermark = getWatermarkConfig(brand);
  const watermarkFor = (key) => (watermark.enabled && watermark.targets.has(key)) ? watermark : null;

  // Fixed set of 7 listing images for the Checklist + Placeholders product
  // type — order matters, it's the Etsy listing order.
  const candidates = [
    {
      label: 'Hero Cover',
      key: 'hero',
      include: true,
      fn: (ctx) => drawChecklistHero(ctx, brand, product, checklistImages.color, watermarkFor('hero')),
    },
    {
      label: 'Everything Included',
      key: 'showcase',
      include: true,
      fn: (ctx) => drawIncludedShowcase(ctx, brand, product, checklistImages, watermarkFor('showcase')),
    },
    {
      label: 'Choose Your Size',
      key: 'sizes',
      include: true,
      fn: (ctx) => drawSizeGuide(ctx, brand, product, checklistImages, watermarkFor('sizes')),
    },
    {
      label: 'Print Style',
      key: 'printstyle',
      include: true,
      fn: (ctx) => drawPrintStyleGuide(ctx, brand, product, checklistImages, watermarkFor('printstyle')),
    },
    {
      label: '3 Easy Steps',
      key: 'easysteps',
      include: true,
      fn: (ctx) => drawEasySteps(ctx, brand, product),
    },
    {
      label: 'Track Your Collection',
      key: 'checklistguide',
      include: true,
      fn: (ctx) => drawChecklistGuide(ctx, brand, product, checklistImages, watermarkFor('checklistguide')),
    },
    {
      label: 'How to Access Your Download',
      key: 'ready',
      include: true,
      fn: (ctx) => drawDownloadReady(ctx, brand, product),
    },
  ];

  const templates = candidates.filter(t => t.include).map((t, i) => ({
    ...t,
    name: `${String(i + 1).padStart(2, '0')} ${t.label}`,
  }));

  // Watermarking is automatic and role-based: the Hero Cover, Everything
  // Included showcase, Choose Your Size guide, Print Style guide, and Track
  // Your Collection guide each draw their own watermark internally, clipped
  // to their real-product-preview image areas. 3 Easy Steps and Your
  // Download Is Ready are decorative/text-only and are never watermarked,
  // full canvas or otherwise — there's no "actual artwork" on them to
  // protect.
  templates.forEach(t => {
    const canvas = makeCanvas();
    const ctx = canvas.getContext('2d');
    t.fn(ctx);
    addCard(t.name, canvas);
    generatedCanvases.push({ name: t.name, canvas });
  });

  renderSEO(brand, product);
  renderValidationWarnings();

  els.downloadAllBtn.disabled = false;
  setStatus(`Done — ${templates.length} images ready.`);
});

els.downloadAllBtn.addEventListener('click', async () => {
  if (!generatedCanvases.length) return;
  setStatus('Zipping…');
  const zip = new JSZip();
  await Promise.all(generatedCanvases.map(({ name, canvas }) => new Promise(resolve => {
    canvas.toBlob(blob => {
      zip.file(`${name.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.png`, blob);
      resolve();
    }, 'image/png');
  })));
  const content = await zip.generateAsync({ type: 'blob' });
  const link = document.createElement('a');
  link.download = 'etsy-listing-images.zip';
  link.href = URL.createObjectURL(content);
  link.click();
  setStatus('ZIP downloaded.');
});
