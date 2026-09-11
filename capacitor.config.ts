import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.squatchcrossing.game',
  appName: 'Squatch Crossing',
  webDir: 'dist',
  backgroundColor: '#18382f',
  android: {
    backgroundColor: '#18382f',
    allowMixedContent: false
  }
};

export default config;
