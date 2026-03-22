const WINDOWS_DEFAULT_DOWNLOAD_URL =
  "https://github.com/lucasdcanova/VitaView.ai/releases/latest/download/VitaView-Setup.exe";

const MAC_DEFAULT_DOWNLOAD_URL =
  "https://github.com/lucasdcanova/VitaView.ai/releases/latest/download/VitaView-mac.dmg";

const APPLE_STORE_SEARCH_URL =
  "https://apps.apple.com/br/search?term=VitaView";

const GOOGLE_PLAY_SEARCH_URL =
  "https://play.google.com/store/search?q=VitaView&c=apps";

const VITAVIEW_WEB_APP_URL = "https://vitaview.ai/auth";

export const platformDownloadLinks = {
  windows: {
    href: import.meta.env.VITE_WINDOWS_DOWNLOAD_URL || WINDOWS_DEFAULT_DOWNLOAD_URL,
    isDirect: true,
  },
  mac: {
    href: import.meta.env.VITE_MAC_DOWNLOAD_URL || MAC_DEFAULT_DOWNLOAD_URL,
    isDirect: true,
  },
  ios: {
    href: import.meta.env.VITE_IOS_APP_STORE_URL || APPLE_STORE_SEARCH_URL,
    isDirect: Boolean(import.meta.env.VITE_IOS_APP_STORE_URL),
  },
  ipad: {
    href: import.meta.env.VITE_IPAD_APP_STORE_URL || APPLE_STORE_SEARCH_URL,
    isDirect: Boolean(import.meta.env.VITE_IPAD_APP_STORE_URL),
  },
  android: {
    href: import.meta.env.VITE_ANDROID_STORE_URL || GOOGLE_PLAY_SEARCH_URL,
    isDirect: Boolean(import.meta.env.VITE_ANDROID_STORE_URL),
  },
  web: {
    href: import.meta.env.VITE_PUBLIC_APP_URL || VITAVIEW_WEB_APP_URL,
  },
};
