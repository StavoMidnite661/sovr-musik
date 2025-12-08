/**
 * SOVR Empire - AI Music Showcase
 * Features: Drag & Drop, Audio Mode, Playlist Queue, Download Buttons
 */

// ========== STATE ==========
let allTracks = [];
let currentTrackIndex = -1;
let isPlaying = false;
let audioOnlyMode = false;

// ========== DOM ELEMENTS ==========
let audio, playerBar, playBtn, prevBtn, nextBtn;
let progressBar, currentTimeEl, totalTimeEl, volumeSlider;
let playerTitle, playerArtist, playerArtwork;
let tracksContainer, audioModeToggle;

// ========== INITIALIZATION ==========
document.addEventListener('DOMContentLoaded', () => {
  // Bind DOM elements
  audio = document.getElementById('main-audio');
  playerBar = document.getElementById('player-bar');
  playBtn = document.getElementById('play-btn');
  prevBtn = document.getElementById('prev-btn');
  nextBtn = document.getElementById('next-btn');
  progressBar = document.getElementById('progress-bar');
  currentTimeEl = document.getElementById('current-time');
  totalTimeEl = document.getElementById('total-time');
  volumeSlider = document.getElementById('volume-slider');
  playerTitle = document.getElementById('player-title');
  playerArtist = document.getElementById('player-artist');
  playerArtwork = document.getElementById('player-artwork');
  tracksContainer = document.querySelector('.tracks');
  audioModeToggle = document.getElementById('audio-mode-toggle');
  
  // Load tracks
  loadTracks();
  
  // Setup event listeners
  setupPlayerControls();
  setupDragDrop();
  setupAudioModeToggle();
  
  console.log("SOVR Empire: Ready! 🎵");
});

// ========== LOAD TRACKS ==========
async function loadTracks() {
  try {
    const res = await fetch('tracks.json?v=' + Date.now());
    if (!res.ok) throw new Error("Failed to load tracks.json");
    
    allTracks = await res.json();
    renderTracks();
    console.log("SOVR Empire: Loaded", allTracks.length, "tracks.");
    
  } catch (err) {
    console.warn("No tracks.json found, starting with empty library.");
    allTracks = [];
    renderTracks();
  }
}

// ========== RENDER TRACKS ==========
function renderTracks() {
  tracksContainer.innerHTML = '';
  
  if (allTracks.length === 0) {
    tracksContainer.innerHTML = `
      <div class="empty-state">
        <h3>🎧 No Tracks Yet</h3>
        <p>Drag & drop your AI-generated music here!</p>
      </div>
    `;
    return;
  }

  allTracks.forEach((track, index) => {
    const card = document.createElement("div");
    card.className = "track" + (track.isNew ? " new" : "") + (index === currentTrackIndex ? " playing" : "");
    card.dataset.index = index;
    
    const isVideo = track.src.toLowerCase().endsWith('.mp4');
    
    // Artwork or video
    let mediaSection;
    if (audioOnlyMode || !isVideo) {
      mediaSection = `<img src="${track.img || generatePlaceholder(track.title)}" alt="${track.title}" onclick="playTrackByIndex(${index})" />`;
    } else {
      mediaSection = `
        <video controls poster="${track.img || generatePlaceholder(track.title)}">
          <source src="${track.src}" type="video/mp4">
        </video>`;
    }
    
    card.innerHTML = `
      ${mediaSection}
      <p class="track-title">${track.title}</p>
      ${track.artist ? `<p class="artist">${track.artist}</p>` : ''}
      <div class="track-actions">
        <button class="play-track-btn" onclick="playTrackByIndex(${index})">▶ Play</button>
        <a class="download-btn" href="${track.src}" download="${track.title}.${isVideo ? 'mp4' : 'mp3'}">⬇ Download</a>
      </div>
    `;
    
    tracksContainer.appendChild(card);
    
    if (track.isNew) {
      setTimeout(() => { track.isNew = false; }, 500);
    }
  });
}

// ========== PLACEHOLDER GENERATOR ==========
function generatePlaceholder(title) {
  const colors = ['ff7a00', '00aaff', 'aa00ff', '00ff7a', 'ff0077', 'ffaa00'];
  const color = colors[Math.floor(Math.random() * colors.length)];
  return `https://placehold.co/300x300/000/${color}?text=${encodeURIComponent(title.slice(0, 12))}`;
}

// ========== PLAYER CONTROLS ==========
function setupPlayerControls() {
  // Play/Pause
  playBtn.addEventListener('click', togglePlayPause);
  
  // Previous/Next
  prevBtn.addEventListener('click', playPrevious);
  nextBtn.addEventListener('click', playNext);
  
  // Progress bar
  audio.addEventListener('timeupdate', updateProgress);
  progressBar.addEventListener('input', seekTo);
  
  // Volume
  volumeSlider.addEventListener('input', (e) => {
    audio.volume = e.target.value;
  });
  
  // Track ended - auto play next
  audio.addEventListener('ended', playNext);
  
  // Metadata loaded
  audio.addEventListener('loadedmetadata', () => {
    totalTimeEl.textContent = formatTime(audio.duration);
  });
}

function togglePlayPause() {
  if (currentTrackIndex === -1 && allTracks.length > 0) {
    playTrackByIndex(0);
    return;
  }
  
  if (isPlaying) {
    audio.pause();
    isPlaying = false;
    playBtn.textContent = '▶';
  } else {
    audio.play();
    isPlaying = true;
    playBtn.textContent = '⏸';
  }
}

function playTrackByIndex(index) {
  if (index < 0 || index >= allTracks.length) return;
  
  currentTrackIndex = index;
  const track = allTracks[index];
  
  // Update audio source
  audio.src = track.src;
  audio.play();
  isPlaying = true;
  
  // Update player bar UI
  playerTitle.textContent = track.title;
  playerArtist.textContent = track.artist || 'SOVR Empire';
  playerArtwork.src = track.img || generatePlaceholder(track.title);
  playBtn.textContent = '⏸';
  
  // Show player bar
  playerBar.classList.remove('hidden');
  
  // Highlight current track in grid
  document.querySelectorAll('.track').forEach((el, i) => {
    el.classList.toggle('playing', i === index);
  });
  
  console.log("Now Playing:", track.title);
}

function playPrevious() {
  if (currentTrackIndex > 0) {
    playTrackByIndex(currentTrackIndex - 1);
  } else if (allTracks.length > 0) {
    playTrackByIndex(allTracks.length - 1); // Loop to end
  }
}

function playNext() {
  if (currentTrackIndex < allTracks.length - 1) {
    playTrackByIndex(currentTrackIndex + 1);
  } else if (allTracks.length > 0) {
    playTrackByIndex(0); // Loop to start
  }
}

function updateProgress() {
  if (!isNaN(audio.duration)) {
    const percent = (audio.currentTime / audio.duration) * 100;
    progressBar.value = percent;
    currentTimeEl.textContent = formatTime(audio.currentTime);
  }
}

function seekTo() {
  audio.currentTime = (progressBar.value / 100) * audio.duration;
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

// ========== AUDIO MODE TOGGLE ==========
function setupAudioModeToggle() {
  audioModeToggle.addEventListener('change', (e) => {
    audioOnlyMode = e.target.checked;
    renderTracks();
    console.log("Audio-only mode:", audioOnlyMode ? "ON" : "OFF");
  });
}

// ========== DRAG & DROP ==========
function setupDragDrop() {
  const dropOverlay = document.getElementById('drop-overlay');
  let dragCounter = 0;

  document.body.addEventListener('dragenter', (e) => {
    e.preventDefault();
    dragCounter++;
    dropOverlay.classList.add('active');
  });

  document.body.addEventListener('dragleave', (e) => {
    e.preventDefault();
    dragCounter--;
    if (dragCounter <= 0) {
      dragCounter = 0;
      dropOverlay.classList.remove('active');
    }
  });

  document.body.addEventListener('dragover', (e) => {
    e.preventDefault();
  });

  document.body.addEventListener('drop', (e) => {
    e.preventDefault();
    dragCounter = 0;
    dropOverlay.classList.remove('active');
    
    if (e.dataTransfer && e.dataTransfer.files) {
      handleFileDrop(e.dataTransfer.files);
    }
  });
}

function handleFileDrop(files) {
  let addedCount = 0;
  
  Array.from(files).forEach(file => {
    if (file.type.startsWith('audio/') || file.type.startsWith('video/')) {
      const trackTitle = file.name
        .replace(/\.[^/.]+$/, "")
        .replace(/[-_]/g, " ")
        .replace(/\b\w/g, c => c.toUpperCase());
      
      const newTrack = {
        title: trackTitle,
        artist: "AI Generated",
        img: generatePlaceholder(trackTitle),
        src: URL.createObjectURL(file),
        isNew: true
      };
      
      allTracks.unshift(newTrack);
      addedCount++;
    }
  });

  if (addedCount > 0) {
    // Adjust current index if tracks added before it
    if (currentTrackIndex >= 0) {
      currentTrackIndex += addedCount;
    }
    
    renderTracks();
    document.getElementById('catalog').scrollIntoView({ behavior: 'smooth' });
    console.log(`Added ${addedCount} track(s) to the catalog.`);
  }
}
