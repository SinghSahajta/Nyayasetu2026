'use client';

import React, { useEffect, useRef, useState } from 'react';

type Tag = 'span' | 'div' | 'p' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';

interface Props {
  text: string;
  as?: Tag;
  className?: string;
  style?: React.CSSProperties;
  baseOpacity?: number;     // text outside the light, 0 to 1
  radius?: number;          // light radius in em
  softness?: number;        // 0 crisp to 1 very soft
  trail?: number;           // afterglow behind the light, 0 to 1
  follow?: number;          // 0 lazy to 1 immediate
  idle?: 'drift' | 'center' | 'none'; // what the light does without a pointer
  driftSpeed?: number;
  tint?: string;            // glow colour at the edge of the light ('' for none)
  clickToReveal?: boolean;  // click: lights on for the whole text
}

/**
 * Text that sits dimmed until a soft spotlight passes over it. The spotlight follows the pointer
 * (anywhere on the page), or drifts by itself when there is none. Three stacked copies of the text:
 * the real one (dim, the only one a screen reader sees), a fainter-masked afterglow, and the bright one.
 */
export default function LuminousType({
  text, as = 'p', className, style, baseOpacity = 0.2, radius = 3.2, softness = 0.6, trail = 0.5,
  follow = 0.5, idle = 'drift', driftSpeed = 1, tint = '', clickToReveal = true,
}: Props) {
  const Tag = as as React.ElementType;
  const root = useRef<HTMLElement>(null);
  const trailEl = useRef<HTMLSpanElement>(null);
  const brightEl = useRef<HTMLSpanElement>(null);
  const [lit, setLit] = useState(false);
  const litRef = useRef(false);
  litRef.current = lit;

  useEffect(() => {
    const el = root.current!;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const fast = { x: 0, y: 0 }, slow = { x: 0, y: 0 };
    let pointer: { x: number; y: number } | null = null; // relative to the element
    let started = false;
    let raf = 0;
    const t0 = performance.now();
    const inner = Math.round((1 - softness) * 100);
    const mask = (p: { x: number; y: number }, scale: number) =>
      `radial-gradient(${radius * scale}em circle at ${p.x}px ${p.y}px, #000 ${inner}%, transparent 100%)`;

    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      pointer = { x: e.clientX - r.left, y: e.clientY - r.top };
    };
    const onLeaveWindow = () => { pointer = null; };

    const frame = (now: number) => {
      const w = el.clientWidth, h = el.clientHeight;
      let target = pointer;
      if (!target) {
        const t = ((now - t0) / 1000) * driftSpeed;
        target = idle === 'none' ? { x: -9999, y: -9999 }
          : idle === 'center' || reduced ? { x: w / 2, y: h / 2 }
          : { x: w * (0.5 + 0.42 * Math.sin(t * 0.55)), y: h * (0.5 + 0.3 * Math.sin(t * 0.37 + 1.3)) };
      }
      if (!started) { fast.x = slow.x = target.x; fast.y = slow.y = target.y; started = true; }
      const k = 0.03 + follow * 0.2;
      fast.x += (target.x - fast.x) * k; fast.y += (target.y - fast.y) * k;
      slow.x += (target.x - slow.x) * k * 0.35; slow.y += (target.y - slow.y) * k * 0.35;

      const on = litRef.current;
      if (brightEl.current) {
        const m = on ? 'none' : mask(fast, 1);
        brightEl.current.style.maskImage = m;
        brightEl.current.style.webkitMaskImage = m;
        brightEl.current.style.opacity = '1';
      }
      if (trailEl.current) {
        const m = mask(slow, 1.6);
        trailEl.current.style.maskImage = m;
        trailEl.current.style.webkitMaskImage = m;
        trailEl.current.style.opacity = on ? '0' : String(trail * 0.6);
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    window.addEventListener('pointermove', onMove);
    document.documentElement.addEventListener('pointerleave', onLeaveWindow);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', onMove);
      document.documentElement.removeEventListener('pointerleave', onLeaveWindow);
    };
  }, [radius, softness, trail, follow, idle, driftSpeed]);

  const layer: React.CSSProperties = { position: 'absolute', inset: 0, display: 'block', pointerEvents: 'none' };
  return (
    <Tag
      ref={root}
      className={className}
      style={{ position: 'relative', ...style }}
      onClick={clickToReveal ? () => setLit((v) => !v) : undefined}
    >
      <span style={{ display: 'block', opacity: lit ? 1 : baseOpacity, transition: 'opacity .5s' }}>{text}</span>
      <span ref={trailEl} aria-hidden style={layer}>{text}</span>
      <span ref={brightEl} aria-hidden style={{ ...layer, textShadow: tint ? `0 0 .45em ${tint}` : undefined }}>{text}</span>
    </Tag>
  );
}
