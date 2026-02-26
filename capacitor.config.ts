import type { CapacitorConfig } from '@capacitor/cli';

const capacitorServerUrl = process.env.CAPACITOR_SERVER_URL || 'https://vitaview.ai';

const config: CapacitorConfig = {
  appId: 'br.com.lucascanova.vitaview',
  appName: 'VitaView',
  webDir: 'dist/public',
  server: {
    // iOS app login depends on same-origin cookies; loading the production web app
    // avoids capacitor://localhost -> /api requests that cannot reach the backend.
    url: capacitorServerUrl,
    cleartext: capacitorServerUrl.startsWith('http://'),
    allowNavigation: ['vitaview.ai', '*.vitaview.ai'],
  },
};

export default config;
