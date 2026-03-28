import { api } from './api';
import { API_BASE } from './constants';

// Shared audio caches — used by Waveform, StemRow, TransportBar
export const rawDataCache = new Map<string, Float32Array>();
export const audioBufferCache = new Map<string, AudioBuffer>();
const downloadPromises = new Map<string, Promise<ArrayBuffer>>();

export function debugLog(msg: string) {
  fetch(`${API_BASE}/debug`, { method: 'POST', body: msg }).catch(() => {});
}

export function getAudioData(projectId: string, fileId: string): Promise<{ buffer: AudioBuffer; channelData: Float32Array }> {
  debugLog('getAudioData called: ' + fileId);

  if (audioBufferCache.has(fileId)) {
    debugLog('cache hit: ' + fileId);
    const buffer = audioBufferCache.get(fileId)!;
    const channelData = rawDataCache.get(fileId) || buffer.getChannelData(0);
    return Promise.resolve({ buffer, channelData });
  }

  let downloadPromise = downloadPromises.get(fileId);
  if (!downloadPromise) {
    debugLog('starting download: ' + fileId);
    downloadPromise = api.downloadFile(projectId, fileId);
    downloadPromises.set(fileId, downloadPromise);
  } else {
    debugLog('reusing download: ' + fileId);
  }

  return downloadPromise.then((buf) => {
    debugLog('download done: ' + fileId + ' size=' + buf.byteLength);
    if (audioBufferCache.has(fileId)) {
      debugLog('another caller already decoded: ' + fileId);
      const buffer = audioBufferCache.get(fileId)!;
      return { buffer, channelData: rawDataCache.get(fileId) || buffer.getChannelData(0) };
    }
    debugLog('decoding: ' + fileId);
    const ctx = new AudioContext();
    return ctx.decodeAudioData(buf.slice(0)).then((decoded) => {
      ctx.close();
      debugLog('decode SUCCESS: ' + fileId + ' duration=' + decoded.duration);
      audioBufferCache.set(fileId, decoded);
      const channelData = decoded.getChannelData(0);
      rawDataCache.set(fileId, channelData);
      downloadPromises.delete(fileId);
      return { buffer: decoded, channelData };
    }).catch((err) => {
      ctx.close();
      debugLog('decode FAILED: ' + fileId + ' err=' + err.message);
      throw err;
    });
  }).catch((err) => {
    debugLog('getAudioData FAILED: ' + fileId + ' err=' + err.message);
    throw err;
  });
}

export function formatDate(dateStr?: string | null): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined });
}

export function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function detectBpmFromName(name: string): number {
  const patterns = [
    /[_\-\s](\d{2,3})\s*bpm/i,
    /bpm\s*[_\-\s]*(\d{2,3})/i,
    /[_\-](\d{2,3})[_\-]/,
    /^(\d{2,3})[_\-]/,
  ];
  for (const pat of patterns) {
    const match = name.match(pat);
    if (match) {
      const val = parseInt(match[1]);
      if (val >= 60 && val <= 250) return val;
    }
  }
  return 0;
}
