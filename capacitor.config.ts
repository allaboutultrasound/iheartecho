import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.allaboutultrasound.iheartecho',
  appName: 'iHeartEcho',
  webDir: 'dist/public',

  // When running in production, the app loads from the bundled web assets.
  // For development/testing against your live server, uncomment the server block below:
  // server: {
  //   url: 'https://app.iheartecho.com',
  //   cleartext: false,
  // },

  plugins: {
    SplashScreen: {
      launchShowDuration: 2500,
      launchAutoHide: true,
      backgroundColor: '#0e1e2e',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      style: 'DARK',          // dark icons on light background
      backgroundColor: '#189aa1',
    },
    Keyboard: {
      resize: 'body',
      style: 'DARK',
      resizeOnFullScreen: true,
    },
  },

  ios: {
    contentInset: 'automatic',
    allowsLinkPreview: false,
    scrollEnabled: true,
    backgroundColor: '#ffffff',
    // Minimum iOS version: 16.0 (required by Capacitor 6+)
  },

  android: {
    backgroundColor: '#ffffff',
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false, // set true only for dev builds
    // Minimum SDK: 23 (Android 6.0)
  },
};

export default config;
