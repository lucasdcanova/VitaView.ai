import { Capacitor } from "@capacitor/core";

export const isStandalonePwa = () => {
  if (typeof window === "undefined") return false;
  const navigatorWithStandalone = window.navigator as Navigator & { standalone?: boolean };

  return window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: fullscreen)").matches ||
    navigatorWithStandalone.standalone === true;
};

export const isNativeIOSApp = () => {
  if (typeof window === "undefined") return false;

  try {
    return Capacitor.isNativePlatform() && Capacitor.getPlatform() === "ios";
  } catch {
    return false;
  }
};

export const isNativeAndroidApp = () => {
  if (typeof window === "undefined") return false;

  try {
    return Capacitor.isNativePlatform() && Capacitor.getPlatform() === "android";
  } catch {
    return false;
  }
};

const isIOSDevice = () => {
  if (typeof window === "undefined") return false;

  const ua = window.navigator.userAgent || "";
  const platform = window.navigator.platform || "";
  const maxTouchPoints = window.navigator.maxTouchPoints || 0;

  return /iPad|iPhone|iPod/.test(ua) ||
    (platform === "MacIntel" && maxTouchPoints > 1);
};

export const isRestrictedAppShell = () => isStandalonePwa() || isNativeIOSApp() || isNativeAndroidApp();

export const isIOSAppShell = () =>
  isNativeIOSApp() || (isStandalonePwa() && isIOSDevice());

