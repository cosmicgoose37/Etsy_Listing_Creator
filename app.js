const SIZE = 2000;
const PROFILES_STORAGE_KEY = 'etsyImageMaker.profiles.v2';
const OLD_BRAND_STORAGE_KEY = 'etsyImageMaker.brand.v1';
const THEME_KEY = 'etsyImageMaker.theme';
const WATERMARK_SECTION_OPEN_KEY = 'etsyImageMaker.watermarkSectionOpen';

// Two fixed color schemes for now, in place of a full custom color picker.
const COLOR_SCHEME_KEY = 'etsyImageMaker.colorScheme';
const COLOR_SCHEMES = [
  { id: 'orange', name: 'Orange', primary: '#c96b4f', accent: '#f4e9dd' },
  { id: 'teal', name: 'Dark Teal', primary: '#1f5f58', accent: '#e7f2f0' },
];

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
  checklistImgPrintColor: document.getElementById('checklistImgPrintColor'),
  checklistImgPrintColorPreview: document.getElementById('checklistImgPrintColorPreview'),
  checklistImgPrintColorStatus: document.getElementById('checklistImgPrintColorStatus'),
  checklistImgPrintGrey: document.getElementById('checklistImgPrintGrey'),
  checklistImgPrintGreyPreview: document.getElementById('checklistImgPrintGreyPreview'),
  checklistImgPrintGreyStatus: document.getElementById('checklistImgPrintGreyStatus'),
  productName: document.getElementById('productName'),
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
const checklistImages = { checklist: null, color: null, grey: null, size9: null, size16: null, size25: null, printColor: null, printGrey: null };

function syncChecklistImagesVisibility() {
  els.checklistImagesSection.hidden = els.productType.value !== 'checklist';
}

function bindChecklistImageUpload(inputEl, previewEl, statusEl, key) {
  inputEl.addEventListener('change', () => {
    const file = inputEl.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        checklistImages[key] = img;
        previewEl.innerHTML = `<img src="${reader.result}" alt="" />`;
        statusEl.textContent = '— uploaded';
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

bindChecklistImageUpload(els.checklistImgChecklist, els.checklistImgChecklistPreview, els.checklistImgChecklistStatus, 'checklist');
bindChecklistImageUpload(els.checklistImgColor, els.checklistImgColorPreview, els.checklistImgColorStatus, 'color');
bindChecklistImageUpload(els.checklistImgGrey, els.checklistImgGreyPreview, els.checklistImgGreyStatus, 'grey');
bindChecklistImageUpload(els.checklistImgSize9, els.checklistImgSize9Preview, els.checklistImgSize9Status, 'size9');
bindChecklistImageUpload(els.checklistImgSize16, els.checklistImgSize16Preview, els.checklistImgSize16Status, 'size16');
bindChecklistImageUpload(els.checklistImgSize25, els.checklistImgSize25Preview, els.checklistImgSize25Status, 'size25');
bindChecklistImageUpload(els.checklistImgPrintColor, els.checklistImgPrintColorPreview, els.checklistImgPrintColorStatus, 'printColor');
bindChecklistImageUpload(els.checklistImgPrintGrey, els.checklistImgPrintGreyPreview, els.checklistImgPrintGreyStatus, 'printGrey');

function missingChecklistImageLabels() {
  const missing = [];
  if (!checklistImages.checklist) missing.push('Checklist Screenshot');
  if (!checklistImages.color) missing.push('Color Placeholders Preview');
  if (!checklistImages.grey) missing.push('Greyscale Placeholders Preview');
  if (!checklistImages.size9) missing.push('9 Cards/Page Layout Preview');
  if (!checklistImages.size16) missing.push('16 Cards/Page Layout Preview');
  if (!checklistImages.size25) missing.push('25 Cards/Page Layout Preview');
  if (!checklistImages.printColor) missing.push('Color Print Style Preview');
  if (!checklistImages.printGrey) missing.push('Greyscale Print Style Preview');
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

function wrapText(ctx, text, x, y, maxWidth, lineHeight, align = 'left') {
  const words = text.split(' ');
  let line = '';
  let curY = y;
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
  lines.forEach(l => {
    ctx.textAlign = align;
    ctx.fillText(l, x, curY);
    curY += lineHeight;
  });
  return curY;
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

  // ---- Header ----
  ctx.fillStyle = brand.primaryColor;
  ctx.font = `700 32px "${brand.font}"`;
  ctx.textAlign = 'left';
  ctx.fillText(brand.companyName.toUpperCase(), margin, 108);

  ctx.strokeStyle = brand.primaryColor;
  ctx.globalAlpha = 0.25;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(margin, 128);
  ctx.lineTo(SIZE - margin, 128);
  ctx.stroke();
  ctx.globalAlpha = 1;

  // ---- Headline ----
  ctx.fillStyle = textColor;
  ctx.font = `700 104px "${brand.font}"`;
  ctx.textAlign = 'left';
  let y = wrapText(ctx, product.name, margin, 232, contentW, 110, 'left');

  if (product.tagline) {
    ctx.font = `500 38px "${brand.font}"`;
    ctx.globalAlpha = 0.7;
    y = wrapText(ctx, product.tagline, margin, y + 4, contentW, 44, 'left');
    ctx.globalAlpha = 1;
  }

  // ---- Feature line — one simple line, not boxes, to keep this calm ----
  const features = (product.bullets.length ? product.bullets : ['Instant Download', 'High Quality', 'Easy to Use'])
    .slice(0, 3)
    .map(raw => splitFeatureLine(raw).label);
  ctx.fillStyle = brand.primaryColor;
  ctx.font = `600 34px "${brand.font}"`;
  ctx.textAlign = 'left';
  const featureY = y + 56;
  const featureBottom = wrapText(ctx, features.join('   •   ').toUpperCase(), margin, featureY, contentW, 42, 'left');

  // ---- One large showcase image — the Color Placeholders preview ----
  const imgTop = featureBottom + 40;
  const imgBottom = SIZE - 170;
  const imgH = imgBottom - imgTop;

  ctx.save();
  roundRect(ctx, margin, imgTop, contentW, imgH, 16);
  ctx.clip();
  if (colorImg) {
    drawCover(ctx, margin, imgTop, contentW, imgH, colorImg);
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
const SHOWCASE_STEPS = [
  'Unzip your instant download',
  'Choose 9, 16 or 25 cards/page',
  'Pick color or greyscale',
  'Print, cut & place in your binder',
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

  // ---- Header ----
  ctx.fillStyle = brand.primaryColor;
  ctx.font = `700 32px "${brand.font}"`;
  ctx.textAlign = 'left';
  ctx.fillText(brand.companyName.toUpperCase(), margin, 108);

  ctx.strokeStyle = brand.primaryColor;
  ctx.globalAlpha = 0.25;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(margin, 128);
  ctx.lineTo(SIZE - margin, 128);
  ctx.stroke();
  ctx.globalAlpha = 1;

  // ---- "Digital Download" badge, top right ----
  const badgeW = 380, badgeH = 172, badgeX = SIZE - margin - badgeW, badgeY = 56;
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

  // ---- Subtitle — the one editable piece, built from the product name ----
  ctx.font = `500 38px "${brand.font}"`;
  ctx.globalAlpha = 0.7;
  const subtitle = `A complete ${product.name} toolkit for planning and tracking your binder.`;
  const subtitleBottom = wrapText(ctx, subtitle, margin, 416, contentW, 48, 'left');
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
      drawCover(ctx, imgX, imgY, imgW, imgH, img);
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

  // Right column — how to use it
  const rightX = midX + colPad;
  ctx.fillStyle = brand.primaryColor;
  ctx.font = `700 34px "${brand.font}"`;
  ctx.textAlign = 'left';
  ctx.fillText('HOW TO USE IT', rightX, boxTop + 84);

  const stepR = 30;
  const stepTextX = rightX + stepR * 2 + 24;
  const stepTextMaxW = margin + contentW - stepTextX - colPad + 40;
  const stepsTop = boxTop + 84 + 60;
  const stepGap = (boxH - 84 - 60 - 30) / SHOWCASE_STEPS.length;
  SHOWCASE_STEPS.forEach((step, i) => {
    const cy = stepsTop + i * stepGap + stepR;
    ctx.fillStyle = brand.primaryColor;
    ctx.beginPath();
    ctx.arc(rightX + stepR, cy, stepR, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = contrastText(brand.primaryColor);
    ctx.font = `700 30px "${brand.font}"`;
    ctx.textAlign = 'center';
    ctx.fillText(String(i + 1), rightX + stepR, cy + 11);

    ctx.fillStyle = textColor;
    ctx.font = `600 32px "${brand.font}"`;
    ctx.textAlign = 'left';
    ctx.fillText(step, stepTextX, cy + 11, stepTextMaxW);
  });

  // ---- Footer ----
  ctx.fillStyle = textColor;
  ctx.globalAlpha = 0.55;
  ctx.font = `500 28px "${brand.font}"`;
  ctx.textAlign = 'left';
  ctx.fillText('Digital product only • No physical item will be shipped', margin, SIZE - 55);
  ctx.globalAlpha = 1;

  ctx.fillStyle = brand.primaryColor;
  ctx.font = `700 30px "${brand.font}"`;
  ctx.textAlign = 'right';
  ctx.fillText(brand.companyName.toUpperCase(), SIZE - margin, SIZE - 55);
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
  ctx.font = `700 32px "${brand.font}"`;
  ctx.textAlign = 'left';
  ctx.fillText(brand.companyName.toUpperCase(), margin, 108);

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
      drawCover(ctx, imgX, imgY, imgW, imgH, img);
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
  ctx.font = `700 30px "${brand.font}"`;
  ctx.textAlign = 'left';
  ctx.fillText(brand.companyName.toUpperCase(), margin, SIZE - 55);

  ctx.fillStyle = '#1f1b17';
  ctx.font = `700 30px "${brand.font}"`;
  ctx.textAlign = 'right';
  ctx.fillText('DIGITAL DOWNLOAD', SIZE - margin, SIZE - 55);
}

// "Choose Your Print Style" guide — layout is fixed on purpose (title,
// subtitle, card labels/descriptions/badges/notes, and the highlight box
// never change); only the 2 preview images differ, one per print style.
const PRINT_STYLE_CARDS = [
  { key: 'printColor', title: 'COLOR', subtitle: 'Full-color placeholders', badge: 'FULL COLOR', caption: 'Bright, visual binder planning', note: 'Available in 9 • 16 • 25 cards/page' },
  { key: 'printGrey', title: 'GREYSCALE', subtitle: 'Ink-friendly placeholders', badge: 'INK FRIENDLY', caption: 'Cleaner, lower-ink printing option', note: 'Available in 9 • 16 • 25 cards/page' },
];

function drawPrintStyleGuide(ctx, brand, product, images, watermark) {
  ctx.fillStyle = brand.accentColor;
  ctx.fillRect(0, 0, SIZE, SIZE);
  const textColor = contrastText(brand.accentColor);
  const margin = 100;
  const contentW = SIZE - margin * 2;

  // ---- Header ----
  ctx.fillStyle = brand.primaryColor;
  ctx.font = `700 32px "${brand.font}"`;
  ctx.textAlign = 'left';
  ctx.fillText(brand.companyName.toUpperCase(), margin, 108);

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
      drawCover(ctx, imgX, imgY, imgW, imgH, img);
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
  ctx.font = `700 30px "${brand.font}"`;
  ctx.textAlign = 'left';
  ctx.fillText(brand.companyName.toUpperCase(), margin, SIZE - 55);

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
    bullets: ['Print your selected placeholder pages', 'Cut along the placeholder edges', 'Use your preferred paper or cardstock'],
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

  // ---- Header ----
  ctx.fillStyle = brand.primaryColor;
  ctx.font = `700 32px "${brand.font}"`;
  ctx.textAlign = 'left';
  ctx.fillText(brand.companyName.toUpperCase(), margin, 108);

  ctx.strokeStyle = brand.primaryColor;
  ctx.globalAlpha = 0.25;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(margin, 128);
  ctx.lineTo(SIZE - margin, 128);
  ctx.stroke();
  ctx.globalAlpha = 1;

  // ---- "Instant Download" badge, top right ----
  const badgeW = 380, badgeH = 172, badgeX = SIZE - margin - badgeW, badgeY = 56;
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
      ctx.font = `500 26px "${brand.font}"`;
      ctx.textAlign = 'left';
      wrapText(ctx, bullet, textX, by, textMaxW, 34, 'left');
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
  ctx.fillText('Digital product only • No physical item will be shipped', SIZE / 2, SIZE - 140);
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
  ctx.font = `700 30px "${brand.font}"`;
  ctx.textAlign = 'left';
  ctx.fillText(brand.companyName.toUpperCase(), margin, SIZE - 55);

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
  ctx.font = `700 32px "${brand.font}"`;
  ctx.textAlign = 'left';
  ctx.fillText(brand.companyName.toUpperCase(), margin, 108);

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
    drawCover(ctx, margin, imgTop, contentW, imgH, img);
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
      ctx.font = `500 26px "${brand.font}"`;
      ctx.textAlign = 'left';
      wrapText(ctx, bullet, textX, by, textMaxW, 34, 'left');
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
  ctx.font = `700 30px "${brand.font}"`;
  ctx.textAlign = 'left';
  ctx.fillText(brand.companyName.toUpperCase(), margin, SIZE - 55);

  ctx.fillStyle = '#1f1b17';
  ctx.font = `700 30px "${brand.font}"`;
  ctx.textAlign = 'right';
  ctx.fillText('DIGITAL DOWNLOAD', SIZE - margin, SIZE - 55);
}

// "Your Download Is Ready in Minutes" guide — entirely fixed (no images, no
// product-specific text), the last of the 7 listing images. Always the same
// post-purchase walkthrough regardless of which product this happens to be.
const DOWNLOAD_READY_STEPS = [
  { n: '1', heading: 'PURCHASE', desc: 'Complete your Etsy order.' },
  { n: '2', heading: 'DOWNLOAD', desc: 'Access your digital files from Etsy.' },
  { n: '3', heading: 'UNZIP', desc: 'Open the downloaded ZIP folder.' },
  { n: '4', heading: 'CHOOSE YOUR FILES', desc: 'Pick color or greyscale, your preferred size, and the checklist.' },
  { n: '5', heading: 'START COLLECTING', desc: 'Print your placeholders and/or use the checklist digitally.' },
];

function drawDownloadReady(ctx, brand, product) {
  ctx.fillStyle = brand.accentColor;
  ctx.fillRect(0, 0, SIZE, SIZE);
  const textColor = contrastText(brand.accentColor);
  const margin = 100;
  const contentW = SIZE - margin * 2;

  // ---- Header ----
  ctx.fillStyle = brand.primaryColor;
  ctx.font = `700 32px "${brand.font}"`;
  ctx.textAlign = 'left';
  ctx.fillText(brand.companyName.toUpperCase(), margin, 108);

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
  ctx.fillText('Your Download Is Ready', margin, 250);
  ctx.fillText('in Minutes', margin, 340);

  // ---- Subtitle (fixed) ----
  ctx.globalAlpha = 0.7;
  ctx.font = `500 38px "${brand.font}"`;
  wrapText(ctx, 'A simple guide to what happens after you purchase.', margin, 416, contentW, 48, 'left');
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
  ctx.fillText('Digital download only • No physical product will be shipped', SIZE / 2, SIZE - 140);
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
  ctx.font = `700 30px "${brand.font}"`;
  ctx.textAlign = 'left';
  ctx.fillText(brand.companyName.toUpperCase(), margin, SIZE - 55);

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
  els.emptyState.style.display = 'none';

  const brand = getBrand();
  const product = getProduct();
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
      label: 'Your Download Is Ready',
      key: 'ready',
      include: true,
      fn: (ctx) => drawDownloadReady(ctx, brand, product),
    },
  ];

  const templates = candidates.filter(t => t.include).map((t, i) => ({
    ...t,
    name: `${String(i + 1).padStart(2, '0')} ${t.label}`,
  }));

  // The Hero Cover, Everything Included showcase, Choose Your Size guide,
  // Print Style guide, and Track Your Collection guide all draw their own
  // watermark internally, clipped to their image areas — applying it again
  // here would double it up across the whole canvas. 3 Easy Steps and Your
  // Download Is Ready have no such area, so they get the full-canvas
  // treatment.
  const fullCanvasWatermarkKeys = new Set(['easysteps', 'ready']);

  templates.forEach(t => {
    const canvas = makeCanvas();
    const ctx = canvas.getContext('2d');
    t.fn(ctx);
    if (fullCanvasWatermarkKeys.has(t.key) && watermark.enabled && watermark.targets.has(t.key)) {
      drawWatermark(ctx, watermark.text, watermark);
    }
    addCard(t.name, canvas);
    generatedCanvases.push({ name: t.name, canvas });
  });

  renderSEO(brand, product);

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
