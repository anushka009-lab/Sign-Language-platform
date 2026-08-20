# 🤟 SignBridge — AI-Powered Real-Time Sign Language Platform

[![React](https://img.shields.io/badge/React-19.2-61DAFB.svg?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178C6.svg?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8.2-646CFF.svg?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![MediaPipe](https://img.shields.io/badge/MediaPipe-Hands-0077FF.svg?style=for-the-badge&logo=google&logoColor=white)](https://developers.google.com/mediapipe)
[![WebRTC](https://img.shields.io/badge/WebRTC-P2P_Video-333333.svg?style=for-the-badge&logo=webrtc&logoColor=white)](https://webrtc.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)](LICENSE)

**SignBridge** is an accessible, privacy-first, real-time AI sign language translation and video communication platform. Designed to seamlessly bridge the gap between Deaf/Hard-of-Hearing (DHH) individuals and hearing individuals, SignBridge performs on-device computer vision and hand landmark classification without transmitting video frames to third-party servers.

---

## 📋 Table of Contents

- [✨ Key Features](#-key-features)
- [🏗️ System Architecture & AI Pipeline](#️-system-architecture--ai-pipeline)
- [🛠️ Tech Stack](#️-tech-stack)
- [🚀 Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Running the Application](#running-the-application)
- [📖 Application Modules & User Guide](#-application-modules--user-guide)
- [📡 WebRTC & Signaling Protocol](#-webrtc--signaling-protocol)
- [📁 Project Directory Structure](#-project-directory-structure)
- [⚡ Available npm Scripts](#-available-npm-scripts)
- [🤝 Contributing](#-contributing)
- [📄 License](#-license)

---

## ✨ Key Features

- 🖐️ **21-Point Real-Time Hand Tracking**: Instant computer vision landmark extraction powered by `@mediapipe/hands` running directly in the browser.
- 🧠 **On-Device 3D Geometry Classifier**: Custom vector math engine calculating 3D finger curl angles, landmark spread, hand orientation, and motion trajectories (waving, circles, swipes).
- 📚 **Comprehensive 40+ Sign Catalog**: Recognizes ASL Alphabet (A–Z), numbers (1–5), essential phrases, and complex two-handed signs (`HELP`, `BOOK`, `MORE`, `TOGETHER`, `CLAP`).
- 🎥 **WebRTC Video Rooms with Live Translation**: Peer-to-peer video calls between DHH and Hearing users with real-time sign captioning, text fallback, and Text-to-Speech (TTS) voice playback.
- 🎯 **Interactive AI Practice Studio**: Step-by-step sign practice with live landmark skeleton overlays, real-time match confidence scoring, and visual accuracy targets.
- ⚡ **Gesture Studio & Custom Recorder**: Record personal custom hand gestures, save 21-point spatial templates locally, and test real-time gesture matching.
- 🔒 **Zero-Server Video Privacy**: 100% client-side inference — webcam data is processed locally inside your browser and never leaves your device.

---

## 🏗️ System Architecture & AI Pipeline

```
┌─────────────────┐      ┌──────────────────────────┐      ┌───────────────────────────────┐
│   Webcam Feed   ├─────►│ MediaPipe Hands (Client) ├─────►│  21 3D Landmark Coordinates   │
└─────────────────┘      └──────────────────────────┘      └──────────────┬────────────────┘
                                                                          │
                                                                          ▼
┌─────────────────┐      ┌──────────────────────────┐      ┌───────────────────────────────┐
│ Speech / Video  │◄─────┤ WebRTC DataChannel & TTS │◄─────┤ Custom 3D Geometry & Motion   │
│ Display Output  │      │   Signaling Server Sync  │      │ Classification Engine (ML)    │
└─────────────────┘      └──────────────────────────┘      └───────────────────────────────┘
```

1. **Landmark Extraction**: MediaPipe identifies 21 key points per hand in 3D space ($x, y, z$).
2. **Geometric Normalization**: Wrist landmark is set as origin $(0,0,0)$ and coordinates are scaled relative to palm size for resolution invariance.
3. **Angle & Distance Analysis**: Calculates finger flex/extension angles, inter-finger distances, and thumb-to-finger pinches.
4. **Temporal Buffer**: Uses a multi-frame rolling confidence buffer (`SignBuffer`) to eliminate gesture flickering and false positives.
5. **Real-Time Dispatch**: Recognized gestures trigger local speech synthesis and stream across WebRTC DataChannels to peer call participants.

---

## 🛠️ Tech Stack

- **Frontend Core**: React 19, TypeScript 6, Vite 8
- **Computer Vision & AI**: `@mediapipe/hands`, `@mediapipe/camera_utils`, Custom 3D Spatial Geometry Engine (`src/ml/signClassifier.ts`)
- **Real-Time Communication**: WebRTC `RTCPeerConnection` & `RTCDataChannel`, Node.js + Socket.IO Signaling Server
- **Speech Processing**: Web Speech API (`SpeechSynthesis` & `SpeechRecognition`)
- **Styling & UI**: Modern Vanilla CSS, Glassmorphism, CSS Custom Properties, Responsive Layouts

---

## 🚀 Getting Started

### Prerequisites

Ensure you have **Node.js** (v18.0.0 or higher) and **npm** installed:
```bash
node -v
npm -v
```

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/anushka009-lab/Sign-Language-platform.git
   cd Sign-Language-platform
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

### Running the Application

To run the complete platform locally:

1. **Start the WebRTC Signaling Server** (runs on port `3001`):
   ```bash
   npm run server
   ```

2. **Start the Frontend Development Server** (in a separate terminal):
   ```bash
   npm run dev
   ```

3. Open your browser and navigate to `http://localhost:5173`.

---

## 📖 Application Modules & User Guide

### 1. 🤟 SignBridge Video Call (`CallRoom.tsx`)
- Choose your mode: **DHH User** (Sign-to-Text & Speech) or **Hearing User** (Speech-to-Text).
- Create a new room or enter a Room ID to join a peer-to-peer session.
- Signs performed on camera are automatically translated and displayed as closed captions for both participants.

### 2. 📚 Interactive Sign Catalog (`LearnPage.tsx`)
- Explore 40+ ASL signs organized by categories: Alphabet, Numbers, Words, and Two-Handed signs.
- View step-by-step visual guides, hand position instructions, and usage tips.

### 3. 🎯 Practice Studio (`PracticePage.tsx`)
- Select target signs and practice in front of your camera.
- Receive instant feedback with skeleton tracking overlays, percentage match scores, and real-time validation.

### 4. ⚡ Gesture Lab (`GestureStudio.tsx`)
- Record personal hand gestures by capturing 21-point spatial landmark patterns.
- Test custom gesture recognition and inspect real-time landmark coordinates.

---

## 📡 WebRTC & Signaling Protocol

The signaling server (`server/index.js`) manages P2P WebRTC connection handshakes via Socket.IO events:

| Event Name | Type | Description |
| :--- | :--- | :--- |
| `create-or-join` | Client ➔ Server | Emitted when a user initiates or joins a video room |
| `created` / `joined` | Server ➔ Client | Confirms room creation or successful entry |
| `offer` / `answer` | Client ⇄ Client | Exchanges WebRTC SDP offer and answer session descriptions |
| `ice-candidate` | Client ⇄ Client | Relays ICE candidates for peer NAT traversal |
| `chat-message` | Client ⇄ Client | Fallback text messaging channel |

---

## 📁 Project Directory Structure

```
Sign-Language-platform/
├── public/                 # Static public assets
├── server/
│   └── index.js            # Node.js + Socket.IO WebRTC signaling server
├── src/
│   ├── assets/             # SVGs and UI graphics
│   ├── components/
│   │   ├── CallRoom.tsx          # WebRTC live video room & sign translation
│   │   ├── GestureStudio.tsx     # Custom gesture recording & testing lab
│   │   ├── LandingPage.tsx       # Main portal & mode selection interface
│   │   ├── LandmarkDebugger.tsx  # Canvas hand landmark skeleton renderer
│   │   ├── LearnPage.tsx         # Interactive ASL sign catalog & guide
│   │   ├── PracticePage.tsx      # Real-time practice mode with AI feedback
│   │   └── SignGuide.tsx         # Visual sign instructions modal component
│   ├── hooks/
│   │   ├── useMediaPipe.ts       # Custom React hook for MediaPipe camera processing
│   │   ├── useSpeechRecognition.ts# Web Speech API integration
│   │   └── useWebRTC.ts          # WebRTC connection & signaling hook
│   ├── ml/
│   │   └── signClassifier.ts     # 21-point hand spatial classifier & gesture engine
│   ├── App.tsx             # Root router & layout controller
│   ├── index.css           # Design tokens, variables & glassmorphism styling
│   └── main.tsx            # React application entry point
├── package.json            # Dependencies & npm scripts
├── tsconfig.json           # TypeScript configuration
└── vite.config.ts          # Vite build configuration
```

---

## ⚡ Available npm Scripts

| Script | Command | Purpose |
| :--- | :--- | :--- |
| `npm run dev` | `vite` | Starts local frontend development server at `http://localhost:5173` |
| `npm run server` | `node server/index.js` | Starts Node.js WebRTC signaling server at `http://localhost:3001` |
| `npm run build` | `vite build` | Compiles TypeScript and builds production distribution (`dist/`) |
| `npm run preview` | `vite preview` | Previews production build locally |

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

Distributed under the **MIT License**. See `LICENSE` for details.