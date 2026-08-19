# 🤟 SignBridge — AI-Powered Real-Time Sign Language Platform

[![React](https://img.shields.io/badge/React-19.2-blue.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0-blue.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8.2-purple.svg)](https://vitejs.dev/)
[![MediaPipe](https://img.shields.io/badge/MediaPipe-Hands-orange.svg)](https://developers.google.com/mediapipe)
[![WebRTC](https://img.shields.io/badge/WebRTC-PeerToPeer-green.svg)](https://webrtc.org/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

**SignBridge** is a privacy-first, real-time AI sign language translation and communication platform. It bridges the communication gap between Deaf / Hard of Hearing (DHH) individuals and hearing individuals through live WebRTC video calls, interactive ASL learning modules, AI-assisted practice studios, and custom gesture recognition.

---

## ✨ Key Features

- 🖐️ **Real-Time 21-Point Hand Landmark Detection**: Powered by MediaPipe Hands for high-precision, zero-latency hand tracking directly inside the browser.
- 🧠 **AI Sign Language Classifier**: Custom geometry engine calculating 3D finger curl angles, landmark spread, hand orientation, and motion trajectories (waving, circles, swipes).
- 📚 **Comprehensive 40+ Sign Catalog**: Includes the full ASL Alphabet (A–Z), numbers (1–5), greetings, responses, and complex two-handed signs (`HELP`, `BOOK`, `MORE`, `TOGETHER`, `CLAP`).
- 🎥 **WebRTC Video Calls with Sign Translation**: Connect DHH and Hearing users in peer-to-peer video rooms with instant closed-captioning, text fallback, and text-to-speech synthesis.
- 🎯 **Interactive AI Practice Studio**: Live feedback mode with visual landmark debugging, accuracy target scoring, and step-by-step guidance.
- ⚡ **Gesture Lab & Custom Gesture Recorder**: Record custom personal hand gestures and save templates locally for instant recognition.
- 🔒 **Privacy-First Architecture**: 100% on-device AI inference — video streams are processed locally and never sent to external servers.

---

## 🛠️ Tech Stack & Architecture

### **Frontend & Interface**
- **Framework**: React 19 + TypeScript 6
- **Build Tool**: Vite 8.2
- **Styling**: Modern Vanilla CSS Design Tokens (Glassmorphism, Vibrant Dark Mode, Micro-animations)

### **Computer Vision & Machine Learning**
- **Hand Tracking**: `@mediapipe/hands` & `@mediapipe/camera_utils`
- **Classification Engine**: Custom 3D Landmark Geometry & Vector Math Engine (`src/ml/signClassifier.ts`)
- **Temporal Buffer**: Multi-frame confidence smoothing buffer (`SignBuffer`) to eliminate gesture flickering

### **Real-Time Communication**
- **Video & Data Streaming**: WebRTC PeerConnection & DataChannels
- **Signaling Server**: Node.js + Socket.IO server (`server/index.js`)
- **Audio & Speech Integration**: Web Speech API (`SpeechSynthesis` & `SpeechRecognition`)

---

## 📁 Directory Structure

```
Sign-Language-platform/
├── public/                 # Static assets & icons
├── server/
│   └── index.js            # Node.js + Socket.IO WebRTC signaling server
├── src/
│   ├── assets/             # Images and SVG graphics
│   ├── components/
│   │   ├── CallRoom.tsx          # WebRTC live video call with sign translation
│   │   ├── GestureStudio.tsx     # Custom gesture recording & motion lab
│   │   ├── LandingPage.tsx       # Main portal & mode selection
│   │   ├── LandmarkDebugger.tsx  # Canvas hand skeleton renderer
│   │   ├── LearnPage.tsx         # Interactive ASL sign catalog & guides
│   │   ├── PracticePage.tsx      # Real-time practice with AI feedback
│   │   └── SignGuide.tsx         # Visual sign instructions modal
│   ├── hooks/
│   │   ├── useMediaPipe.ts       # React hook for MediaPipe camera & processing
│   │   ├── useSpeechRecognition.ts# Web Speech API speech-to-text
│   │   └── useWebRTC.ts          # WebRTC peer connection manager
│   ├── ml/
│   │   └── signClassifier.ts     # 21-point hand classification & motion engine
│   ├── App.tsx             # Application router & layout controller
│   ├── index.css           # Global CSS variables, tokens & glassmorphism system
│   └── main.tsx            # Application entry point
├── package.json            # Project dependencies and npm scripts
├── tsconfig.json           # TypeScript configuration
└── vite.config.ts          # Vite build & dev server config
```

---

## 🚀 Getting Started

### Prerequisites

Ensure you have **Node.js** (v18.0.0 or higher) installed on your machine.

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

### Running Locally

To run the complete application (Signaling Server + Frontend):

1. **Start the WebRTC Signaling Server** (runs on port 3001):
   ```bash
   npm run server
   ```

2. **Start the Vite Frontend Server** (in a second terminal):
   ```bash
   npm run dev
   ```

3. Open your browser and navigate to:
   ```
   http://localhost:5173
   ```

---

## 📖 How to Use

### 1. Live Video Call (`SignBridge Call`)
- Enter your name and select your communication mode (**🤟 DHH User** or **🔊 Hearing User**).
- Click **✨ Create New Room** or join an existing room with a room code.
- DHH users can sign into the webcam to auto-generate speech/captions for hearing users.
- Hearing users can speak into their microphone to display real-time captions for DHH users.

### 2. Learn Signs (`📚 Learn Signs`)
- Browse over 40+ signs categorized by Alphabet (A-Z), Numbers (1-5), Words, Greetings, and Two-Handed signs.
- Click any sign card to inspect hand positions, finger patterns, and step-by-step tips.

### 3. Practice Studio (`🎯 Practice Studio`)
- Select a target sign to practice.
- Position your hand in front of the camera and receive real-time match confidence scores, landmark visual overlays, and instant visual validation.

### 4. Gesture Lab (`⚡ Gesture Lab`)
- Record personal custom hand gestures by saving 21-point landmark templates.
- Test real-time dynamic motion tracking for gestures like waving, swiping, and circular movements.

---

## 🤝 Contributing

Contributions are welcome! If you'd like to improve the sign classification engine, add new ASL signs, or enhance the UI:

1. Fork the project repository.
2. Create your feature branch (`git checkout -b feature/AmazingFeature`).
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4. Push to the branch (`git push origin feature/AmazingFeature`).
5. Open a Pull Request.

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.