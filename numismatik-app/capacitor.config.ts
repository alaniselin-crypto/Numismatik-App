import type { CapacitorConfig } from '@capacitor/cli';
import firebaseConfig from './firebase-applet-config.json';

const config = {
  appId: 'com.alaniselin.numisma.test',
  appName: 'Numismatik',
  webDir: 'dist-ios',
  server: {
    iosScheme: 'https',
  },
  plugins: {
    FirebaseAuthentication: {
      skipNativeAuth: true,
      providers: ['apple.com', 'google.com'],
      authDomain: firebaseConfig.authDomain,
      googleClientId: firebaseConfig.oAuthClientId,
    },
  },
  experimental: {
    ios: {
      spm: {
        packageOptions: {
          '@capacitor-firebase/authentication': {
            symlink: true,
          },
        },
      },
    },
  },
} as CapacitorConfig;

export default config;
