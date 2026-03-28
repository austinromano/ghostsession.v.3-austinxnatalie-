import { useState, useRef, useEffect } from 'react';
import { useAudioStore } from '../../stores/audioStore';
import { api } from '../../lib/api';
import { audioBufferCache } from '../../lib/audio';
import StemRow from '../tracks/StemRow';

export function TrackWithWidth({ track, selectedProjectId, deleteTrack, updateTrack, trackZoom, fetchProject }: { track: any; selectedProjectId: string; deleteTrack: any; updateTrack: any; trackZoom: 'full' | 'half'; fetchProject: any }) {
  const trackBuffer = useAudioStore((s) => s.loadedTracks.get(track.id)?.buffer);
  const maxDur = useAudioStore((s) => s.duration);
  const bufferVersion = useAudioStore((s) => s.bufferVersion);
  const trackDur = trackBuffer?.duration || 0;
  const widthPct = maxDur > 0 && trackDur > 0 ? (trackDur / maxDur) * 100 : 100;

  return (
    <StemRow
      key={`${track.id}-${bufferVersion}`}
      trackId={track.id}
      name={track.name || track.fileName || 'Track'}
      type={track.type || 'audio'}
      fileId={track.fileId}
      projectId={selectedProjectId}
      createdAt={track.createdAt}
      onDelete={() => { useAudioStore.getState().removeTrack(track.id); deleteTrack(selectedProjectId, track.id); }}
      onRename={(newName) => updateTrack(selectedProjectId, track.id, { name: newName })}
      compact={trackZoom === 'half'}
      widthPercent={widthPct}
    />
  );
}

export function ArrangementDropZone({ projectId, onFilesAdded, children }: { projectId: string; onFilesAdded: () => void; children: React.ReactNode }) {
  const [dragOver, setDragOver] = useState(false);

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const droppedFiles = Array.from(e.dataTransfer.files).filter((f) =>
      f.type.startsWith('audio/') || f.name.match(/\.(wav|mp3|flac|aiff|ogg|m4a|aac)$/i)
    );
    if (droppedFiles.length === 0) return;
    for (const file of droppedFiles) {
      const { fileId } = await api.uploadFile(projectId, file);
      const trackName = file.name.replace(/\.[^.]+$/, '');
      await api.addTrack(projectId, { name: trackName, type: 'fullmix', fileId, fileName: file.name } as any);
    }
    onFilesAdded();
  };

  return (
    <div
      className={`relative transition-all ${dragOver ? 'ring-2 ring-ghost-green/50 ring-inset' : ''}`}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
    >
      {children}
      {dragOver && (
        <div className="absolute inset-0 bg-ghost-green/5 pointer-events-none z-30 rounded-xl" />
      )}
    </div>
  );
}

export function BarRuler() {
  const { duration, projectBpm, seekTo } = useAudioStore();
  const rulerRef = useRef<HTMLDivElement>(null);
  const [rulerWidth, setRulerWidth] = useState(800);

  const bpm = projectBpm > 0 ? projectBpm : 120;
  const secondsPerBar = (60 / bpm) * 4;
  const totalBars = duration > 0 ? Math.max(8, Math.ceil(duration / secondsPerBar)) : 8;

  useEffect(() => {
    if (!rulerRef.current) return;
    const obs = new ResizeObserver((entries) => {
      for (const e of entries) setRulerWidth(e.contentRect.width);
    });
    obs.observe(rulerRef.current);
    return () => obs.disconnect();
  }, []);

  const pxPerBar = rulerWidth / totalBars;
  const minPxPerLabel = 28;
  let labelEvery = 1;
  for (const step of [1, 2, 4, 8, 16, 32, 64]) {
    if (pxPerBar * step >= minPxPerLabel) { labelEvery = step; break; }
  }

  const handleClick = (e: React.MouseEvent) => {
    if (!rulerRef.current || duration <= 0) return;
    const rect = rulerRef.current.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    seekTo(pct * duration);
  };

  return (
    <div
      ref={rulerRef}
      className="h-7 flex relative cursor-pointer select-none shrink-0 sticky top-0 z-30"
      style={{ background: 'rgba(10,4,18,0.95)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}
      onClick={handleClick}
    >
      {Array.from({ length: totalBars }).map((_, i) => {
        const leftPct = duration > 0 ? (i * secondsPerBar / duration) * 100 : (i / totalBars) * 100;
        const showLabel = i % labelEvery === 0;
        return (
          <div key={i} className="absolute top-0 bottom-0" style={{ left: `${leftPct}%` }}>
            <div className={`absolute top-0 w-px ${showLabel ? 'bottom-0 bg-white/[0.12]' : 'h-2 bg-white/[0.06]'}`} />
            {showLabel && (
              <span className="text-[9px] font-mono text-white/35 pl-1 leading-7 select-none whitespace-nowrap">{i + 1}</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function BarGridOverlay() {
  const { duration, projectBpm } = useAudioStore();
  const bpm = projectBpm > 0 ? projectBpm : 120;
  const secondsPerBar = (60 / bpm) * 4;
  const totalBars = duration > 0 ? Math.max(8, Math.ceil(duration / secondsPerBar)) : 8;

  if (totalBars === 0) return null;

  return (
    <div className="absolute inset-0 pointer-events-none z-10">
      {Array.from({ length: totalBars }).map((_, i) => {
        const leftPct = (i * secondsPerBar / duration) * 100;
        return (
          <div key={i} className="absolute top-0 bottom-0 w-px bg-white/[0.06]" style={{ left: `${leftPct}%` }} />
        );
      })}
    </div>
  );
}

export function ArrangementPlayhead() {
  const { currentTime, duration, isPlaying } = useAudioStore();
  const playheadRef = useRef<HTMLDivElement>(null);

  const pct = duration > 0 ? (currentTime / duration) * 100 : 0;

  if (!isPlaying && currentTime === 0) return null;

  return (
    <div
      ref={playheadRef}
      className="absolute top-0 bottom-0 w-[2px] pointer-events-none z-20"
      style={{
        left: `${Math.min(pct, 100)}%`,
        background: 'rgba(255,255,255,0.8)',
        boxShadow: '0 0 6px rgba(255,255,255,0.4), 0 0 12px rgba(255,255,255,0.1)',
      }}
    >
      <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-white" style={{ boxShadow: '0 0 4px rgba(255,255,255,0.6)' }} />
    </div>
  );
}
