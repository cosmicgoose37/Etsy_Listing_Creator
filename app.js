const SIZE = 2000;
const PROFILES_STORAGE_KEY = 'etsyImageMaker.profiles.v2';
const OLD_BRAND_STORAGE_KEY = 'etsyImageMaker.brand.v1';
const THEME_KEY = 'etsyImageMaker.theme';

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
  logoUpload: document.getElementById('logoUpload'),
  logoPreview: document.getElementById('logoPreview'),
  primaryColor: document.getElementById('primaryColor'),
  primaryColorHex: document.getElementById('primaryColorHex'),
  accentColor: document.getElementById('accentColor'),
  accentColorHex: document.getElementById('accentColorHex'),
  textColorAuto: document.getElementById('textColorAuto'),
  textColorField: document.getElementById('textColorField'),
  textColor: document.getElementById('textColor'),
  textColorHex: document.getElementById('textColorHex'),
  fontChoice: document.getElementById('fontChoice'),
  productType: document.getElementById('productType'),
  gradeSubjectRow: document.getElementById('gradeSubjectRow'),
  productName: document.getElementById('productName'),
  gradeLevel: document.getElementById('gradeLevel'),
  subject: document.getElementById('subject'),
  tagline: document.getElementById('tagline'),
  bullets: document.getElementById('bullets'),
  howItWorks: document.getElementById('howItWorks'),
  clearTypeContentBtn: document.getElementById('clearTypeContentBtn'),
  badgeOptions: document.getElementById('badgeOptions'),
  customBadge: document.getElementById('customBadge'),
  dropZone: document.getElementById('dropZone'),
  imageUpload: document.getElementById('imageUpload'),
  imageThumbs: document.getElementById('imageThumbs'),
  gallery: document.getElementById('gallery'),
  emptyState: document.getElementById('emptyState'),
  downloadAllBtn: document.getElementById('downloadAllBtn'),
  statusMsg: document.getElementById('statusMsg'),
  seoPanel: document.getElementById('seoPanel'),
  seoTitles: document.getElementById('seoTitles'),
  seoTags: document.getElementById('seoTags'),
  seoTagCount: document.getElementById('seoTagCount'),
  copyTagsBtn: document.getElementById('copyTagsBtn'),
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

let uploadedImages = []; // { dataUrl, img }
let generatedCanvases = []; // { name, canvas }
let dragSrcIndex = null;
let lastTags = [];

// =========================================================================
// Brand profiles
// =========================================================================
function defaultProfile(name) {
  return {
    id: 'p_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
    name: name || 'My Shop',
    companyName: '',
    logoDataUrl: '',
    primaryColor: '#c96b4f',
    accentColor: '#f4e9dd',
    textColorAuto: true,
    textColor: '#2b2320',
    font: 'Poppins',
    watermarkEnabled: false,
    watermarkText: '',
    watermarkStyle: 'tiled',
    watermarkColor: '#ffffff',
    watermarkOpacity: 18,
    watermarkTargets: ['hero', 'laptop', 'phone', 'custom', 'pages'],
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
      p.logoDataUrl = old.logoDataUrl || '';
      p.primaryColor = old.primaryColor || p.primaryColor;
      p.accentColor = old.accentColor || p.accentColor;
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
  els.primaryColor.value = p.primaryColor || '#c96b4f';
  els.primaryColorHex.value = els.primaryColor.value.toUpperCase();
  els.accentColor.value = p.accentColor || '#f4e9dd';
  els.accentColorHex.value = els.accentColor.value.toUpperCase();
  els.textColorAuto.checked = p.textColorAuto !== false;
  els.textColorField.hidden = els.textColorAuto.checked;
  els.textColor.value = p.textColor || '#2b2320';
  els.textColorHex.value = els.textColor.value.toUpperCase();
  els.fontChoice.value = p.font || 'Poppins';
  if (p.logoDataUrl) {
    els.logoPreview.dataset.logo = p.logoDataUrl;
    renderLogoPreview(p.logoDataUrl);
  } else {
    delete els.logoPreview.dataset.logo;
    els.logoPreview.innerHTML = '';
  }

  els.watermarkEnabled.checked = !!p.watermarkEnabled;
  els.watermarkOptions.hidden = !p.watermarkEnabled;
  els.watermarkText.value = p.watermarkText || '';
  els.watermarkStyle.value = p.watermarkStyle || 'tiled';
  els.watermarkColor.value = p.watermarkColor || '#ffffff';
  els.watermarkColorHex.value = els.watermarkColor.value.toUpperCase();
  els.watermarkOpacity.value = p.watermarkOpacity != null ? p.watermarkOpacity : 18;
  els.watermarkOpacityLabel.textContent = `${els.watermarkOpacity.value}%`;
  const targets = new Set(p.watermarkTargets || ['hero', 'laptop', 'phone']);
  els.watermarkTargets.querySelectorAll('input[type=checkbox]').forEach(cb => {
    cb.checked = targets.has(cb.value);
  });
}

function persistFormToActiveProfile() {
  const p = getActiveProfile();
  if (!p) return;
  p.companyName = els.companyName.value;
  p.logoDataUrl = els.logoPreview.dataset.logo || '';
  p.primaryColor = els.primaryColor.value;
  p.accentColor = els.accentColor.value;
  p.textColorAuto = els.textColorAuto.checked;
  p.textColor = els.textColor.value;
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

[els.companyName, els.primaryColor, els.accentColor, els.textColor, els.fontChoice,
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

els.textColorAuto.addEventListener('change', () => {
  els.textColorField.hidden = els.textColorAuto.checked;
  persistFormToActiveProfile();
});

function syncGradeSubjectVisibility() {
  els.gradeSubjectRow.hidden = els.productType.value !== 'classroom';
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
  applyTypeContent(els.productType.value);
  syncBadgeVisibility();
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
  setStatus('Cleared saved content for this type.');
});

// Apply whatever's saved (or the sensible defaults) for the initially-selected type.
syncGradeSubjectVisibility();
applyTypeContent(els.productType.value);
syncBadgeVisibility();

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

bindColorHex(els.primaryColor, els.primaryColorHex);
bindColorHex(els.accentColor, els.accentColorHex);
bindColorHex(els.textColor, els.textColorHex);
bindColorHex(els.watermarkColor, els.watermarkColorHex);

function renderLogoPreview(dataUrl) {
  els.logoPreview.innerHTML = `<img src="${dataUrl}" alt="logo preview" />`;
}

els.logoUpload.addEventListener('change', () => {
  const file = els.logoUpload.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    els.logoPreview.dataset.logo = reader.result;
    renderLogoPreview(reader.result);
    persistFormToActiveProfile();
  };
  reader.readAsDataURL(file);
});

// =========================================================================
// Product image uploads
// =========================================================================
function addFiles(fileList) {
  [...fileList].forEach(file => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        uploadedImages.push({ dataUrl: reader.result, img });
        renderThumbs();
        redrawAllPinCanvases();
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

els.dropZone.addEventListener('click', () => els.imageUpload.click());
els.imageUpload.addEventListener('change', () => addFiles(els.imageUpload.files));

els.dropZone.addEventListener('dragover', e => {
  e.preventDefault();
  els.dropZone.classList.add('dragover');
});
els.dropZone.addEventListener('dragleave', () => els.dropZone.classList.remove('dragover'));
els.dropZone.addEventListener('drop', e => {
  e.preventDefault();
  els.dropZone.classList.remove('dragover');
  addFiles(e.dataTransfer.files);
});

function renderThumbs() {
  els.imageThumbs.innerHTML = '';
  uploadedImages.forEach((item, i) => {
    const div = document.createElement('div');
    div.className = 'thumb' + (i === 0 ? ' first' : '');
    div.draggable = true;
    div.innerHTML = `<img src="${item.dataUrl}" /><button type="button" class="remove-btn" title="Remove">&times;</button>`;
    div.querySelector('.remove-btn').addEventListener('click', () => {
      uploadedImages.splice(i, 1);
      renderThumbs();
      redrawAllPinCanvases();
    });
    div.addEventListener('dragstart', () => { dragSrcIndex = i; });
    div.addEventListener('dragover', e => e.preventDefault());
    div.addEventListener('drop', e => {
      e.preventDefault();
      if (dragSrcIndex === null || dragSrcIndex === i) return;
      const moved = uploadedImages.splice(dragSrcIndex, 1)[0];
      uploadedImages.splice(i, 0, moved);
      dragSrcIndex = null;
      renderThumbs();
      redrawAllPinCanvases();
    });
    els.imageThumbs.appendChild(div);
  });
}

function getDesignImage() {
  return uploadedImages[1] ? uploadedImages[1].img : (uploadedImages[0] ? uploadedImages[0].img : null);
}

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

function containRect(canvasW, canvasH, imgW, imgH) {
  const scale = Math.min(canvasW / imgW, canvasH / imgH);
  const w = imgW * scale, h = imgH * scale;
  return { x: (canvasW - w) / 2, y: (canvasH - h) / 2, w, h };
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
// Perspective warp (unit-square -> quadrilateral projective mapping)
// =========================================================================
function computeQuadCoeffs(dst) {
  const x0 = dst.tl.x, y0 = dst.tl.y, x1 = dst.tr.x, y1 = dst.tr.y,
        x2 = dst.br.x, y2 = dst.br.y, x3 = dst.bl.x, y3 = dst.bl.y;
  const dx1 = x1 - x2, dx2 = x3 - x2, dx3 = x0 - x1 + x2 - x3;
  const dy1 = y1 - y2, dy2 = y3 - y2, dy3 = y0 - y1 + y2 - y3;
  let a13 = 0, a23 = 0;
  const den = dx1 * dy2 - dx2 * dy1;
  if (Math.abs(dx3) > 1e-9 || Math.abs(dy3) > 1e-9) {
    a13 = (dx3 * dy2 - dx2 * dy3) / den;
    a23 = (dx1 * dy3 - dx3 * dy1) / den;
  }
  return {
    a11: x1 - x0 + a13 * x1,
    a21: x3 - x0 + a23 * x3,
    a31: x0,
    a12: y1 - y0 + a13 * y1,
    a22: y3 - y0 + a23 * y3,
    a32: y0,
    a13, a23,
  };
}

function mapUnitToQuad(c, u, v) {
  const denom = c.a13 * u + c.a23 * v + 1;
  return {
    x: (c.a11 * u + c.a21 * v + c.a31) / denom,
    y: (c.a12 * u + c.a22 * v + c.a32) / denom,
  };
}

function warpImageToQuad(ctx, img, dstCorners, gridSize) {
  const coeffs = computeQuadCoeffs(dstCorners);
  const W = img.naturalWidth || img.width, H = img.naturalHeight || img.height;
  const n = gridSize;
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      const u0 = i / n, u1 = (i + 1) / n, v0 = j / n, v1 = (j + 1) / n;
      const p00 = mapUnitToQuad(coeffs, u0, v0);
      const p10 = mapUnitToQuad(coeffs, u1, v0);
      const p01 = mapUnitToQuad(coeffs, u0, v1);
      const sx = u0 * W, sy = v0 * H, sw = (u1 - u0) * W, sh = (v1 - v0) * H;
      if (sw <= 0 || sh <= 0) continue;
      const exx = (p10.x - p00.x) / sw, exy = (p10.y - p00.y) / sw;
      const eyx = (p01.x - p00.x) / sh, eyy = (p01.y - p00.y) / sh;
      ctx.save();
      ctx.translate(p00.x, p00.y);
      ctx.transform(exx, exy, eyx, eyy, 0, 0);
      ctx.drawImage(img, sx, sy, sw, sh, -0.5, -0.5, sw + 1, sh + 1);
      ctx.restore();
    }
  }
}

function quadPath(ctx, corners) {
  ctx.beginPath();
  ctx.moveTo(corners.tl.x, corners.tl.y);
  ctx.lineTo(corners.tr.x, corners.tr.y);
  ctx.lineTo(corners.br.x, corners.br.y);
  ctx.lineTo(corners.bl.x, corners.bl.y);
  ctx.closePath();
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
// Mockup photo slots (corner-pin editor)
// =========================================================================
function defaultCorners() {
  return {
    tl: { u: 0.22, v: 0.16 },
    tr: { u: 0.78, v: 0.16 },
    br: { u: 0.78, v: 0.80 },
    bl: { u: 0.22, v: 0.80 },
  };
}

const mockupSlots = {
  laptop: { img: null, corners: defaultCorners() },
  phone: { img: null, corners: defaultCorners() },
  custom: { img: null, corners: defaultCorners() },
};

const HANDLE_ORDER = ['tl', 'tr', 'br', 'bl'];

function getCanvasPos(evt, canvas) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  return {
    x: (evt.clientX - rect.left) * scaleX,
    y: (evt.clientY - rect.top) * scaleY,
  };
}

function redrawPinCanvas(kind) {
  const slot = mockupSlots[kind];
  const canvas = document.getElementById(`pinCanvas_${kind}`);
  if (!canvas || !slot.img) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = '#eee';
  ctx.fillRect(0, 0, W, H);

  const rect = containRect(W, H, slot.img.naturalWidth, slot.img.naturalHeight);
  ctx.drawImage(slot.img, 0, 0, slot.img.naturalWidth, slot.img.naturalHeight, rect.x, rect.y, rect.w, rect.h);

  const dstCorners = {};
  HANDLE_ORDER.forEach(k => {
    dstCorners[k] = { x: rect.x + slot.corners[k].u * rect.w, y: rect.y + slot.corners[k].v * rect.h };
  });

  const design = getDesignImage();
  if (design) {
    ctx.save();
    quadPath(ctx, dstCorners);
    ctx.clip();
    warpImageToQuad(ctx, design, dstCorners, 10);
    ctx.restore();
  }

  ctx.save();
  quadPath(ctx, dstCorners);
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.strokeStyle = '#c96b4f';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.restore();

  HANDLE_ORDER.forEach(k => {
    const p = dstCorners[k];
    ctx.beginPath();
    ctx.arc(p.x, p.y, 12, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#c96b4f';
    ctx.stroke();
  });
}

function redrawAllPinCanvases() {
  Object.keys(mockupSlots).forEach(kind => {
    if (mockupSlots[kind].img) redrawPinCanvas(kind);
  });
}

function setupMockupSlot(kind) {
  const fileInput = document.querySelector(`.mockup-upload[data-kind="${kind}"]`);
  const wrap = document.getElementById(`pinWrap_${kind}`);
  const canvas = document.getElementById(`pinCanvas_${kind}`);
  const resetBtn = document.querySelector(`.reset-pin-btn[data-kind="${kind}"]`);

  fileInput.addEventListener('change', () => {
    const file = fileInput.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        mockupSlots[kind].img = img;
        mockupSlots[kind].corners = defaultCorners();
        wrap.hidden = false;
        redrawPinCanvas(kind);
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });

  resetBtn.addEventListener('click', () => {
    mockupSlots[kind].corners = defaultCorners();
    redrawPinCanvas(kind);
  });

  let dragging = null;

  canvas.addEventListener('pointerdown', evt => {
    const slot = mockupSlots[kind];
    if (!slot.img) return;
    const pos = getCanvasPos(evt, canvas);
    const rect = containRect(canvas.width, canvas.height, slot.img.naturalWidth, slot.img.naturalHeight);
    let closest = null, closestDist = Infinity;
    HANDLE_ORDER.forEach(k => {
      const p = { x: rect.x + slot.corners[k].u * rect.w, y: rect.y + slot.corners[k].v * rect.h };
      const d = Math.hypot(p.x - pos.x, p.y - pos.y);
      if (d < closestDist) { closestDist = d; closest = k; }
    });
    if (closestDist < 40) {
      dragging = closest;
      canvas.setPointerCapture(evt.pointerId);
    }
  });

  canvas.addEventListener('pointermove', evt => {
    if (!dragging) return;
    const slot = mockupSlots[kind];
    const pos = getCanvasPos(evt, canvas);
    const rect = containRect(canvas.width, canvas.height, slot.img.naturalWidth, slot.img.naturalHeight);
    const u = Math.max(0, Math.min(1, (pos.x - rect.x) / rect.w));
    const v = Math.max(0, Math.min(1, (pos.y - rect.y) / rect.h));
    slot.corners[dragging] = { u, v };
    redrawPinCanvas(kind);
  });

  function endDrag(evt) {
    if (dragging) {
      try { canvas.releasePointerCapture(evt.pointerId); } catch (e) { /* ignore */ }
    }
    dragging = null;
  }
  canvas.addEventListener('pointerup', endDrag);
  canvas.addEventListener('pointercancel', endDrag);
}

setupMockupSlot('laptop');
setupMockupSlot('phone');
setupMockupSlot('custom');

// =========================================================================
// Template generators
// =========================================================================
function getBrand() {
  return {
    companyName: els.companyName.value.trim() || 'Your Shop',
    logoImgSrc: els.logoPreview.dataset.logo || null,
    primaryColor: els.primaryColor.value,
    accentColor: els.accentColor.value,
    textColorOverride: els.textColorAuto.checked ? null : els.textColor.value,
    font: els.fontChoice.value,
  };
}

// If the user has set a custom text color, it wins; otherwise fall back to
// whatever auto-contrast color the template would normally pick.
function textColorFor(brand, autoColor) {
  return brand.textColorOverride || autoColor;
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

function drawHero(ctx, brand, product, images, logoImg) {
  ctx.fillStyle = brand.accentColor;
  ctx.fillRect(0, 0, SIZE, SIZE);

  if (images[0]) {
    drawCover(ctx, 0, 0, SIZE, SIZE, images[0].img);
    const grad = ctx.createLinearGradient(0, SIZE * 0.45, 0, SIZE);
    grad.addColorStop(0, 'rgba(0,0,0,0)');
    grad.addColorStop(1, 'rgba(0,0,0,0.72)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, SIZE, SIZE);
  } else {
    ctx.fillStyle = brand.primaryColor;
    roundRect(ctx, SIZE * 0.15, SIZE * 0.3, SIZE * 0.7, SIZE * 0.4, 40);
    ctx.globalAlpha = 0.15;
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  const textColor = textColorFor(brand, images[0] ? '#ffffff' : contrastText(brand.accentColor));

  if (logoImg) {
    const lw = 200, lh = 200 * (logoImg.height / logoImg.width);
    ctx.drawImage(logoImg, 70, 70, lw, Math.min(lh, 200));
  }

  if (product.badges[0]) {
    ctx.font = `700 34px "${brand.font}"`;
    const text = product.badges[0].toUpperCase();
    const padX = 28;
    const tw = ctx.measureText(text).width;
    ctx.fillStyle = brand.primaryColor;
    roundRect(ctx, SIZE - tw - padX * 2 - 70, 80, tw + padX * 2, 70, 35);
    ctx.fill();
    ctx.fillStyle = contrastText(brand.primaryColor);
    ctx.textAlign = 'left';
    ctx.fillText(text, SIZE - tw - padX - 70, 125);
  }

  const titleFontSize = 130, titleY = SIZE - 260;
  const gradeSubject = [product.gradeLevel, product.subject].filter(Boolean).join('  •  ');
  if (gradeSubject) {
    ctx.font = `600 36px "${brand.font}"`;
    const padX = 26, pillH = 62;
    // Keep clear of the title's ascenders above its baseline, plus a gap.
    const pillY = titleY - titleFontSize * 0.78 - 30 - pillH;
    const tw = ctx.measureText(gradeSubject).width;
    ctx.fillStyle = brand.primaryColor;
    roundRect(ctx, 90, pillY, tw + padX * 2, pillH, pillH / 2);
    ctx.fill();
    ctx.fillStyle = contrastText(brand.primaryColor);
    ctx.textAlign = 'left';
    ctx.fillText(gradeSubject, 90 + padX, pillY + pillH / 2 + 13);
  }

  ctx.fillStyle = textColor;
  ctx.font = `700 ${titleFontSize}px "${brand.font}"`;
  ctx.textAlign = 'left';
  const nameBottom = wrapText(ctx, product.name, 90, titleY, SIZE - 180, 140, 'left');

  if (product.tagline) {
    ctx.font = `500 52px "${brand.font}"`;
    ctx.fillStyle = textColor;
    ctx.globalAlpha = 0.92;
    wrapText(ctx, product.tagline, 90, nameBottom + 20, SIZE - 180, 64, 'left');
    ctx.globalAlpha = 1;
  }

  ctx.font = `600 40px "${brand.font}"`;
  ctx.fillStyle = images[0] ? '#ffffff' : brand.primaryColor;
  ctx.textAlign = 'left';
  ctx.fillText(brand.companyName, 90, SIZE - 60);
}

function drawIllustratedMockup(ctx, brand, product, images, kind, watermark) {
  ctx.fillStyle = brand.accentColor;
  ctx.fillRect(0, 0, SIZE, SIZE);

  const img = images[1] ? images[1].img : (images[0] ? images[0].img : null);
  let deviceBottom;
  let screenRect;

  if (kind === 'laptop') {
    const bodyW = SIZE * 0.78, bodyX = (SIZE - bodyW) / 2;
    const screenY = SIZE * 0.16, screenH = SIZE * 0.52;
    const bezel = 26;

    ctx.fillStyle = '#20201f';
    roundRect(ctx, bodyX, screenY, bodyW, screenH, 28);
    ctx.fill();

    const scrX = bodyX + bezel, scrY = screenY + bezel, scrW = bodyW - bezel * 2, scrH = screenH - bezel * 2;
    if (img) {
      ctx.save();
      roundRect(ctx, scrX, scrY, scrW, scrH, 6);
      ctx.clip();
      drawCover(ctx, scrX, scrY, scrW, scrH, img);
      ctx.restore();
    } else {
      ctx.fillStyle = brand.primaryColor;
      ctx.fillRect(scrX, scrY, scrW, scrH);
    }
    screenRect = { x: scrX, y: scrY, w: scrW, h: scrH, radius: 6 };

    const baseY = screenY + screenH;
    ctx.fillStyle = '#3a3a38';
    ctx.beginPath();
    ctx.moveTo(bodyX - 40, baseY + 50);
    ctx.lineTo(bodyX + bodyW + 40, baseY + 50);
    ctx.lineTo(bodyX + bodyW + 10, baseY);
    ctx.lineTo(bodyX - 10, baseY);
    ctx.closePath();
    ctx.fill();
    deviceBottom = baseY + 50;
  } else {
    const bodyW = SIZE * 0.34, bodyH = SIZE * 0.56;
    const bodyX = (SIZE - bodyW) / 2, bodyY = SIZE * 0.09;
    const bezel = 22;

    ctx.fillStyle = '#20201f';
    roundRect(ctx, bodyX, bodyY, bodyW, bodyH, 70);
    ctx.fill();

    const scrX = bodyX + bezel, scrY = bodyY + bezel, scrW = bodyW - bezel * 2, scrH = bodyH - bezel * 2;
    if (img) {
      ctx.save();
      roundRect(ctx, scrX, scrY, scrW, scrH, 40);
      ctx.clip();
      drawCover(ctx, scrX, scrY, scrW, scrH, img);
      ctx.restore();
    } else {
      ctx.fillStyle = brand.primaryColor;
      roundRect(ctx, scrX, scrY, scrW, scrH, 40);
      ctx.fill();
    }
    screenRect = { x: scrX, y: scrY, w: scrW, h: scrH, radius: 40 };

    ctx.fillStyle = '#111';
    roundRect(ctx, bodyX + bodyW / 2 - 60, bodyY + 14, 120, 16, 8);
    ctx.fill();
    deviceBottom = bodyY + bodyH;
  }

  if (watermark) {
    ctx.save();
    roundRect(ctx, screenRect.x, screenRect.y, screenRect.w, screenRect.h, screenRect.radius);
    ctx.clip();
    drawWatermark(ctx, watermark.text, watermark, screenRect);
    ctx.restore();
  }

  const textColor = textColorFor(brand, contrastText(brand.accentColor));
  const textTop = deviceBottom + (SIZE - 130 - deviceBottom) / 2 - 20;
  ctx.fillStyle = textColor;
  ctx.font = `700 74px "${brand.font}"`;
  ctx.textAlign = 'center';
  wrapText(ctx, product.name, SIZE / 2, textTop, SIZE * 0.8, 84, 'center');

  ctx.font = `600 34px "${brand.font}"`;
  ctx.fillStyle = brand.primaryColor;
  ctx.textAlign = 'center';
  ctx.fillText(brand.companyName, SIZE / 2, SIZE - 70);
}

function drawPhotoMockup(ctx, brand, slot, designImg, watermark) {
  ctx.fillStyle = brand.accentColor;
  ctx.fillRect(0, 0, SIZE, SIZE);

  const rect = containRect(SIZE, SIZE, slot.img.naturalWidth, slot.img.naturalHeight);
  ctx.drawImage(slot.img, 0, 0, slot.img.naturalWidth, slot.img.naturalHeight, rect.x, rect.y, rect.w, rect.h);

  const dstCorners = {};
  HANDLE_ORDER.forEach(k => {
    dstCorners[k] = { x: rect.x + slot.corners[k].u * rect.w, y: rect.y + slot.corners[k].v * rect.h };
  });

  if (designImg) {
    ctx.save();
    quadPath(ctx, dstCorners);
    ctx.clip();
    warpImageToQuad(ctx, designImg, dstCorners, 24);
    ctx.restore();
  } else {
    ctx.save();
    quadPath(ctx, dstCorners);
    ctx.fillStyle = brand.primaryColor;
    ctx.globalAlpha = 0.25;
    ctx.fill();
    ctx.restore();
  }

  if (watermark) {
    const xs = HANDLE_ORDER.map(k => dstCorners[k].x);
    const ys = HANDLE_ORDER.map(k => dstCorners[k].y);
    const bounds = {
      x: Math.min(...xs), y: Math.min(...ys),
      w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys),
    };
    ctx.save();
    quadPath(ctx, dstCorners);
    ctx.clip();
    drawWatermark(ctx, watermark.text, watermark, bounds);
    ctx.restore();
  }
}

function drawMultiPageGrid(ctx, brand, product, images) {
  ctx.fillStyle = brand.accentColor;
  ctx.fillRect(0, 0, SIZE, SIZE);
  const textColor = textColorFor(brand, contrastText(brand.accentColor));

  ctx.fillStyle = brand.primaryColor;
  ctx.font = `700 40px "${brand.font}"`;
  ctx.textAlign = 'center';
  ctx.fillText(brand.companyName.toUpperCase(), SIZE / 2, 110);

  ctx.fillStyle = textColor;
  ctx.font = `700 78px "${brand.font}"`;
  ctx.fillText(`See All ${images.length} Pages`, SIZE / 2, 210);

  const margin = 90, gap = 26;
  const gridTop = 270, gridBottom = SIZE - 70;
  const n = images.length;
  const cols = Math.max(1, Math.ceil(Math.sqrt(n)));
  const rows = Math.ceil(n / cols);
  const cellW = (SIZE - margin * 2 - (cols - 1) * gap) / cols;
  const cellH = (gridBottom - gridTop - (rows - 1) * gap) / rows;
  const badgeR = Math.max(12, Math.min(22, Math.min(cellW, cellH) * 0.15));

  images.forEach((item, i) => {
    const col = i % cols, row = Math.floor(i / cols);
    const x = margin + col * (cellW + gap);
    const y = gridTop + row * (cellH + gap);

    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.18)';
    ctx.shadowBlur = 24;
    ctx.shadowOffsetY = 10;
    ctx.fillStyle = '#ffffff';
    roundRect(ctx, x, y, cellW, cellH, 14);
    ctx.fill();
    ctx.restore();

    const pad = Math.min(14, Math.min(cellW, cellH) * 0.08);
    const innerX = x + pad, innerY = y + pad, innerW = cellW - pad * 2, innerH = cellH - pad * 2;
    ctx.save();
    roundRect(ctx, x, y, cellW, cellH, 14);
    ctx.clip();
    const img = item.img;
    const scale = Math.min(innerW / img.width, innerH / img.height);
    const dw = img.width * scale, dh = img.height * scale;
    const dx = innerX + (innerW - dw) / 2, dy = innerY + (innerH - dh) / 2;
    ctx.drawImage(img, dx, dy, dw, dh);
    ctx.restore();

    ctx.fillStyle = brand.primaryColor;
    ctx.beginPath();
    ctx.arc(x + badgeR + 8, y + badgeR + 8, badgeR, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = contrastText(brand.primaryColor);
    ctx.font = `700 ${Math.round(badgeR * 1.1)}px "${brand.font}"`;
    ctx.textAlign = 'center';
    ctx.fillText(String(i + 1), x + badgeR + 8, y + badgeR + 8 + badgeR * 0.35);
  });
}

function drawIncluded(ctx, brand, product) {
  ctx.fillStyle = brand.accentColor;
  ctx.fillRect(0, 0, SIZE, SIZE);
  const textColor = textColorFor(brand, contrastText(brand.accentColor));

  ctx.fillStyle = brand.primaryColor;
  ctx.font = `700 46px "${brand.font}"`;
  ctx.textAlign = 'center';
  ctx.fillText(brand.companyName.toUpperCase(), SIZE / 2, 160);

  ctx.fillStyle = textColor;
  ctx.font = `700 90px "${brand.font}"`;
  ctx.textAlign = 'center';
  ctx.fillText("What's Included", SIZE / 2, 300);

  const items = product.bullets.length ? product.bullets : ['Add items in the "What\'s Included" field'];
  const startY = 460;
  const lineGap = Math.min(150, (SIZE - startY - 200) / items.length);
  const boxX = SIZE * 0.14, boxW = SIZE * 0.72;

  items.slice(0, 10).forEach((item, i) => {
    const y = startY + i * lineGap;
    ctx.fillStyle = brand.primaryColor;
    ctx.beginPath();
    ctx.arc(boxX + 30, y, 30, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = contrastText(brand.primaryColor);
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(boxX + 16, y);
    ctx.lineTo(boxX + 26, y + 12);
    ctx.lineTo(boxX + 46, y - 14);
    ctx.stroke();

    ctx.fillStyle = textColor;
    ctx.font = `500 46px "${brand.font}"`;
    ctx.textAlign = 'left';
    ctx.fillText(item, boxX + 80, y + 15, boxW - 80);
  });
}

const DEFAULT_HOW_IT_WORKS_STEPS = [
  'Purchase & instant download',
  'Open your files',
  'Edit or print',
  'Enjoy!',
];

function drawHowItWorks(ctx, brand, product) {
  ctx.fillStyle = brand.accentColor;
  ctx.fillRect(0, 0, SIZE, SIZE);
  const textColor = textColorFor(brand, contrastText(brand.accentColor));

  ctx.fillStyle = brand.primaryColor;
  ctx.font = `700 46px "${brand.font}"`;
  ctx.textAlign = 'center';
  ctx.fillText(brand.companyName.toUpperCase(), SIZE / 2, 160);

  ctx.fillStyle = textColor;
  ctx.font = `700 90px "${brand.font}"`;
  ctx.textAlign = 'center';
  ctx.fillText('How It Works', SIZE / 2, 300);

  const steps = (product.howItWorks.length ? product.howItWorks : DEFAULT_HOW_IT_WORKS_STEPS).slice(0, 6);
  const top = 440, bottom = SIZE - 150;
  const n = steps.length;
  const rowH = (bottom - top) / n;
  const circleR = 60, circleX = SIZE * 0.18;
  const textX = circleX + circleR + 60;
  const textMaxW = SIZE - textX - 110;

  steps.forEach((step, i) => {
    const cy = top + rowH * i + rowH / 2;

    if (i < n - 1) {
      ctx.strokeStyle = brand.primaryColor;
      ctx.globalAlpha = 0.35;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(circleX, cy + circleR);
      ctx.lineTo(circleX, cy + rowH - circleR);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    ctx.fillStyle = brand.primaryColor;
    ctx.beginPath();
    ctx.arc(circleX, cy, circleR, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = contrastText(brand.primaryColor);
    ctx.font = `700 56px "${brand.font}"`;
    ctx.textAlign = 'center';
    ctx.fillText(String(i + 1), circleX, cy + 20);

    ctx.fillStyle = textColor;
    ctx.font = `600 50px "${brand.font}"`;
    ctx.textAlign = 'left';
    wrapText(ctx, step, textX, cy + 18, textMaxW, 56, 'left');
  });
}

function drawBadges(ctx, brand, product) {
  ctx.fillStyle = brand.primaryColor;
  ctx.fillRect(0, 0, SIZE, SIZE);
  const textColor = textColorFor(brand, contrastText(brand.primaryColor));

  ctx.fillStyle = textColor;
  ctx.font = `700 60px "${brand.font}"`;
  ctx.textAlign = 'center';
  ctx.globalAlpha = 0.85;
  ctx.fillText(brand.companyName, SIZE / 2, 160);
  ctx.globalAlpha = 1;

  ctx.font = `700 92px "${brand.font}"`;
  wrapText(ctx, product.name, SIZE / 2, 330, SIZE * 0.8, 100, 'center');

  const badges = product.badges.length ? product.badges : ['Instant Download'];
  ctx.font = `600 42px "${brand.font}"`;
  const padX = 44, padY = 26, gapX = 30, gapY = 30;
  const rows = [];
  let row = [], rowW = 0;
  const maxRowW = SIZE * 0.8;
  badges.forEach(b => {
    const w = ctx.measureText(b).width + padX * 2;
    if (rowW + w + gapX > maxRowW && row.length) {
      rows.push({ row, rowW: rowW - gapX });
      row = []; rowW = 0;
    }
    row.push({ text: b, w });
    rowW += w + gapX;
  });
  if (row.length) rows.push({ row, rowW: rowW - gapX });

  const chipH = 100;
  let y = SIZE * 0.52;
  rows.forEach(({ row, rowW }) => {
    let x = (SIZE - rowW) / 2;
    row.forEach(({ text, w }) => {
      ctx.fillStyle = '#ffffff';
      roundRect(ctx, x, y, w, chipH, chipH / 2);
      ctx.fill();
      ctx.fillStyle = brand.primaryColor;
      ctx.textAlign = 'center';
      ctx.fillText(text, x + w / 2, y + chipH / 2 + 15);
      x += w + gapX;
    });
    y += chipH + gapY;
  });
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
function loadImageFromSrc(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

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
  els.downloadAllBtn.disabled = true;
  setStatus('Generating images…');
  els.gallery.innerHTML = '';
  generatedCanvases = [];
  els.emptyState.style.display = 'none';

  const brand = getBrand();
  const product = getProduct();
  await ensureFont(brand.font);

  let logoImg = null;
  if (brand.logoImgSrc) {
    try { logoImg = await loadImageFromSrc(brand.logoImgSrc); } catch (e) { /* ignore */ }
  }

  const designImg = getDesignImage();

  const watermark = getWatermarkConfig(brand);
  const watermarkFor = (key) => (watermark.enabled && watermark.targets.has(key)) ? watermark : null;

  // Candidate templates, in upload order. Some only appear when there's data
  // for them (a custom mockup photo, or enough pages for a preview grid) —
  // numbering below is assigned after filtering, so the sequence stays clean.
  const candidates = [
    { label: 'Hero Cover', key: 'hero', include: true, fn: (ctx) => drawHero(ctx, brand, product, uploadedImages, logoImg) },
    {
      label: 'Laptop Mockup',
      key: 'laptop',
      include: true,
      fn: (ctx) => mockupSlots.laptop.img
        ? drawPhotoMockup(ctx, brand, mockupSlots.laptop, designImg, watermarkFor('laptop'))
        : drawIllustratedMockup(ctx, brand, product, uploadedImages, 'laptop', watermarkFor('laptop')),
    },
    {
      label: 'Phone Mockup',
      key: 'phone',
      include: true,
      fn: (ctx) => mockupSlots.phone.img
        ? drawPhotoMockup(ctx, brand, mockupSlots.phone, designImg, watermarkFor('phone'))
        : drawIllustratedMockup(ctx, brand, product, uploadedImages, 'phone', watermarkFor('phone')),
    },
    {
      label: 'Custom Mockup',
      key: 'custom',
      include: !!mockupSlots.custom.img,
      fn: (ctx) => drawPhotoMockup(ctx, brand, mockupSlots.custom, designImg, watermarkFor('custom')),
    },
    {
      label: 'Multi-Page Preview',
      key: 'pages',
      include: uploadedImages.length >= 2,
      fn: (ctx) => drawMultiPageGrid(ctx, brand, product, uploadedImages),
    },
    { label: "What's Included", key: 'included', include: true, fn: (ctx) => drawIncluded(ctx, brand, product) },
    { label: 'How It Works', key: 'steps', include: true, fn: (ctx) => drawHowItWorks(ctx, brand, product) },
    { label: 'Feature Badges', key: 'badges', include: true, fn: (ctx) => drawBadges(ctx, brand, product) },
  ];

  const templates = candidates.filter(t => t.include).map((t, i) => ({
    ...t,
    name: `${String(i + 1).padStart(2, '0')} ${t.label}`,
  }));

  // Laptop/phone/custom mockups draw their own watermark internally, clipped
  // to the screen/display area — applying it again here would double it up
  // across the whole canvas. The multi-page grid has no such area, so it
  // gets the full-canvas treatment like the other flat graphics.
  const fullCanvasWatermarkKeys = new Set(['hero', 'included', 'steps', 'badges', 'pages']);

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
