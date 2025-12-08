/* Main App State - VERSION 2 */
console.log("APP V2: Loading SOVR Musik Player...");

const state = {
  playlists: {
    'all': [],
    'favorites': []
  },
  currentPlaylistId: 'all',
  currentTrackIndex: 0,
  isPlaying: false
};

// Global for debugging
window.state = state;

// DOM Elements
let audio, playBtn, prevBtn, nextBtn, progressBar, currTimeEl, totalTimeEl, volumeSlider;
let trackListEl, playlistNav, createPlaylistBtn, viewTitle, viewDesc;
let npTitle, npArtist, npImg;

// --- Initialization ---
function init() {
  console.log("APP V2: Initializing...");
  
  // Bind Elements
  audio = document.getElementById('main-audio');
  playBtn = document.getElementById('play-btn');
  prevBtn = document.getElementById('prev-btn');
  nextBtn = document.getElementById('next-btn');
  progressBar = document.getElementById('progress-bar');
  currTimeEl = document.getElementById('curr-time');
  totalTimeEl = document.getElementById('total-time');
  volumeSlider = document.getElementById('volume-slider');
  trackListEl = document.getElementById('track-list');
  playlistNav = document.getElementById('playlist-nav');
  createPlaylistBtn = document.getElementById('create-playlist-btn');
  viewTitle = document.querySelector('.header-banner h1');
  viewDesc = document.querySelector('.header-banner p');
  
  npTitle = document.getElementById('np-title');
  npArtist = document.getElementById('np-artist');
  npImg = document.getElementById('np-img');

  if(!audio || !trackListEl) {
    console.error("APP V2: Critical elements missing from DOM.");
    // Retry once if DOM elements are missing (rare race condition)
    setTimeout(init, 500); 
    return;
  }

  loadDefaultTracks().then(() => {
    loadPlaylistsFromStorage();
    renderSidebar();
    renderTrackList();
    console.log("APP V2: Ready.");
  });
  
  // Setup Sidebar Clicks
  playlistNav.addEventListener('click', (e) => {
    if(e.target.tagName === 'LI') {
      const id = e.target.getAttribute('data-id');
      switchPlaylist(id);
    }
  });

  if(createPlaylistBtn) {
    createPlaylistBtn.addEventListener('click', createNewPlaylist);
  } else {
    console.error("APP V2: logical error - create playlist button not found");
  }

  setupControls();
  setupDragDrop();
}

// --- Data Management ---
async function loadDefaultTracks() {
  try {
    const res = await fetch('tracks.json');
    if(!res.ok) throw new Error("Failed to fetch tracks.json");
    const tracks = await res.json();
    state.playlists['all'] = tracks;
    console.log("APP V2: Loaded", tracks.length, "default tracks.");
  } catch (err) {
    console.error("APP V2: Error loading default tracks", err);
    state.playlists['all'] = [];
  }
}

function loadPlaylistsFromStorage() {
  try {
    const stored = localStorage.getItem('sovr_playlists');
    if (stored) {
      const parsed = JSON.parse(stored);
      Object.keys(parsed).forEach(key => {
        if(key !== 'all') {
          state.playlists[key] = parsed[key];
        }
      });
      console.log("APP V2: Loaded playlists from storage.");
    }
  } catch(e) {
    console.warn("APP V2: Error reading local storage", e);
  }
}

function savePlaylists() {
  localStorage.setItem('sovr_playlists', JSON.stringify(state.playlists));
}

// --- UI Rendering ---
function renderSidebar() {
  playlistNav.innerHTML = '';
  
  const systemLists = ['all', 'favorites'];
  
  systemLists.forEach(id => {
    const li = document.createElement('li');
    li.textContent = id === 'all' ? 'All Tracks' : 'Favorites';
    li.setAttribute('data-id', id);
    if(state.currentPlaylistId === id) li.classList.add('active');
    playlistNav.appendChild(li);
  });

  Object.keys(state.playlists).forEach(id => {
    if(!systemLists.includes(id)) {
      const li = document.createElement('li');
      li.textContent = id;
      li.setAttribute('data-id', id);
      if(state.currentPlaylistId === id) li.classList.add('active');
      playlistNav.appendChild(li);
    }
  });
}

function renderTrackList() {
  trackListEl.innerHTML = '';
  const tracks = state.playlists[state.currentPlaylistId] || [];
  
  if(tracks.length === 0) {
    trackListEl.innerHTML = '<div style="padding:2rem; text-align:center; color:#555;">No tracks in this playlist.<br>Drag & Drop music here!</div>';
  } else {
    tracks.forEach((track, index) => {
      const row = document.createElement('div');
      row.className = 'track-item'; 
      row.innerHTML = `
        <span>${index + 1}</span>
        <span>${track.title || "Unknown Title"}</span>
        <span>${track.artist || "Unknown Artist"}</span>
        <span>--:--</span>
      `;
      row.onclick = () => playTrack(track);
      trackListEl.appendChild(row);
    });
  }
  
  if(viewTitle) viewTitle.textContent = state.currentPlaylistId === 'all' ? 'My Library' : state.currentPlaylistId;
  if(viewDesc) viewDesc.textContent = `${tracks.length} tracks`;
}

// --- Playlist Logic ---
function switchPlaylist(id) {
  state.currentPlaylistId = id;
  renderSidebar();
  renderTrackList();
}

function createNewPlaylist() {
  const name = prompt("Enter playlist name:");
  if(name && !state.playlists[name]) {
    state.playlists[name] = [];
    savePlaylists();
    switchPlaylist(name);
  }
}

// --- Player Logic ---
function playTrack(track) {
  console.log("APP V2: Playing", track.title);
  audio.src = track.src;
  npTitle.innerText = track.title;
  npArtist.innerText = track.artist;
  npImg.src = track.img;
  
  audio.play().catch(e => console.error("Audio Play Error:", e));
  state.isPlaying = true;
  playBtn.innerText = "⏸";
}

// --- Controls ---
function setupControls() {
  playBtn.addEventListener('click', () => {
    if (state.isPlaying) { audio.pause(); state.isPlaying = false; playBtn.innerText = "▶"; }
    else { audio.play(); state.isPlaying = true; playBtn.innerText = "⏸"; }
  });

  volumeSlider.addEventListener('input', (e) => audio.volume = e.target.value);

  audio.addEventListener('timeupdate', () => {
    if (!isNaN(audio.duration)) {
      progressBar.value = (audio.currentTime / audio.duration) * 100;
      currTimeEl.innerText = formatTime(audio.currentTime);
      totalTimeEl.innerText = formatTime(audio.duration);
    }
  });

  progressBar.addEventListener('input', () => {
      audio.currentTime = (progressBar.value / 100) * audio.duration;
  });
}

function formatTime(s) {
  const m = Math.floor(s / 60);
  const sc = Math.floor(s % 60);
  return `${m}:${sc < 10 ? '0' : ''}${sc}`;
}

// --- Drag & Drop ---
function setupDragDrop() {
  const dropOverlay = document.getElementById('drop-overlay');
  if(!dropOverlay) return;
  
  let dragCounter = 0;

  window.addEventListener('dragenter', (e) => { e.preventDefault(); dragCounter++; dropOverlay.classList.add('active'); });
  window.addEventListener('dragleave', (e) => { e.preventDefault(); dragCounter--; if(dragCounter === 0) dropOverlay.classList.remove('active'); });
  window.addEventListener('dragover', (e) => { e.preventDefault(); });

  window.addEventListener('drop', (e) => {
    e.preventDefault();
    dragCounter = 0;
    dropOverlay.classList.remove('active');
    handleDrop(e.dataTransfer.files);
  });
}

function handleDrop(files) {
  let addedCount = 0;
  const currentListId = state.currentPlaylistId;
  console.log("APP V2: Dropped", files.length, "files");

  Array.from(files).forEach(file => {
    if (file.type.startsWith('audio/')) {
      const newTrack = {
        title: file.name.replace(/\.[^/.]+$/, ""),
        artist: "Local File",
        img: "https://placehold.co/300x300/333/fff?text=Local",
        src: URL.createObjectURL(file)
      };
      
      if(currentListId !== 'all') {
         state.playlists[currentListId].push(newTrack);
      }
      state.playlists['all'].push(newTrack);
      addedCount++;
    }
  });

  if(addedCount > 0) {
    savePlaylists();
    renderTrackList();
    if(state.playlists[currentListId].length === addedCount) {
        playTrack(state.playlists[currentListId][0]);
    }
  }
}

// --- Boot ---
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
