'use client';

import { useEffect } from 'react';

const CARD = '.bg-white.rounded-xl, .bg-white.rounded-2xl';

/**
 * Pointer effects. A halo follows the pointer (light in dark mode, smoke in light mode), the card under it
 * gets a spotlight, and the smoke blobs drift against the pointer.
 * --mx/--my: eased pointer position in px. --px/--py: eased pointer position as -1..1 across the screen.
 */
export default function CursorGlow() {
  useEffect(() => {
    if (!window.matchMedia('(hover: hover)').matches) return;
    const root = document.documentElement;
    const target = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const cur = { x: target.x, y: target.y };
    let card: HTMLElement | null = null;
    let frame = 0;

    const clearCard = () => { card?.style.removeProperty('--x'); card?.style.removeProperty('--y'); };
    const tick = () => {
      cur.x += (target.x - cur.x) * 0.14;
      cur.y += (target.y - cur.y) * 0.14;
      root.style.setProperty('--mx', `${cur.x.toFixed(1)}px`);
      root.style.setProperty('--my', `${cur.y.toFixed(1)}px`);
      root.style.setProperty('--px', ((cur.x / window.innerWidth) * 2 - 1).toFixed(3));
      root.style.setProperty('--py', ((cur.y / window.innerHeight) * 2 - 1).toFixed(3));
      frame = Math.abs(target.x - cur.x) + Math.abs(target.y - cur.y) > 0.5 ? requestAnimationFrame(tick) : 0;
    };
    const onMove = (e: PointerEvent) => {
      target.x = e.clientX;
      target.y = e.clientY;
      if (!frame) frame = requestAnimationFrame(tick);

      const hit = (e.target as Element | null)?.closest<HTMLElement>(CARD) ?? null;
      if (hit !== card) { clearCard(); card = hit; }
      if (card) {
        const r = card.getBoundingClientRect();
        card.style.setProperty('--x', `${e.clientX - r.left}px`);
        card.style.setProperty('--y', `${e.clientY - r.top}px`);
      }
    };
    window.addEventListener('pointermove', onMove);
    return () => { window.removeEventListener('pointermove', onMove); cancelAnimationFrame(frame); };
  }, []);

  return <div className="cursor-glow" aria-hidden />;
}
