# Jiya Music - Standalone Android Studio Project

This directory contains a complete, ready-to-open **Android Studio Project** that wraps your live Jiya Music Web Application (`https://jiya-kappa.vercel.app`) into a native Android app without touching or modifying your web codebase.

---

## 🚀 How to Open & Build in Android Studio

1. **Open Android Studio**.
2. Click **Open An Existing Project** (or **File -> Open...**).
3. Select the folder:
   ```text
   e:\my projects\music appp\android-app
   ```
4. Wait for Gradle Sync to complete.
5. Go to **Build -> Build Bundle(s) / APK(s) -> Build APK(s)**.
6. Your `.apk` file will be generated in:
   ```text
   e:\my projects\music appp\android-app\app\build\outputs\apk\debug\app-debug.apk
   ```

---

## ⚡ Features Configured in Native MainActivity.java
- **DOM Storage & Cookies Enabled**: `webSettings.setDomStorageEnabled(true)`
- **Autoplay Gesture Exemption**: `webSettings.setMediaPlaybackRequiresUserGesture(false)`
- **Mixed Content Allowed**: `webSettings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW)`
- **Hardware Acceleration**: Enabled for smooth glassmorphic UI & 60fps animations
- **Hardware Back Button Handler**: Supported (`onBackPressed()` navigates history before exiting)
