import type { CapacitorConfig } from '@capacitor/cli';

const capacitorServerUrl = process.env.CAPACITOR_SERVER_URL || 'https://vitaview.ai/auth';

const config: CapacitorConfig = {
  appId: 'br.com.lucascanova.vitaview',
  appName: 'VitaView',
  webDir: 'dist/public',
  ios: {
    // Make WKWebView layout behavior explicit on iPhone to avoid unwanted page scaling/insets.
    zoomEnabled: false,
    contentInset: 'never',
    scrollEnabled: true,
  },
  android: {
    // Ensure consistent background color for Android WebView.
    backgroundColor: '#FFFFFF',
  },
  server: {
    // iOS app login depends on same-origin cookies; loading the production auth route
    // avoids capacitor://localhost -> /api requests that cannot reach the backend.
    url: capacitorServerUrl,
    cleartext: capacitorServerUrl.startsWith('http://'),
    allowNavigation: ['vitaview.ai', '*.vitaview.ai'],
  },
};

export default config;
