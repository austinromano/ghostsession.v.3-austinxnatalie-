// Detect the host environment: JUCE plugin WebView, Tauri desktop, or browser

const params = new URLSearchParams(window.location.search);

export const isPlugin = params.get('mode') === 'plugin'
  || navigator.userAgent.includes('GhostSession');

export const isTauri = '__TAURI__' in window;

export const isBrowser = !isPlugin && !isTauri;
