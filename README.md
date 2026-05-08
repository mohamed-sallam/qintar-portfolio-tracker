<div align="center">
  <h1>Qintar (قنطار)</h1>
  <p>A Local-First, Privacy-Focused Asset Portfolio Tracker</p>
</div>

---

## 🌟 Overview

**Qintar** is a cross-platform (Web & Android) asset portfolio tracking application built with React, Vite, and Capacitor. It allows users to track their investments across multiple asset classes (Gold, Silver, Crypto, Fiat, Stocks) securely on their own devices.

Qintar embraces a **local-first** philosophy using `dexie.js` for IndexedDB storage. Your financial data never leaves your device unless you explicitly configure a sync.

### Key Features
- **Dynamic Theming System:** Switch between multiple distinct visual themes (Arctic, Obsidian, Emerald Vault, Rose Quartz, Solar Flare).
- **Plugin-Driven Architecture:** Fetch live prices via sandboxed JavaScript plugins.
- **Cross-Platform Compatibility:** Runs seamlessly as a PWA in the browser or as a native Android app bypassing CORS via `CapacitorHttp`.
- **Complete Privacy:** All data, including API keys and portfolio history, is stored locally.

---

## 🛠️ Tech Stack

- **Framework:** React 18 + Vite
- **Styling:** Tailwind CSS + Vanilla CSS (Dynamic Variables)
- **Database:** Dexie.js (IndexedDB wrapper)
- **Native Wrapper:** Capacitor (`@capacitor/core`, `@capacitor/android`)
- **Icons:** Lucide React

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- Android Studio (for Android deployment)

### Installation & Web Run
1. Clone the repository and install dependencies:
   ```bash
   npm install
   ```
2. Run the local development server:
   ```bash
   npm run dev
   ```

### Android Build
1. Build the web assets:
   ```bash
   npm run build
   ```
2. Sync with Capacitor:
   ```bash
   npx cap sync android
   ```
3. Open in Android Studio to build and deploy:
   ```bash
   npx cap open android
   ```

---

## 🧩 Plugins

Qintar uses a modular plugin system to fetch live prices. You can install plugins directly from external GitHub Pages repositories.

For more information on how to build your own plugins, please read the [Plugin SDK Documentation](./PLUGIN_SDK.md).

---

<div align="center">
  <p>Designed and built by <strong>Mohamed Sallam</strong></p>
</div>
