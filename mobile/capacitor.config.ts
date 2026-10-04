import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'uz.myschool.app',
  appName: 'MySchool',
  webDir: 'www',
  android: {
    allowMixedContent: false
  }
};

export default config;
