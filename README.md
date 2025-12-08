# SOVR Musik

The official AI-powered music streaming dashboard for **The Sovereign Stack**.

## 🎵 Overview

SOVR Musik is a modern, responsive web application designed to showcase and stream the **Tunee** AI music catalog. Built with a focus on aesthetics ("Elegance in the Shadows") and performance, it features a persistent player, real-time visualization, and a grid-based discovery layout.

## ✨ Features

*   **Responsive Grid Layout:** Dynamic 4x to 8x card grid that adapts to all screen sizes.
*   **Persistent Audio Player:** Global bottom player with:
    *   Play/Pause, Next/Prev, Shuffle, and Repeat loops.
    *   Volume control and progress seeking.
    *   Download functionality.
*   **Media Support:** Handles both pure audio (`.mp3`) and video (`.mp4`) tracks.
*   **Search & Filtering:** Real-time search by title or artist.
*   **Visualizations:** Integrated audio waveform visualization.
*   **Drag & Drop Upload:** Local interface to drag and drop new tracks directly into the browser session.

## 🛠️ Technology Stack

*   **Core:** HTML5, Vanilla JavaScript (ES6+)
*   **Styling:** Tailwind CSS (via CDN), Custom CSS
*   **Data:** JSON-based track library (`tracks.json`)
*   **Icons:** Font Awesome 5

## 🚀 Setup & Usage

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/StavoMidnite661/sovr-musik.git
    ```
2.  **Serve locally:**
    You can use any static file server.
    ```bash
    npx http-server -p 8081
    ```
3.  **Visit:** `http://localhost:8081/NewIndex.html`

## 📦 Media Files

**Note:** The actual media files (`tracks/*.mp4`) are **excluded** from this repository to minimize size (approx 1.3GB).
*   **For Development:** Place your own media files in a `tracks/` folder and update `tracks.json`.
*   **For Production:** Configure `tracks.json` to point to an external storage bucket (e.g., AWS S3, Google Cloud Storage, or Firebase Storage).

## 🌐 Deployment

This project is optimized for static hosting providers like **Netlify**, **Vercel**, or **Firebase Hosting**.

*   **Live URL:** [musik.sovr.world](https://musik.sovr.world)

---
*© 2025 SOVR Development Holdings LLC*
