# Background Playback with Media3

This plan upgrades the app's audio engine to use **Jetpack Media3 (ExoPlayer)** and moves all playback logic into a **Foreground Service**. This ensures music continues playing even when the app is in the background or the screen is off.

## Proposed Changes

### Build Configuration
#### [MODIFY] [app/build.gradle](file:///E:/my%20projects/music%20appp/android-app/app/build.gradle)
- Add Media3 dependencies (`exoplayer` and `session`).

### Android Manifest
#### [MODIFY] [AndroidManifest.xml](file:///E:/my%20projects/music%20appp/android-app/app/src/main/AndroidManifest.xml)
- Update `<service>` declaration to use the new `PlaybackService`.
- Ensure required permissions are present.

### Media Engine
#### [NEW] [PlaybackService.java](file:///E:/my%20projects/music%20appp/android-app/app/src/main/java/com/jiya/music/PlaybackService.java)
- Implement `MediaSessionService`.
- Manage `ExoPlayer` instance.
- Handle playback state and notifications automatically via Media3.

#### [DELETE] [AudioService.java](file:///E:/my%20projects/music%20appp/android-app/app/src/main/java/com/jiya/music/AudioService.java)
- Replace with `PlaybackService`.

### UI Integration
#### [MODIFY] [MainActivity.java](file:///E:/my%20projects/music%20appp/android-app/app/src/main/java/com/jiya/music/MainActivity.java)
- Remove `MediaPlayer` logic.
- Initialize `MediaController` to communicate with `PlaybackService`.
- Update `WebAppNativeInterface` to control playback through the `MediaController`.

## Verification Plan

### Automated Tests
- Build the project to ensure dependencies are resolved.

### Manual Verification
1. Launch the app and start playing a song.
2. Minimize the app. Music should continue.
3. Turn off the screen. Music should continue.
4. Verify playback controls in the notification area.
