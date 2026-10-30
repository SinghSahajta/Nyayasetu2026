'use client';

import { useEffect } from 'react';

const CARD = '.bg-white.rounded-xl, .bg-white.rounded-2xl';

/** Dark-mode only (CSS hides the layer in light): a soft light follows the pointer, and the card under it gets a spotlight. */
export default function CursorGlow() {
  useEffect(() => {
    if (!window.matchMedia('(hover: hover)').matches) return;
    const root = document.documentElement;
    let card: HTMLElement | null = null;
    let frame = 0;

    const clear = () => { card?.style.removeProperty('--x'); card?.style.removeProperty('--y'); };
    const onMove = (e: PointerEvent) => {
      if (frame || !root.classList.contains('dark')) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        root.style.setProperty('--mx', `${e.clientX}px`);
        root.style.setProperty('--my', `${e.clientY}px`);
        const hit = (e.target as Element | null)?.closest<HTMLElement>(CARD) ?? null;
        if (hit !== card) { clear(); card = hit; }
        if (card) {
          const r = card.getBoundingClientRect();
          card.style.setProperty('--x', `${e.clientX - r.left}px`);
          card.style.setProperty('--y', `${e.clientY - r.top}px`);
        }
      });
    };
    window.addEventListener('pointermove', onMove);
    return () => { window.removeEventListener('pointermove', onMove); cancelAnimationFrame(frame); };
  }, []);

  return <div className="cursor-glow" aria-hidden />;
}
