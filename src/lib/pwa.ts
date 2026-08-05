// PWA Service Worker Registration & Installation Helper

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

let deferredInstallPrompt: BeforeInstallPromptEvent | null = null;
let installPromptListeners: Array<(canInstall: boolean) => void> = [];

export function registerServiceWorker() {
  if (typeof window === 'undefined') return;

  // Listen for Before Install Prompt event for Chrome/Android/Desktop
  window.addEventListener('beforeinstallprompt', (e: Event) => {
    e.preventDefault();
    deferredInstallPrompt = e as BeforeInstallPromptEvent;
    notifyInstallPromptListeners(true);
  });

  // Listen for App Installed event
  window.addEventListener('appinstalled', () => {
    console.log('[PWA] Application was successfully installed on home screen');
    deferredInstallPrompt = null;
    notifyInstallPromptListeners(false);
  });

  // Register Service Worker for offline capability
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          console.log('[SW] Service Worker registered successfully with scope:', reg.scope);
        })
        .catch((err) => {
          console.warn('[SW] Service Worker registration failed:', err);
        });
    });
  }
}

export function subscribeInstallPrompt(callback: (canInstall: boolean) => void) {
  installPromptListeners.push(callback);
  // Immediately notify with current status
  callback(deferredInstallPrompt !== null);

  return () => {
    installPromptListeners = installPromptListeners.filter((cb) => cb !== callback);
  };
}

function notifyInstallPromptListeners(canInstall: boolean) {
  installPromptListeners.forEach((cb) => cb(canInstall));
}

export async function promptPwaInstall(): Promise<boolean> {
  if (!deferredInstallPrompt) {
    return false;
  }

  try {
    await deferredInstallPrompt.prompt();
    const { outcome } = await deferredInstallPrompt.userChoice;
    deferredInstallPrompt = null;
    notifyInstallPromptListeners(false);
    return outcome === 'accepted';
  } catch (err) {
    console.error('[PWA] Error prompting installation:', err);
    return false;
  }
}

export function isStandaloneMode(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true ||
    document.referrer.includes('android-app://')
  );
}

export function isInIframe(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.self !== window.top;
  } catch (e) {
    return true;
  }
}

export function isIOSDevice(): boolean {
  if (typeof window === 'undefined') return false;
  const userAgent = window.navigator.userAgent.toLowerCase();
  return /iphone|ipad|ipod/.test(userAgent);
}
