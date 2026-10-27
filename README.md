# SOVR Musik

The official AI-powered music streaming dashboard for **The Sovereign Stack**.

## 🎵 Overview

SOVR Musik is a modern, responsive web application designed to showcase and stream the **Tunee** AI music catalog. Built with a focus on aesthetics ("Elegance in the Shadows") and performance, it features a persistent player, real-time audio visualization, and a grid-based discovery layout.

## ✨ Features

*   **Responsive Grid Layout:** Dynamic 4× to 8× card grid that adapts to all screen sizes.
*   **Persistent Audio/Video Player:** Global bottom player with:
    *   Play/Pause, Next/Prev, Shuffle, and Repeat (off / all / one).
    *   Volume control, progress seeking, and download.
    *   Picture-in-Picture for video tracks.
*   **Media Support:** Handles both audio (`.mp3`, `.wav`, `.m4a`, `.ogg`) and video (`.mp4`, `.webm`, …) tracks.
*   **Search & Filtering:** Real-time search by title, artist, or tags; type (audio/video) and tag filters; multiple sort orders.
*   **Visualizations:** Integrated Web Audio API waveform/spectrum visualizer with reactive ambient background.
*   **Drag & Drop Upload:** Drag local audio/video files onto the page to add them to your session (files stay local to your browser).
*   **Queue:** Reorderable queue drawer with double-to-play and "add filtered" bulk actions.
*   **Library Import/Export:** Export your remote library as JSON and import it back.
*   **Keyboard Shortcuts:** `Space` play/pause, `Ctrl+→/←` next/prev, `→/←` seek ±5s, `M` mute, `/` focus search.
*   **Local-first:** Preferences (volume, grid columns, ambience, visualizer mode) and your library persist in `localStorage`.

## 🛠️ Technology Stack

*   **Core:** HTML5, Vanilla JavaScript (ES6+)
*   **Styling:** Tailwind CSS (CDN) + custom CSS
*   **Data:** JSON-based track library (`data/tracks.json`)
*   **Icons:** Font Awesome 5

## 📁 Project Structure

```
sovr-musik/
├─ index.html            # Application shell
├─ css/
│  └─ style.css          # Custom component styles & dark theme
├─ js/
│  └─ app.js             # Application logic (player, grid, viz, uploads, …)
├─ data/
│  └─ tracks.json        # Cleaned track library (every entry points to a real file)
├─ tracks/               # Media files (mp4 videos; excluded from snapshots/large-storage conventions)
├─ vercel.json           # Vercel static hosting config
└─ README.md
```

## 🚀 Setup & Usage

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/StavoMidnite661/sovr-musik.git
    cd sovr-musik
    ```
2.  **Serve locally** (any static file server):
    ```bash
    npx http-server -p 8081
    # or: python3 -m http.server 8081
    ```
3.  **Visit:** `http://localhost:8081/`

## 📦 Media Files

The actual media files (`tracks/*.mp4`, ~1.3 GB) are kept in the repository. If you sync to a fresh clone without them, point `data/tracks.json` at your own media files or an external storage bucket (AWS S3, Google Cloud Storage, Firebase Storage) and update the `src` URLs accordingly.

## 🌐 Deployment

Optimized for static hosting (Vercel, Netlify, Firebase Hosting).

*   **Live URL:** [musik.sovr.world](https://musik.sovr.world)

## 🔧 Data Maintenance

`data/tracks.json` was rebuilt so every entry points to a real file on disk. If you add new media files to `tracks/`, regenerate or manually append entries:

```json
{
  "title": "My Track",
  "artist": "Tunee",
  "img": "https://placehold.co/300x300/000/ff7a00?text=My+Track",
  "src": "tracks/My Track.mp4",
  "type": "video",
  "tags": ["tunee", "video"],
  "album": "Tunee Catalog",
  "year": 2025,
  "coverHint": "mix"
}
```

---

*© 2025 SOVR Development Holdings LLC*
