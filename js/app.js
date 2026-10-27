// ============================================================================
// SOVR Musik — application logic
// Local-first, single-page music dashboard for The Sovereign Stack (Tunee catalog)
// ============================================================================

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

const audioEl = $('#audioEl');
const videoEl = $('#videoEl');

// ---------------------------------------------------------------------------
// App state
// ---------------------------------------------------------------------------
const state = {
  tracks: [],
  addedCounter: 0,
  filtered: [],
  activeId: null,
  queue: [],
  shuffle: false,
  repeat: 'off', // off | one | all
  userInteracted: false,
  gridCols: Number(localStorage.getItem('sovr.gridCols') || 6),
  ambience: localStorage.getItem('sovr.ambience') || 'reactive', // reactive | calm
  volume: Number(localStorage.getItem('sovr.volume') || 85),

  viz: {
    enabled: true,
    mode: localStorage.getItem('sovr.vizMode') || 'wave', // wave | bars
    ctx: null,
    analyser: null,
    source: null,
    raf: null,
    data: null,
    freq: null,
    corsLikelyBlocked: false,
  }
};

// ---------------------------------------------------------------------------
// DOM element refs
// ---------------------------------------------------------------------------
const els = {
  grid: $('#grid'),
  emptyState: $('#emptyState'),
  searchInput: $('#searchInput'),
  clearSearchBtn: $('#clearSearchBtn'),
  typeFilter: $('#typeFilter'),
  tagFilter: $('#tagFilter'),
  sortSelect: $('#sortSelect'),
  statsPill: $('#statsPill'),
  corsPill: $('#corsPill'),

  nowCover: $('#nowCover'),
  nowTitle: $('#nowTitle'),
  nowArtist: $('#nowArtist'),
  nowBadge: $('#nowBadge'),
  nowMeta: $('#nowMeta'),
  playBtn: $('#playBtn'),
  playIcon: $('#playIcon'),
  prevBtn: $('#prevBtn'),
  nextBtn: $('#nextBtn'),
  shuffleBtn: $('#shuffleBtn'),
  repeatBtn: $('#repeatBtn'),
  downloadBtn: $('#downloadBtn'),
  openVideoBtn: $('#openVideoBtn'),

  seek: $('#seek'),
  curTime: $('#curTime'),
  durTime: $('#durTime'),
  volume: $('#volume'),

  viz: $('#viz'),
  vizOnBtn: $('#vizOnBtn'),
  vizModeBtn: $('#vizModeBtn'),

  shuffleState: $('#shuffleState'),
  repeatState: $('#repeatState'),
  queueCount: $('#queueCount'),
  copyNowBtn: $('#copyNowBtn'),

  videoPanel: $('#videoPanel'),
  videoMount: $('#videoMount'),
  hideVideoBtn: $('#hideVideoBtn'),
  pipBtn: $('#pipBtn'),

  uploadBtn: $('#uploadBtn'),
  filePicker: $('#filePicker'),
  exportBtn: $('#exportBtn'),
  importBtn: $('#importBtn'),
  importPicker: $('#importPicker'),
  resetBtn: $('#resetBtn'),
  themeBtn: $('#themeBtn'),

  gridMinus: $('#gridMinus'),
  gridPlus: $('#gridPlus'),

  queueBtn: $('#queueBtn'),
  queueDrawer: $('#queueDrawer'),
  closeQueueBtn: $('#closeQueueBtn'),
  clearQueueBtn: $('#clearQueueBtn'),
  addFilteredToQueueBtn: $('#addFilteredToQueueBtn'),
  queueList: $('#queueList'),

  helpBtn: $('#helpBtn'),
  helpModal: $('#helpModal'),
  helpCloseBtn: $('#helpCloseBtn'),

  toastRoot: $('#toastRoot'),
  dropzone: $('#dropzone'),
};

// ---------------------------------------------------------------------------
// Seed catalog (fallback only — used if tracks.json can't be fetched)
// ---------------------------------------------------------------------------
const seedTracks = [
  {
    title: 'Shadow Elegy',
    artist: 'Tunee • Sovereign Lab',
    src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    type: 'audio',
    tags: ['ambient', 'cinematic', 'dark'],
    album: 'Elegance in the Shadows',
    year: 2025,
    coverHint: 'bronze',
  },
  {
    title: 'Midnight Protocol',
    artist: 'Tunee • Stackwave',
    src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    type: 'audio',
    tags: ['synth', 'cyber', 'focus'],
    album: 'SOVR Sessions',
    year: 2025,
    coverHint: 'slate',
  },
  {
    title: 'Neon Treaty',
    artist: 'Tunee • Parallax',
    src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
    type: 'audio',
    tags: ['electro', 'uplift', 'night'],
    album: 'Sovereign Skyline',
    year: 2025,
    coverHint: 'mix',
  },
  {
    title: 'SOVR Signal (Video)',
    artist: 'Tunee • Visual Unit',
    src: 'https://www.w3schools.com/html/mov_bbb.mp4',
    type: 'video',
    tags: ['video', 'demo'],
    album: 'Motion Studies',
    year: 2025,
    coverHint: 'video',
  },
  {
    title: 'Noir Circuit',
    artist: 'Tunee • HexaNova',
    src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
    type: 'audio',
    tags: ['dark', 'beats', 'drive'],
    album: 'Blackglass',
    year: 2025,
    coverHint: 'brick',
  },
  {
    title: 'Quiet Sovereignty',
    artist: 'Tunee • Atlas',
    src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3',
    type: 'audio',
    tags: ['calm', 'study', 'ambient'],
    album: 'Lowlight',
    year: 2025,
    coverHint: 'calm',
  },
];

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------
const uid = () => crypto.getRandomValues(new Uint32Array(4)).join('-');

function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }

function fmtTime(sec) {
  if (!isFinite(sec) || sec < 0) return '0:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

function safeText(s) {
  return String(s ?? '').replace(/\s+/g, ' ').trim();
}

function toast(msg, type = 'info', timeout = 2800) {
      const colors = {
        info: 'border-white/10 bg-white/5',
        ok: 'toast-ok',
        warn: 'toast-warn',
        bad: 'toast-bad',
      };
  const el = document.createElement('div');
  el.className = `glass ${colors[type] ?? colors.info} rounded-2xl px-4 py-3 text-sm shadow-lg max-w-sm toast-enter`;
  el.innerHTML = `<div class="flex items-start gap-3"><div class="mt-0.5 text-white/70"><i class="fas ${type === 'ok' ? 'fa-check-circle' : type === 'warn' ? 'fa-exclamation-triangle' : type === 'bad' ? 'fa-times-circle' : 'fa-info-circle'}"></i></div><div class="text-white/85">${msg}</div></div>`;
  els.toastRoot.appendChild(el);
  setTimeout(() => {
    el.style.transition = 'opacity 200ms ease, transform 200ms ease';
    el.style.opacity = '0';
    el.style.transform = 'translateY(-6px)';
    setTimeout(() => el.remove(), 220);
  }, timeout);
}

function trackToSearchBlob(t) {
  const tags = Array.isArray(t.tags) ? t.tags.join(' ') : '';
  return `${t.title} ${t.artist} ${t.album ?? ''} ${tags}`.toLowerCase();
}

function computeCoverStyle(t) {
  // gradient fallback used when cover art fails / is missing
  const hint = t.coverHint || 'mix';
  const map = {
    bronze: ['rgba(184,134,11,.6)', 'rgba(74,85,104,.25)'],
    slate: ['rgba(74,85,104,.55)', 'rgba(184,134,11,.20)'],
    brick: ['rgba(156,43,43,.55)', 'rgba(184,134,11,.20)'],
    calm: ['rgba(47,133,90,.45)', 'rgba(74,85,104,.15)'],
    video: ['rgba(184,134,11,.45)', 'rgba(74,85,104,.15)'],
    mix: ['rgba(184,134,11,.5)', 'rgba(74,85,104,.20)'],
  };
  const [a, b] = map[hint] ?? map.mix;
  return `background: radial-gradient(120px 120px at 25% 30%, ${a}, transparent 60%), radial-gradient(140px 120px at 70% 70%, ${b}, transparent 60%), linear-gradient(180deg, rgba(255,255,255,.06), rgba(255,255,255,.02));`;
}

function updateGridCols() {
  const cols = clamp(state.gridCols, 4, 8);
  state.gridCols = cols;
  localStorage.setItem('sovr.gridCols', String(cols));

  const w = window.innerWidth;
  let c = cols;
  if (w < 640) c = Math.min(2, cols);
  else if (w < 768) c = Math.min(3, cols);
  else if (w < 1024) c = Math.min(4, cols);
  else if (w < 1280) c = Math.min(6, cols);
  else c = cols;
  els.grid.style.gridTemplateColumns = `repeat(${c}, minmax(0, 1fr))`;
}

function applyResponsiveGrid() {
  const w = window.innerWidth;
  let c = state.gridCols;
  if (w < 640) c = Math.min(2, state.gridCols);
  else if (w < 768) c = Math.min(3, state.gridCols);
  else if (w < 1024) c = Math.min(4, state.gridCols);
  else if (w < 1280) c = Math.min(6, state.gridCols);
  else c = state.gridCols;
  els.grid.style.gridTemplateColumns = `repeat(${c}, minmax(0, 1fr))`;
}

// ---------------------------------------------------------------------------
// Track normalization
// ---------------------------------------------------------------------------
function normalizeTrack(t, origin = 'remote') {
  const nt = {
    id: t.id || uid(),
    title: safeText(t.title || 'Untitled'),
    artist: safeText(t.artist || 'Unknown Artist'),
    album: safeText(t.album || ''),
    year: Number.isFinite(t.year) ? t.year : undefined,
    tags: Array.isArray(t.tags) ? t.tags.map(x => safeText(x)).filter(Boolean) : [],
    src: t.src,
    type: (t.type === 'video' || t.type === 'audio') ? t.type : 'audio',
    addedAt: t.addedAt || Date.now() + (state.addedCounter++),
    duration: Number.isFinite(t.duration) ? t.duration : null,
    origin,
    coverHint: t.coverHint || 'mix',
    fileName: safeText(t.fileName || ''),
    mime: safeText(t.mime || ''),
    img: safeText(t.img || ''),
  };
  nt._blob = trackToSearchBlob(nt);
  return nt;
}

// ---------------------------------------------------------------------------
// Filtering & sorting
// ---------------------------------------------------------------------------
function getTagUniverse() {
  const set = new Set();
  for (const t of state.tracks) for (const tg of (t.tags ?? [])) set.add(tg);
  return Array.from(set).sort((a, b) => a.localeCompare(b));
}

function refreshTagFilterOptions() {
  const current = els.tagFilter.value;
  const tags = getTagUniverse();
  els.tagFilter.innerHTML = `<option value="all">All tags</option>` + tags.map(t => `<option value="${encodeURIComponent(t)}">${t}</option>`).join('');
  if ([...els.tagFilter.options].some(o => o.value === current)) els.tagFilter.value = current;
  else els.tagFilter.value = 'all';
}

function applyFilters() {
  const q = els.searchInput.value.trim().toLowerCase();
  const type = els.typeFilter.value;
  const tag = els.tagFilter.value;

  let list = [...state.tracks];

  if (type !== 'all') list = list.filter(t => t.type === type);

  if (tag !== 'all') {
    const decoded = decodeURIComponent(tag);
    list = list.filter(t => (t.tags ?? []).includes(decoded));
  }

  if (q) {
    list = list.filter(t => t._blob.includes(q));
  }

  const s = els.sortSelect.value;
  if (s === 'recent') list.sort((a, b) => b.addedAt - a.addedAt);
  if (s === 'title') list.sort((a, b) => a.title.localeCompare(b.title));
  if (s === 'artist') list.sort((a, b) => a.artist.localeCompare(b.artist));
  if (s === 'duration') list.sort((a, b) => (a.duration ?? 1e9) - (b.duration ?? 1e9));

  state.filtered = list;
  renderGrid();
  updateStats();
}

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------
function renderGrid() {
  const list = state.filtered;
  els.grid.innerHTML = '';

  if (!list.length) {
    els.emptyState.classList.remove('hidden');
    return;
  }
  els.emptyState.classList.add('hidden');

  const activeId = state.activeId;

  for (const t of list) {
    const card = document.createElement('article');
    card.className = 'card rounded-2xl p-3 transition-transform duration-200 cursor-pointer select-none';
    card.dataset.id = t.id;
    if (t.id === activeId) card.setAttribute('data-active', 'true');

    const badge = t.type === 'video'
      ? '<span class="text-[10px] px-2 py-0.5 rounded-full badge-video">VIDEO</span>'
      : '<span class="text-[10px] px-2 py-0.5 rounded-full badge-audio">AUDIO</span>';

    const tags = (t.tags ?? []).slice(0, 3).map(x => `<span class="text-[10px] px-2 py-0.5 rounded-full chip text-white/70">${x}</span>`).join('');

    const dur = Number.isFinite(t.duration) ? fmtTime(t.duration) : '—';

    card.innerHTML = `
      <div class="rounded-2xl overflow-hidden border border-white/10">
        <div class="relative h-28 cover cover-wrap">
          <img class="cover-img" src="${t.img || 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'}" alt="" />
          <div class="cover-fallback" style="${computeCoverStyle(t)}"></div>
          <div class="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent"></div>
          <button class="absolute bottom-3 left-3 w-11 h-11 rounded-2xl bg-white/10 border border-white/15 hover:bg-white/15" data-action="play" title="Play">
            <i class="fas fa-play"></i>
          </button>
          <div class="absolute top-3 right-3">${badge}</div>
        </div>
        <div class="p-3">
          <div class="flex items-start justify-between gap-2">
            <div class="min-w-0">
              <div class="font-semibold text-sm truncate">${t.title}</div>
              <div class="text-xs text-white/60 truncate">${t.artist}</div>
            </div>
            <div class="text-xs text-white/55 mono">${dur}</div>
          </div>
          <div class="mt-2 flex flex-wrap gap-1.5">${tags}</div>

          <div class="mt-3 flex items-center justify-between">
            <button class="text-xs px-2 py-1 rounded-full chip hover:bg-white/10" data-action="queue">
              <i class="fas fa-plus mr-1"></i>Queue
            </button>
            <button class="text-xs px-2 py-1 rounded-full chip hover:bg-white/10" data-action="details">
              <i class="fas fa-ellipsis-h"></i>
            </button>
          </div>
        </div>
      </div>
    `;

    // resolve cover image with fallback
    const imgEl = card.querySelector('.cover-img');
    const fallbackEl = card.querySelector('.cover-fallback');
    if (t.img) {
      imgEl.onload = () => {
        fallbackEl.style.display = 'none';
        imgEl.classList.add('loaded');
      };
      imgEl.onerror = () => {
        imgEl.style.display = 'none';
      };
    } else {
      imgEl.style.display = 'none';
    }

    card.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-action]');
      if (btn) {
        const act = btn.dataset.action;
        if (act === 'play') playById(t.id);
        if (act === 'queue') { queueAdd(t.id); toast(`Added to queue: <span class="text-white">${t.title}</span>`, 'ok'); }
        if (act === 'details') showTrackDetails(t);
        e.stopPropagation();
        return;
      }
      playById(t.id);
    });

    els.grid.appendChild(card);
  }
}

function updateStats() {
  const total = state.tracks.length;
  const shown = state.filtered.length;
  const q = state.queue.length;
  els.queueCount.textContent = String(q);

  const haveDur = state.tracks.filter(t => Number.isFinite(t.duration));
  const sum = haveDur.reduce((acc, t) => acc + (t.duration || 0), 0);
  const sumFmt = isFinite(sum) && sum > 0 ? `${Math.floor(sum / 3600)}h ${Math.floor((sum % 3600) / 60)}m` : '—';

  els.statsPill.textContent = `${shown}/${total} tracks • total time ${sumFmt}`;
}

function showTrackDetails(t) {
  const tags = (t.tags ?? []).join(', ') || '—';
  const srcType = /^blob:/i.test(t.src) ? 'local' : 'remote';
  toast(
    `<div class="space-y-1">
      <div class="text-white font-semibold">${t.title}</div>
      <div class="text-white/70">${t.artist}</div>
      <div class="text-white/60 text-xs">${t.album ? `Album: ${t.album} • ` : ''}${t.year ? `Year: ${t.year} • ` : ''}Type: ${t.type.toUpperCase()} • Source: ${srcType}</div>
      <div class="text-white/60 text-xs">Tags: ${tags}</div>
    </div>`,
    'info',
    4500,
  );
}

// ---------------------------------------------------------------------------
// Queue
// ---------------------------------------------------------------------------
function queueAdd(id) {
  if (!state.queue.includes(id)) state.queue.push(id);
  renderQueue();
  updateStats();
}

function queueClear() {
  state.queue = [];
  renderQueue();
  updateStats();
}

function queueRemove(id) {
  state.queue = state.queue.filter(x => x !== id);
  renderQueue();
  updateStats();
}

function renderQueue() {
  const ids = state.queue;
  const items = ids.map(id => state.tracks.find(t => t.id === id)).filter(Boolean);
  els.queueList.innerHTML = '';

  if (!items.length) {
    const li = document.createElement('li');
    li.className = 'text-sm text-white/60 p-3 rounded-2xl border border-white/10 bg-white/5';
    li.textContent = 'Queue is empty. Add tracks from the grid.';
    els.queueList.appendChild(li);
    return;
  }

  items.forEach((t, idx) => {
    const li = document.createElement('li');
    li.className = 'glass rounded-2xl border border-white/10 p-3 flex items-center justify-between gap-3 cursor-grab';
    li.draggable = true;
    li.dataset.id = t.id;
    li.innerHTML = `
      <div class="flex items-center gap-3 min-w-0">
        <div class="h-10 w-10 rounded-xl border border-white/10" style="${computeCoverStyle(t)}"></div>
        <div class="min-w-0">
          <div class="text-sm font-semibold truncate">${idx === 0 && state.activeId === t.id ? '▶ ' : ''}${t.title}</div>
          <div class="text-xs text-white/60 truncate">${t.artist}</div>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <button class="px-2 py-1 rounded-xl chip hover:bg-white/10" data-action="play" title="Play"><i class="fas fa-play"></i></button>
        <button class="px-2 py-1 rounded-xl chip hover:bg-white/10" data-action="remove" title="Remove"><i class="fas fa-times"></i></button>
      </div>
    `;

    li.addEventListener('dblclick', () => playById(t.id));
    li.addEventListener('click', (e) => {
      const b = e.target.closest('[data-action]');
      if (!b) return;
      const act = b.dataset.action;
      if (act === 'play') playById(t.id);
      if (act === 'remove') queueRemove(t.id);
    });

    li.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData('text/plain', t.id);
      e.dataTransfer.effectAllowed = 'move';
      li.classList.add('drag-ghost');
    });
    li.addEventListener('dragend', () => li.classList.remove('drag-ghost'));
    li.addEventListener('dragover', (e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; });
    li.addEventListener('drop', (e) => {
      e.preventDefault();
      const fromId = e.dataTransfer.getData('text/plain');
      const toId = t.id;
      if (!fromId || fromId === toId) return;
      const fromIdx = state.queue.indexOf(fromId);
      const toIdx = state.queue.indexOf(toId);
      if (fromIdx < 0 || toIdx < 0) return;
      state.queue.splice(toIdx, 0, state.queue.splice(fromIdx, 1)[0]);
      renderQueue();
    });

    els.queueList.appendChild(li);
  });
}

function openQueue(open = true) {
  if (open) els.queueDrawer.classList.remove('translate-x-full');
  else els.queueDrawer.classList.add('translate-x-full');
}

// ---------------------------------------------------------------------------
// Player core
// ---------------------------------------------------------------------------
function getActiveTrack() {
  return state.tracks.find(t => t.id === state.activeId) ?? null;
}

function getMediaElForTrack(t) {
  return t.type === 'video' ? videoEl : audioEl;
}

function stopOtherMedia(active) {
  const other = active === audioEl ? videoEl : audioEl;
  other.pause();
  other.removeAttribute('src');
  try { other.load(); } catch {}
}

function setNowPlayingUI(t) {
  if (!t) {
    els.nowTitle.textContent = 'Not playing';
    els.nowArtist.textContent = '—';
    els.nowMeta.textContent = '';
    els.nowBadge.classList.add('hidden');
    els.openVideoBtn.classList.add('hidden');
    els.nowCover.innerHTML = `<div class="cover-fallback" style="${computeCoverStyle({ coverHint: 'mix' })}"></div>`;
    renderGrid(); // refresh active highlight
    return;
  }

  els.nowBadge.textContent = t.type.toUpperCase();
  els.nowBadge.classList.remove('hidden');
  els.openVideoBtn.classList.toggle('hidden', t.type !== 'video');

  // cover art in the now-playing strip
  if (t.img) {
    els.nowCover.innerHTML = `<img class="cover-img w-full h-full object-cover" src="${t.img}" alt="" />`;
  } else {
    els.nowCover.innerHTML = `<div class="cover-fallback" style="${computeCoverStyle(t)}"></div>`;
  }

  els.nowTitle.textContent = t.title;
  els.nowArtist.textContent = t.artist;

  const parts = [];
  if (t.album) parts.push(t.album);
  if (t.year) parts.push(String(t.year));
  if (Array.isArray(t.tags) && t.tags.length) parts.push(t.tags.slice(0, 3).join(' • '));
  els.nowMeta.textContent = parts.join(' • ');

  renderGrid(); // refresh active highlight
}

function setPlayIcon(isPlaying) {
  els.playIcon.className = `fas ${isPlaying ? 'fa-pause' : 'fa-play'}`;
}

async function playById(id, { forcePlay = true } = {}) {
  const t = state.tracks.find(x => x.id === id);
  if (!t) return;

  const wasSame = state.activeId === id;
  state.activeId = id;

  // Remember what was last played so we can resume on reload
  try { localStorage.setItem('sovr.lastActive', id); } catch {}

  // Ensure queue has at least something sensible so Next/Prev work
  if (!state.queue.length) {
    state.queue = state.filtered.map(x => x.id);
    renderQueue();
    updateStats();
  }

  setNowPlayingUI(t);

  const el = getMediaElForTrack(t);
  stopOtherMedia(el);

  if (t.type === 'video') {
    els.videoPanel.classList.remove('hidden');
    if (!els.videoMount.contains(videoEl)) {
      els.videoMount.innerHTML = '';
      videoEl.classList.remove('hidden');
      videoEl.classList.add('w-full', 'h-full');
      videoEl.style.maxHeight = 'none';
      els.videoMount.appendChild(videoEl);
    }
  } else {
    els.videoPanel.classList.add('hidden');
    try {
      if (videoEl.parentElement) {
        videoEl.pause();
        videoEl.classList.add('hidden');
        document.body.appendChild(videoEl);
      }
    } catch {}
  }

  el.crossOrigin = 'anonymous';
  el.src = t.src;
  el.preload = 'metadata';

  const vol = clamp(Number(els.volume.value) / 100, 0, 1);
  el.volume = vol;

  if (wasSame && !forcePlay) {
    togglePlay();
    renderGrid();
    return;
  }

  if (forcePlay) {
    try {
      await el.play();
      setPlayIcon(true);
      startViz(el);
      toast(`Now playing: <span class="text-white">${t.title}</span>`, 'ok');
    } catch (e) {
      setPlayIcon(false);
      startViz(el);
      toast('Tap Play to start audio (autoplay blocked).', 'warn');
    }
  }

  el.onloadedmetadata = () => {
    const dur = isFinite(el.duration) ? el.duration : null;
    if (dur && (!Number.isFinite(t.duration) || Math.abs(t.duration - dur) > 1)) {
      t.duration = dur;
      updateStats();
      const card = els.grid.querySelector(`[data-id="${t.id}"]`);
      if (card) {
        const durEl = card.querySelector('.mono');
        if (durEl) durEl.textContent = fmtTime(dur);
      }
    }
    els.durTime.textContent = fmtTime(el.duration);
  };

  el.onerror = () => {
    console.warn(`SOVR Musik: failed to load media ${t.src}`);
    toast(`Unable to load "${t.title}". Trying next track…`, 'bad');
    setPlayIcon(false);
    next();
  };

  el.onended = () => {
    if (state.repeat === 'one') {
      el.currentTime = 0;
      el.play();
      return;
    }
    next();
  };

  renderQueue();
}

function getActiveMediaEl() {
  const t = getActiveTrack();
  if (!t) return audioEl;
  return getMediaElForTrack(t);
}

async function togglePlay() {
  state.userInteracted = true;
  const t = getActiveTrack();
  if (!t) {
    const first = state.filtered[0] ?? state.tracks[0];
    if (first) return playById(first.id);
    return;
  }
  const el = getActiveMediaEl();
  if (el.paused) {
    try {
      await el.play();
      setPlayIcon(true);
      startViz(el);
    } catch {
      toast('Unable to play this media. Try another track or upload a local file.', 'bad');
    }
  } else {
    el.pause();
    setPlayIcon(false);
  }
}

function prev() {
  const t = getActiveTrack();
  const el = getActiveMediaEl();
  if (t && el.currentTime > 4) {
    el.currentTime = 0;
    return;
  }

  const list = getPlaybackList();
  if (!list.length) return;

  const idx = list.indexOf(state.activeId);
  const prevIdx = idx > 0 ? idx - 1 : (state.repeat === 'all' ? list.length - 1 : 0);
  playById(list[prevIdx]);
}

function next() {
  const list = getPlaybackList();
  if (!list.length) return;

  const idx = list.indexOf(state.activeId);
  if (idx < 0) {
    playById(list[0]);
    return;
  }

  let nextIdx = idx + 1;
  if (nextIdx >= list.length) {
    if (state.repeat === 'all') nextIdx = 0;
    else {
      setPlayIcon(false);
      return;
    }
  }
  playById(list[nextIdx]);
}

function getPlaybackList() {
  let list = state.queue.length ? [...state.queue] : state.tracks.map(t => t.id); // fallback to full catalog
  list = list.filter(id => state.tracks.some(t => t.id === id));

  if (state.shuffle) {
    const active = state.activeId;
    const rest = list.filter(x => x !== active);
    for (let i = rest.length - 1; i > 0; i--) {
      const r = crypto.getRandomValues(new Uint32Array(1))[0] / 2 ** 32;
      const j = Math.floor(r * (i + 1));
      [rest[i], rest[j]] = [rest[j], rest[i]];
    }
    list = active ? [active, ...rest] : rest;
  }

  return list;
}

function updateTransportUI() {
  els.shuffleBtn.classList.toggle('bg-white/10', state.shuffle);
  els.shuffleState.textContent = state.shuffle ? 'ON' : 'OFF';

  const rep = state.repeat;
  els.repeatState.textContent = rep.toUpperCase();
  els.repeatBtn.classList.toggle('bg-white/10', rep !== 'off');
  els.repeatBtn.title = `Repeat: ${rep}`;
  const icon = els.repeatBtn.querySelector('i');
  if (rep === 'one') icon.className = 'fas fa-redo-alt';
  else icon.className = 'fas fa-redo';
}

function updateSeekUI() {
  const el = getActiveMediaEl();
  const cur = el.currentTime || 0;
  const dur = isFinite(el.duration) ? el.duration : 0;
  els.curTime.textContent = fmtTime(cur);
  els.durTime.textContent = fmtTime(dur);
  if (dur > 0) {
    els.seek.value = String(Math.floor((cur / dur) * 1000));
  } else {
    els.seek.value = '0';
  }
  requestAnimationFrame(updateSeekUI);
}

// ---------------------------------------------------------------------------
// Visualizer (Web Audio API)
// ---------------------------------------------------------------------------
const vizCtx2d = els.viz.getContext('2d');

function initAudioContextIfNeeded() {
  if (state.viz.ctx) return;
  const AC = window.AudioContext ?? window.webkitAudioContext;
  if (!AC) {
    toast('Web Audio API not supported in this browser.', 'warn');
    state.viz.enabled = false;
    return;
  }
  state.viz.ctx = new AC();
  state.viz.analyser = state.viz.ctx.createAnalyser();
  state.viz.analyser.fftSize = 2048;
  state.viz.analyser.smoothingTimeConstant = 0.85;
  state.viz.data = new Uint8Array(state.viz.analyser.fftSize);
  state.viz.freq = new Uint8Array(state.viz.analyser.frequencyBinCount);
}

function connectSource(mediaEl) {
  initAudioContextIfNeeded();
  if (!state.viz.ctx || !state.viz.analyser) return;

  try {
    if (state.viz.source) {
      try { state.viz.source.disconnect(); } catch {}
      state.viz.source = null;
    }

    if (!mediaEl.__sovrSource) {
      mediaEl.__sovrSource = state.viz.ctx.createMediaElementSource(mediaEl);
    }
    state.viz.source = mediaEl.__sovrSource;

    state.viz.source.connect(state.viz.analyser);
    state.viz.analyser.connect(state.viz.ctx.destination);

    state.viz.corsLikelyBlocked = false;
    els.corsPill.classList.add('hidden');
  } catch (e) {
    state.viz.corsLikelyBlocked = true;
    els.corsPill.textContent = 'Visualizer limited (CORS) — upload local file for full analysis';
    els.corsPill.classList.remove('hidden');
  }
}

function startViz(mediaEl) {
  if (!state.viz.enabled) return;
  initAudioContextIfNeeded();
  if (!state.viz.ctx) return;

  if (state.viz.ctx.state === 'suspended' && state.userInteracted) {
    state.viz.ctx.resume().catch(() => {});
  }

  connectSource(mediaEl);

  if (!state.viz.raf) drawViz();
}

function drawViz() {
  state.viz.raf = requestAnimationFrame(drawViz);
  const w = els.viz.clientWidth;
  const h = els.viz.height;

  const dpr = Math.max(1, window.devicePixelRatio || 1);
  if (els.viz.width !== Math.floor(w * dpr) || els.viz.height !== Math.floor(h * dpr)) {
    els.viz.width = Math.floor(w * dpr);
    els.viz.height = Math.floor(h * dpr);
  }

  const cw = els.viz.width;
  const ch = els.viz.height;
  vizCtx2d.clearRect(0, 0, cw, ch);

  vizCtx2d.fillStyle = 'rgba(255,255,255,0.03)';
  vizCtx2d.fillRect(0, 0, cw, ch);

  if (!state.viz.enabled || !state.viz.analyser || state.viz.corsLikelyBlocked) {
    vizCtx2d.fillStyle = 'rgba(255,255,255,0.28)';
    vizCtx2d.font = `${Math.floor(11 * dpr)}px ui-sans-serif`;
    vizCtx2d.fillText(state.viz.corsLikelyBlocked ? 'Visualizer limited by CORS (try local upload)' : 'Visualizer off', 12 * dpr, 28 * dpr);
    return;
  }

  const mode = state.viz.mode;

  if (mode === 'wave') {
    state.viz.analyser.getByteTimeDomainData(state.viz.data);
    vizCtx2d.strokeStyle = 'rgba(167,139,250,0.95)';
    vizCtx2d.lineWidth = 2 * dpr;
    vizCtx2d.beginPath();

    const slice = cw / state.viz.data.length;
    let x = 0;
    for (let i = 0; i < state.viz.data.length; i++) {
      const v = state.viz.data[i] / 128.0;
      const y = (v * ch) / 2;
      if (i === 0) vizCtx2d.moveTo(x, y);
      else vizCtx2d.lineTo(x, y);
      x += slice;
    }
    vizCtx2d.stroke();

    vizCtx2d.strokeStyle = 'rgba(34,211,238,0.55)';
    vizCtx2d.lineWidth = 1 * dpr;
    vizCtx2d.stroke();
  } else {
    state.viz.analyser.getByteFrequencyData(state.viz.freq);
    const bins = 64;
    const step = Math.floor(state.viz.freq.length / bins);
    const barW = cw / bins;

    let avg = 0;
    for (let i = 0; i < bins; i++) {
      const v = state.viz.freq[i * step] / 255;
      avg += v;
      const barH = v * (ch * 0.92);
      const x = i * barW;
      const y = ch - barH;

      const g = vizCtx2d.createLinearGradient(0, y, 0, ch);
      g.addColorStop(0, 'rgba(34,211,238,0.90)');
      g.addColorStop(1, 'rgba(167,139,250,0.40)');
      vizCtx2d.fillStyle = g;
      vizCtx2d.fillRect(x + barW * 0.18, y, barW * 0.64, barH);
    }

    avg /= bins;
    setReactiveAmbience(avg);
  }

  if (mode === 'wave') {
    state.viz.analyser.getByteFrequencyData(state.viz.freq);
    let avg = 0;
    for (let i = 0; i < 80; i++) avg += state.viz.freq[i] / 255;
    avg /= 80;
    setReactiveAmbience(avg);
  }
}

function setReactiveAmbience(level01) {
  if (state.ambience !== 'reactive') return;
  const lvl = clamp(level01, 0, 1);
  const hue = Math.round(250 + lvl * 40);
  const alpha = 0.18 + lvl * 0.35;
  document.documentElement.style.setProperty('--reactHue', String(hue));
  document.documentElement.style.setProperty('--reactAlpha', String(alpha));
}

// ---------------------------------------------------------------------------
// Uploads & drag/drop
// ---------------------------------------------------------------------------
function filesToTracks(files) {
  const out = [];
  for (const f of files) {
    if (!f || !(f.type ?? '').match(/^(audio|video)\//)) continue;
    const isVideo = f.type.startsWith('video/');
    const objUrl = URL.createObjectURL(f);

    out.push(normalizeTrack({
      title: f.name.replace(/\.(mp3|wav|m4a|ogg|mp4|webm|mov|mkv)$/i, ''),
      artist: 'Local Upload',
      src: objUrl,
      type: isVideo ? 'video' : 'audio',
      tags: ['local'],
      album: 'Browser Session',
      year: new Date().getFullYear(),
      fileName: f.name,
      mime: f.type,
      coverHint: isVideo ? 'video' : 'mix',
    }, 'local'));
  }
  return out;
}

function addTracks(tracks, { save = true } = {}) {
  const existingSrc = new Set(state.tracks.map(t => t.src));
  let added = 0;
  for (const t of tracks) {
    if (!t || !t.src || existingSrc.has(t.src)) continue;
    state.tracks.push(t);
    existingSrc.add(t.src);
    added++;
  }
  refreshTagFilterOptions();
  applyFilters();
  renderQueue();
  updateStats();
  if (save) saveLibrary();
  return added;
}

// ---------------------------------------------------------------------------
// Export / Import (metadata only)
// ---------------------------------------------------------------------------
function exportLibrary() {
  const payload = {
    name: 'SOVR Musik Library',
    version: 1,
    exportedAt: new Date().toISOString(),
    tracks: state.tracks
      .filter(t => /^https?:/i.test(t.src))
      .map(({ id, _blob, origin, ...rest }) => rest),
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'sovr-musik-library.json';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  toast('Exported remote library JSON.', 'ok');
}

async function importLibrary(file) {
  const text = await file.text();
  let obj;
  try { obj = JSON.parse(text); } catch { toast('Invalid JSON import.', 'bad'); return; }
  const arr = Array.isArray(obj.tracks) ? obj.tracks : (Array.isArray(obj) ? obj : null);
  if (!arr) { toast('Import format not recognized. Expected {tracks:[...]}', 'warn'); return; }

  const tracks = arr
    .filter(t => t && typeof t.src === 'string' && /^https?:/i.test(t.src))
    .map(t => normalizeTrack(t, 'remote'));

  const added = addTracks(tracks, { save: true });
  toast(`Imported ${added} track(s).`, 'ok');
}

// ---------------------------------------------------------------------------
// Download
// ---------------------------------------------------------------------------
function downloadCurrent() {
  const t = getActiveTrack();
  if (!t) return;
  const a = document.createElement('a');
  a.href = t.src;

  const ext = t.type === 'video' ? '.mp4' : '.mp3';
  const base = (t.fileName ?? `${t.title} — ${t.artist}`)
    .replace(/[\\/:*?"<>|]+/g, '_')
    .slice(0, 140);
  a.download = base.endsWith(ext) ? base : (base + ext);
  document.body.appendChild(a);
  a.click();
  a.remove();
}

// ---------------------------------------------------------------------------
// Video controls
// ---------------------------------------------------------------------------
async function toggleVideoPanel() {
  els.videoPanel.classList.toggle('hidden');
  if (!els.videoPanel.classList.contains('hidden')) {
    const t = getActiveTrack();
    if (t && t.type === 'video') {
      if (!els.videoMount.contains(videoEl)) {
        els.videoMount.innerHTML = '';
        videoEl.classList.remove('hidden');
        videoEl.classList.add('w-full', 'h-full');
        els.videoMount.appendChild(videoEl);
      }
    }
  }
}

async function tryPiP() {
  const t = getActiveTrack();
  if (!t || t.type !== 'video') return toast('PiP is only available for video tracks.', 'warn');
  const el = videoEl;
  try {
    if (document.pictureInPictureElement) {
      await document.exitPictureInPicture();
    } else {
      await el.requestPictureInPicture();
    }
  } catch {
    toast('Picture-in-Picture not available for this browser/media.', 'warn');
  }
}

// ---------------------------------------------------------------------------
// Ambience toggle
// ---------------------------------------------------------------------------
function setAmbience(mode) {
  state.ambience = mode;
  localStorage.setItem('sovr.ambience', mode);
  if (mode === 'calm') {
    document.documentElement.style.setProperty('--reactAlpha', '0.10');
  }
  toast(`Ambience: <span class="text-white">${mode}</span>`, 'ok');
}

function toggleAmbience() {
  setAmbience(state.ambience === 'reactive' ? 'calm' : 'reactive');
}

// ---------------------------------------------------------------------------
// Persistence (metadata only)
// ---------------------------------------------------------------------------
function loadLibrary() {
  const raw = localStorage.getItem('sovr.library.v1');
  if (!raw) return null;
  try {
    const obj = JSON.parse(raw);
    if (!obj || !Array.isArray(obj.tracks)) return null;
    return obj.tracks.filter(t => t && typeof t.src === 'string' && /^https?:/i.test(t.src));
  } catch { return null; }
}

function saveLibrary() {
  const remote = state.tracks.filter(t => /^https?:/i.test(t.src));
  localStorage.setItem('sovr.library.v1', JSON.stringify({
    version: 1,
    savedAt: new Date().toISOString(),
    tracks: remote,
  }));
}

// ---------------------------------------------------------------------------
// Boot
// ---------------------------------------------------------------------------
async function boot(forceReset = false) {
  // reset ephemeral state
  state.queue = [];
  state.activeId = null;
  state.shuffle = false;
  state.repeat = 'off';
  updateTransportUI();

  // stop media
  audioEl.pause();
  videoEl.pause();
  audioEl.removeAttribute('src');
  videoEl.removeAttribute('src');

  // restore persisted volume
  els.volume.value = String(clamp(state.volume, 0, 100));
  audioEl.volume = clamp(state.volume / 100, 0, 1);
  videoEl.volume = clamp(state.volume / 100, 0, 1);

  // Load tracks: prefer tracks.json, fall back to saved library, then seeds
  let base = null;
  try {
    const response = await fetch('data/tracks.json');
    if (response.ok) {
      const json = await response.json();
      if (Array.isArray(json)) {
        base = json;
        console.log('Loaded tracks from data/tracks.json:', base.length, 'tracks');
      }
    }
  } catch (e) {
    console.log('Could not load data/tracks.json:', e.message);
  }

  if (!base) {
    const saved = forceReset ? null : loadLibrary();
    base = (saved && saved.length ? saved : seedTracks);
  }

  state.tracks = base.map(t => normalizeTrack(t, 'remote'));

  // initial UI
  refreshTagFilterOptions();
  updateGridCols();
  applyFilters();
  renderQueue();
  updateStats();
  setNowPlayingUI(null);

  els.vizOnBtn.textContent = state.viz.enabled ? 'On' : 'Off';
  setAmbience(state.ambience);

  await warmDurations();

  // resume last played track (paused, no autoplay)
  try {
    const lastId = localStorage.getItem('sovr.lastActive');
    if (lastId && state.tracks.some(t => t.id === lastId)) {
      state.activeId = lastId;
      const t = state.tracks.find(x => x.id === lastId);
      setNowPlayingUI(t);
      const el = getMediaElForTrack(t);
      el.src = t.src;
      el.preload = 'metadata';
      el.volume = clamp(state.volume / 100, 0, 1);
      const dur = isFinite(el.duration) ? el.duration : 0;
      els.durTime.textContent = fmtTime(dur);
    }
  } catch {}
}

async function warmDurations() {
  const sample = state.tracks.slice(0, 8);
  for (const t of sample) {
    if (Number.isFinite(t.duration)) continue;
    const temp = document.createElement(t.type === 'video' ? 'video' : 'audio');
    temp.preload = 'metadata';
    temp.crossOrigin = 'anonymous';
    temp.src = t.src;
    await new Promise(resolve => {
      const done = () => resolve();
      const cleanup = () => {
        temp.onloadedmetadata = null;
        temp.onerror = null;
        try { temp.removeAttribute('src'); temp.load(); } catch {}
      };
      temp.onloadedmetadata = () => {
        if (isFinite(temp.duration)) t.duration = temp.duration;
        done();
      };
      temp.onerror = () => done();
    });
  }
  updateStats();
  applyFilters();
}

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------
els.playBtn.addEventListener('click', () => { state.userInteracted = true; togglePlay(); });
els.prevBtn.addEventListener('click', () => { state.userInteracted = true; prev(); });
els.nextBtn.addEventListener('click', () => { state.userInteracted = true; next(); });

els.shuffleBtn.addEventListener('click', () => {
  state.shuffle = !state.shuffle;
  updateTransportUI();
  toast(`Shuffle ${state.shuffle ? 'ON' : 'OFF'}`, 'ok');
});

els.repeatBtn.addEventListener('click', () => {
  const order = ['off', 'all', 'one'];
  state.repeat = order[(order.indexOf(state.repeat) + 1) % order.length];
  updateTransportUI();
  toast(`Repeat: ${state.repeat}`, 'ok');
});

els.seek.addEventListener('input', () => {
  const el = getActiveMediaEl();
  const dur = isFinite(el.duration) ? el.duration : 0;
  if (dur <= 0) return;
  const p = Number(els.seek.value) / 1000;
  el.currentTime = p * dur;
});

els.volume.addEventListener('input', () => {
  const v = clamp(Number(els.volume.value) / 100, 0, 1);
  state.volume = Number(els.volume.value);
  try { localStorage.setItem('sovr.volume', String(state.volume)); } catch {}
  audioEl.volume = v;
  videoEl.volume = v;
});

els.downloadBtn.addEventListener('click', downloadCurrent);

els.openVideoBtn.addEventListener('click', toggleVideoPanel);
els.hideVideoBtn.addEventListener('click', () => els.videoPanel.classList.add('hidden'));
els.pipBtn.addEventListener('click', tryPiP);

els.vizOnBtn.addEventListener('click', () => {
  state.viz.enabled = !state.viz.enabled;
  els.vizOnBtn.textContent = state.viz.enabled ? 'On' : 'Off';
  toast(`Visualizer ${state.viz.enabled ? 'ON' : 'OFF'}`, 'ok');
});

els.vizModeBtn.addEventListener('click', () => {
  state.viz.mode = state.viz.mode === 'wave' ? 'bars' : 'wave';
  localStorage.setItem('sovr.vizMode', state.viz.mode);
  toast(`Visualizer mode: ${state.viz.mode}`, 'ok');
});

els.copyNowBtn.addEventListener('click', async () => {
  const t = getActiveTrack();
  if (!t) return toast('Nothing is playing.', 'warn');
  const txt = `${t.title} — ${t.artist}`;
  try {
    await navigator.clipboard.writeText(txt);
    toast('Copied now playing to clipboard.', 'ok');
  } catch {
    toast('Clipboard permission denied.', 'warn');
  }
});

// Search / filter / sort
const filterOnInput = () => applyFilters();
els.searchInput.addEventListener('input', filterOnInput);
els.typeFilter.addEventListener('change', filterOnInput);
els.tagFilter.addEventListener('change', filterOnInput);
els.sortSelect.addEventListener('change', filterOnInput);
els.clearSearchBtn.addEventListener('click', () => { els.searchInput.value = ''; applyFilters(); els.searchInput.focus(); });

// Upload
els.uploadBtn.addEventListener('click', () => els.filePicker.click());
els.filePicker.addEventListener('change', () => {
  const files = Array.from(els.filePicker.files ?? []);
  const tracks = filesToTracks(files);
  const added = addTracks(tracks, { save: false });
  toast(`Added ${added} local track(s).`, added ? 'ok' : 'warn');
  els.filePicker.value = '';
});

// Drop anywhere
;['dragenter', 'dragover'].forEach(evt => document.addEventListener(evt, (e) => {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'copy';
      els.dropzone.classList.add('ring-2', 'ring-bronze');
}));
;['dragleave', 'drop'].forEach(evt => document.addEventListener(evt, (e) => {
  e.preventDefault();
      els.dropzone.classList.remove('ring-2', 'ring-bronze');
}));

document.addEventListener('drop', (e) => {
  const files = Array.from(e.dataTransfer.files ?? []);
  if (!files.length) return;
  const tracks = filesToTracks(files);
  const added = addTracks(tracks, { save: false });
  toast(`Dropped ${added} track(s) into session.`, added ? 'ok' : 'warn');
});

// Queue drawer
els.queueBtn.addEventListener('click', () => { renderQueue(); openQueue(true); });
els.closeQueueBtn.addEventListener('click', () => openQueue(false));
els.clearQueueBtn.addEventListener('click', () => { queueClear(); toast('Queue cleared.', 'ok'); });
els.addFilteredToQueueBtn.addEventListener('click', () => {
  const add = state.filtered.map(t => t.id).filter(id => !state.queue.includes(id));
  state.queue.push(...add);
  renderQueue();
  updateStats();
  toast(`Added ${add.length} from filtered list to queue.`, add.length ? 'ok' : 'warn');
});

// Export / import / reset
els.exportBtn.addEventListener('click', exportLibrary);
els.importBtn.addEventListener('click', () => els.importPicker.click());
els.importPicker.addEventListener('change', async () => {
  const f = els.importPicker.files?.[0];
  if (!f) return;
  await importLibrary(f);
  els.importPicker.value = '';
});
els.resetBtn.addEventListener('click', async () => {
  if (!confirm('Reset library to defaults? (Remote library resets, local uploads are always session-only.)')) return;
  localStorage.removeItem('sovr.library.v1');
  await boot(true);
  toast('Library reset.', 'ok');
});

// Grid columns
els.gridMinus.addEventListener('click', () => { state.gridCols = clamp(state.gridCols - 1, 4, 8); updateGridCols(); toast(`Grid: ${state.gridCols} cols`, 'ok'); });
els.gridPlus.addEventListener('click', () => { state.gridCols = clamp(state.gridCols + 1, 4, 8); updateGridCols(); toast(`Grid: ${state.gridCols} cols`, 'ok'); });

// Help
if (els.helpBtn) {
  els.helpBtn.addEventListener('click', () => els.helpModal.classList.remove('hidden'));
}
els.helpCloseBtn.addEventListener('click', () => els.helpModal.classList.add('hidden'));
els.helpModal.addEventListener('click', (e) => { if (e.target === els.helpModal || e.target.classList.contains('bg-black/60')) els.helpModal.classList.add('hidden'); });

// Ambience
els.themeBtn.addEventListener('click', toggleAmbience);

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
  const tag = (e.target && e.target.tagName) ? e.target.tagName.toLowerCase() : '';
  const isTyping = tag === 'input' || tag === 'textarea' || e.target?.isContentEditable;

  if (e.key === '/' && !isTyping) {
    e.preventDefault();
    els.searchInput.focus();
    return;
  }

  if (isTyping) {
    if (e.key === 'Escape') e.target.blur();
    return;
  }

  if (e.code === 'Space') { e.preventDefault(); state.userInteracted = true; togglePlay(); }
  if (e.ctrlKey && e.key === 'ArrowRight') { e.preventDefault(); next(); }
  if (e.ctrlKey && e.key === 'ArrowLeft') { e.preventDefault(); prev(); }
  if (!e.ctrlKey && e.key === 'ArrowRight') { const el = getActiveMediaEl(); el.currentTime = (el.currentTime || 0) + 5; }
  if (!e.ctrlKey && e.key === 'ArrowLeft') { const el = getActiveMediaEl(); el.currentTime = Math.max(0, (el.currentTime || 0) - 5); }
  if (e.key.toLowerCase() === 'm') {
    const el = getActiveMediaEl();
    el.muted = !el.muted;
    toast(el.muted ? 'Muted' : 'Unmuted', 'ok');
  }
  if (e.key === 'Escape') { openQueue(false); els.helpModal.classList.add('hidden'); }
});

// Resize
window.addEventListener('resize', applyResponsiveGrid);

// Update seek every frame
requestAnimationFrame(updateSeekUI);

// Keep play icon in sync
;[audioEl, videoEl].forEach(el => {
  el.addEventListener('play', () => setPlayIcon(true));
  el.addEventListener('pause', () => setPlayIcon(false));
});

// Boot
(async () => {
  await boot(false);

  setTimeout(() => {
    toast('Tip: drag & drop your own tracks (mp3/mp4). Local uploads unlock full waveform analysis.', 'info', 4800);
  }, 700);
})();
