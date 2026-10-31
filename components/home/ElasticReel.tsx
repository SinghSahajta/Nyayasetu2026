'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';

export interface ReelItem { src: string; alt: string; title: string; subtitle?: string; focus?: number }

interface Props {
  items: ReelItem[];
  barWidth?: number;   // px at rest
  gap?: number;
  magnify?: number;    // width multiplier under the pointer
  lift?: number;       // height multiplier under the pointer
  influence?: number;  // px over which neighbours magnify
  radius?: number;
  height?: number;     // component height in px
  barHeight?: number;  // slice height at rest, as a fraction of height
  sweep?: boolean;     // idle: glide a magnifying focus back and forth (off = slices rest until hovered)
  onOpenChange?: (index: number) => void; // -1 when closed
  ariaLabel?: string;
}

// Exponential easing, no overshoot: slices glide to their size instead of springing.
const EASE = 0.085;
const POINTER_EASE = 0.07; // the pointer itself is smoothed too, so quick mouse moves never make slices jump
const falloff = (d: number, influence: number) => (d >= influence ? 0 : (Math.cos((Math.PI * d) / influence) + 1) / 2);

/**
 * A dock of photo slices. The slice under the pointer swells (and so do its neighbours);
 * click one to open the full photo while the others blur and dim. Keyboard: Tab to a slice, Enter opens, Esc closes.
 */
export default function ElasticReel({ items, barWidth = 44, gap = 10, magnify = 2.4, lift = 1.15, influence = 200, radius = 12, height = 460, barHeight = 0.5, sweep = false, onOpenChange, ariaLabel = 'Photos of common civic problems. Hover to magnify, click to open.' }: Props) {
  const root = useRef<HTMLDivElement>(null);
  const bars = useRef<(HTMLButtonElement | null)[]>([]);
  const state = useRef({ px: null as number | null, spx: null as number | null, hovering: false, open: -1, hoverIdx: -1 });
  const motion = useRef(items.map(() => ({ w: 0, h: 0, y: 0, blur: 0, dim: 0 })));
  const [open, setOpen] = useState(-1);
  const [label, setLabel] = useState<number>(-1);
  const reduced = useRef(false);

  const setOpenIdx = useCallback((i: number) => { state.current.open = i; setOpen(i); onOpenChange?.(i); }, [onOpenChange]);

  useEffect(() => {
    reduced.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const el = root.current!;
    let raf = 0;
    const start = performance.now();

    const frame = (now: number) => {
      const W = el.clientWidth;
      const s = state.current;
      const n = items.length;
      const bw = Math.min(barWidth, (W - gap * (n - 1)) / n);
      const isOpen = s.open >= 0;
      const baseH = isOpen ? 64 : height * barHeight;
      // Rest-layout centres decide how strongly each slice reacts to the pointer.
      const restTotal = n * bw + (n - 1) * gap;
      const restLeft = (W - restTotal) / 2;
      // Where the magnifying focus is: the (smoothed) pointer, an idle sweep, or nowhere (all slices at rest).
      let want: number | null = s.hovering ? s.px : null;
      if (want == null && sweep && !reduced.current && !isOpen) want = W / 2 + Math.sin(((now - start) / 1000) * 0.35) * (restTotal / 2);
      if (want != null) s.spx = s.spx == null ? want : s.spx + (want - s.spx) * POINTER_EASE;
      const px = want == null ? null : s.spx;
      const targets = items.map((_, i) => {
        const c = restLeft + i * (bw + gap) + bw / 2;
        const f = px == null || (isOpen && i !== s.hoverIdx) ? 0 : falloff(Math.abs(px - c), influence);
        return { f, w: bw * (1 + (magnify - 1) * f), h: baseH * (1 + (lift - 1) * f) };
      });
      // Never let the magnified row spill past the edges: squeeze every slice evenly if it would.
      const widthSum = targets.reduce((a, t) => a + t.w, 0);
      const fit = Math.min(1, (W - 32 - gap * (n - 1)) / widthSum);
      targets.forEach((t) => { t.w *= fit; });
      const total = widthSum * fit + gap * (n - 1);
      let x = (W - total) / 2;
      const rowY = isOpen ? height - baseH / 2 - 14 : height / 2;

      targets.forEach((t, i) => {
        const m = motion.current[i];
        if (m.w === 0) { m.w = bw; m.h = baseH; m.y = rowY; }
        m.w += (t.w - m.w) * EASE;
        m.h += (t.h - m.h) * EASE;
        m.y += (rowY - m.y) * EASE;
        const hovered = i === s.hoverIdx;
        const wantBlur = isOpen && !hovered && i !== s.open ? 2.5 : 0;
        const wantDim = isOpen && !hovered && i !== s.open ? 0.45 : 0;
        m.blur += (wantBlur - m.blur) * 0.15;
        m.dim += (wantDim - m.dim) * 0.15;
        const b = bars.current[i];
        if (b) {
          b.style.width = `${Math.max(2, m.w)}px`;
          b.style.height = `${Math.max(2, m.h)}px`;
          b.style.transform = `translate(${x}px, ${m.y - m.h / 2}px)`;
          b.style.filter = m.blur > 0.05 ? `blur(${m.blur.toFixed(2)}px)` : 'none';
          b.style.opacity = String(1 - m.dim);
          b.style.borderRadius = `${Math.min(radius, m.w / 2)}px`;
        }
        x += m.w + gap;
      });
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [items, barWidth, gap, magnify, lift, influence, radius, height, barHeight, sweep]);

  const onMove = (e: React.PointerEvent) => {
    const r = root.current!.getBoundingClientRect();
    state.current.px = e.clientX - r.left;
    state.current.hovering = true;
  };
  const onLeave = () => { state.current.hovering = false; state.current.hoverIdx = -1; setLabel(-1); };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpenIdx(-1);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [setOpenIdx]);

  const shown = open >= 0 ? items[open] : null;
  const hint = label >= 0 ? items[label] : null;

  return (
    <div
      ref={root}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      className="relative w-full select-none"
      style={{ height }}
      role="group"
      aria-label={ariaLabel}
    >
      {/* The open photo and its caption */}
      <div
        className="absolute inset-x-0 top-0 flex flex-col items-center justify-center text-center transition-all duration-500 ease-out"
        style={{ height: height - 100, opacity: shown ? 1 : 0, transform: shown ? 'scale(1)' : 'scale(.92)', pointerEvents: shown ? 'auto' : 'none' }}
      >
        {shown && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={shown.src}
            alt={shown.alt}
            onClick={() => setOpenIdx(-1)}
            className="max-h-[calc(100%-70px)] max-w-full rounded-2xl object-cover shadow-2xl cursor-zoom-out border border-white/20"
            style={{ aspectRatio: '1.35', height: height - 190 }}
          />
        )}
        {shown && (
          <div className="mt-4">
            <p className="text-xl font-semibold text-gray-900" style={{ fontFamily: 'var(--font-heading)' }}>{shown.title}</p>
            {shown.subtitle && <p className="text-sm text-gray-600">{shown.subtitle}</p>}
          </div>
        )}
      </div>

      {items.map((it, i) => (
        <button
          key={it.src}
          ref={(el) => { bars.current[i] = el; }}
          type="button"
          aria-label={`${it.title}${it.subtitle ? ', ' + it.subtitle : ''}`}
          aria-pressed={open === i}
          onPointerEnter={() => { state.current.hoverIdx = i; setLabel(i); }}
          onClick={() => setOpenIdx(open === i ? -1 : i)}
          className="absolute left-0 top-0 overflow-hidden border border-white/30 shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
          style={{ willChange: 'transform, width, height' }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={it.src} alt="" draggable={false} loading="lazy" className="h-full w-full object-cover" style={{ objectPosition: `${(it.focus ?? 0.5) * 100}% 50%` }} />
        </button>
      ))}

      {/* Label of the slice under the pointer */}
      <p className="absolute inset-x-0 bottom-0 text-center text-sm font-medium text-gray-600 h-6 transition-opacity" style={{ opacity: hint && open < 0 ? 1 : 0 }}>
        {hint?.title}{hint?.subtitle ? ` · ${hint.subtitle}` : ''}
      </p>
    </div>
  );
}
