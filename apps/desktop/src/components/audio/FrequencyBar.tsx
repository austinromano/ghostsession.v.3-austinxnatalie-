import { useRef, useEffect } from 'react';
import { getAnalyser } from '../../stores/audioStore';

export default function FrequencyBar({ seekBarRef, progress, isPlaying, onSeekClick, onSeekDrag, onSeekEnd, children }: {
  seekBarRef: React.RefObject<HTMLDivElement>;
  progress: number;
  isPlaying: boolean;
  onSeekClick: (e: React.MouseEvent<HTMLDivElement>) => void;
  onSeekDrag: (e: React.MouseEvent<HTMLDivElement>) => void;
  onSeekEnd: () => void;
  children?: React.ReactNode;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const prevData = useRef<Float32Array | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let running = true;
    const BAR_COUNT = 128;
    if (!prevData.current) prevData.current = new Float32Array(BAR_COUNT);

    const draw = () => {
      if (!running) return;
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      const dpr = window.devicePixelRatio || 2;
      if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
        canvas.width = w * dpr;
        canvas.height = h * dpr;
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      const midY = h / 2;
      const analyser = getAnalyser();
      const smoothed = prevData.current!;

      if (analyser && isPlaying) {
        const bufLen = analyser.frequencyBinCount;
        const raw = new Uint8Array(bufLen);
        analyser.getByteFrequencyData(raw);

        for (let i = 0; i < BAR_COUNT; i++) {
          const idx = Math.floor(i * bufLen / BAR_COUNT);
          const target = raw[idx] / 255;
          smoothed[i] += (target - smoothed[i]) * (target > smoothed[i] ? 0.4 : 0.08);
        }
      } else {
        for (let i = 0; i < BAR_COUNT; i++) {
          smoothed[i] *= 0.92;
        }
      }

      const HALF = BAR_COUNT / 2;
      const gap = 1;
      const barW = Math.max(1, (w - gap * BAR_COUNT) / BAR_COUNT);

      for (let i = 0; i < BAR_COUNT; i++) {
        const freqIdx = i < HALF ? i : (BAR_COUNT - 1 - i);
        const val = smoothed[freqIdx];
        const barH = val * midY * 0.9;
        const x = i * (barW + gap);

        const ratio = freqIdx / HALF;
        let r: number, g: number, b: number;
        if (ratio < 0.33) {
          const t = ratio / 0.33;
          r = Math.round(0 + 124 * t);
          g = Math.round(255 - 197 * t);
          b = Math.round(200 + 37 * t);
        } else if (ratio < 0.66) {
          const t = (ratio - 0.33) / 0.33;
          r = Math.round(124 + 112 * t);
          g = Math.round(58 - 18 * t);
          b = Math.round(237 - 80 * t);
        } else {
          const t = (ratio - 0.66) / 0.34;
          r = Math.round(236 + 19 * t);
          g = Math.round(40 + 26 * t);
          b = Math.round(157 + 98 * t);
        }

        const alpha = 0.5 + val * 0.5;

        const grad = ctx.createLinearGradient(x, midY, x, midY - barH);
        grad.addColorStop(0, `rgba(${r},${g},${b},${alpha * 0.2})`);
        grad.addColorStop(0.5, `rgba(${r},${g},${b},${alpha})`);
        grad.addColorStop(1, `rgba(${r},${g},${b},${alpha * 0.8})`);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.roundRect(x, midY - barH, barW, barH, [2, 2, 0, 0]);
        ctx.fill();

        const grad2 = ctx.createLinearGradient(x, midY, x, midY + barH);
        grad2.addColorStop(0, `rgba(${r},${g},${b},${alpha * 0.15})`);
        grad2.addColorStop(1, `rgba(${r},${g},${b},0)`);
        ctx.fillStyle = grad2;
        ctx.beginPath();
        ctx.roundRect(x, midY, barW, barH * 0.6, [0, 0, 2, 2]);
        ctx.fill();

        if (val > 0.7) {
          ctx.shadowColor = `rgba(${r},${g},${b},${(val - 0.7) * 2})`;
          ctx.shadowBlur = 8;
          ctx.fillStyle = `rgba(${r},${g},${b},${(val - 0.7) * 0.6})`;
          ctx.fillRect(x, midY - barH, barW, 2);
          ctx.shadowBlur = 0;
        }
      }

      ctx.fillStyle = 'rgba(255,255,255,0.04)';
      ctx.fillRect(0, midY - 0.5, w, 1);

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      animRef.current = requestAnimationFrame(draw);
    };

    animRef.current = requestAnimationFrame(draw);
    return () => { running = false; cancelAnimationFrame(animRef.current); };
  }, [isPlaying, progress]);

  return (
    <div
      ref={seekBarRef}
      className="w-full h-16 cursor-pointer relative group"
      style={{ background: 'rgba(6,2,14,0.95)', borderTop: '1px solid rgba(255,255,255,0.06)' }}
      onMouseDown={onSeekClick}
      onMouseMove={onSeekDrag}
      onMouseUp={onSeekEnd}
      onMouseLeave={onSeekEnd}
    >
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none z-[1]" />
      <div className="absolute inset-y-0 left-0 pointer-events-none z-[2]" style={{ width: `${progress}%`, background: 'linear-gradient(90deg, rgba(0,255,200,0.03), rgba(124,58,237,0.06))' }} />
      <div className="absolute top-0 bottom-0 w-0.5 pointer-events-none z-[3]" style={{ left: `${progress}%`, background: 'rgba(255,255,255,0.9)', boxShadow: '0 0 8px rgba(0,255,200,0.5), 0 0 2px rgba(255,255,255,0.8)' }} />
      <div className="absolute inset-0 z-[4]">{children}</div>
    </div>
  );
}
