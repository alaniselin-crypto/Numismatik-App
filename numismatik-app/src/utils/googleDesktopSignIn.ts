import { registerPlugin } from '@capacitor/core';

interface GoogleDesktopSignInPlugin {
  signIn(): Promise<{ idToken: string; accessToken?: string | null }>;
}

export const GoogleDesktopSignIn = registerPlugin<GoogleDesktopSignInPlugin>('GoogleDesktopSignIn');
