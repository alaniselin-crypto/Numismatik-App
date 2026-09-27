import type { CapacitorConfig } from '@capacitor/cli';
import firebaseConfig from './firebase-applet-config.json';

const iosGoogleClientId = '211237775065-86r14bsi0as6u0an1gqf7c48dv7chr1g.apps.googleusercontent.com';

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
      googleClientId: iosGoogleClientId,
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
