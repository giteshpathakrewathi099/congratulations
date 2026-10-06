const AOS = 'https://unpkg.com/aos@2.3.1/dist/aos.js';
const CONFETTI =
  'https://cdn.jsdelivr.net/npm/canvas-confetti@1.6.0/dist/confetti.browser.min.js';
const HTML_TO_IMAGE =
  'https://cdn.jsdelivr.net/npm/html-to-image@1.11.13/dist/html-to-image.min.js';
const GIFSHOT =
  'https://cdnjs.cloudflare.com/ajax/libs/gifshot/0.3.2/gifshot.min.js';
const APP_SCRIPT = '/assets/js/script.js?v=' + Date.now();

const loadedScripts = new Set<string>();
let appScriptLoaded = false;

function loadScript(src: string): Promise<void> {
  if (loadedScripts.has(src)) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) {
      loadedScripts.add(src);
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = src;
    script.async = false;
    script.onload = () => {
      loadedScripts.add(src);
      resolve();
    };
    script.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.body.appendChild(script);
  });
}

export async function loadLegacyScripts(mode: 'create' | 'card'): Promise<void> {
  const parallel: Promise<void>[] = [loadScript(AOS)];
  if (mode === 'card') {
    parallel.push(loadScript(CONFETTI), loadScript(HTML_TO_IMAGE), loadScript(GIFSHOT));
  }
  await Promise.all(parallel);

  if (!appScriptLoaded) {
    await loadScript(APP_SCRIPT);
    appScriptLoaded = true;
  }
}

declare global {
  interface Window {
    __CARD_ID__?: string | null;
    runAppInitialization?: () => void;
  }
}

export function runLegacyAppInit(): void {
  window.runAppInitialization?.();
}
