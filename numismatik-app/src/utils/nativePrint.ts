import { registerPlugin } from '@capacitor/core';

interface NativePrintPlugin {
  print(options: { html: string; jobName: string }): Promise<void>;
}

export const NativePrint = registerPlugin<NativePrintPlugin>('NativePrint');
