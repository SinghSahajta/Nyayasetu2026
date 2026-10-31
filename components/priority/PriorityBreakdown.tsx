'use client';

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { localizeReason } from '@/lib/reasons';
import { AlertTriangle, MapPin, Users, Clock, CloudRain, Info, Loader2, X, ChevronDown } from 'lucide-react';
import type { AISeverity, PriorityBand, PriorityFactor } from '@/types';

// Band colours follow the status palette; the label always travels with the colour.
export const BAND_STYLE: Record<PriorityBand, { label: string; hex: string; pill: string }> = {
  P1: { label: 'Critical', hex: '#d03b3b', pill: 'bg-red-100 text-red-800 border-red-200' },
  P2: { label: 'High', hex: '#ec835a', pill: 'bg-orange-100 text-orange-800 border-orange-200' },
  P3: { label: 'Medium', hex: '#d99a06', pill: 'bg-amber-100 text-amber-800 border-amber-200' },
  P4: { label: 'Low', hex: '#64748b', pill: 'bg-slate-100 text-slate-700 border-slate-200' },
};

const ICONS: Record<PriorityFactor['key'], React.ElementType> = {
  severity: AlertTriangle,
  location: MapPin,
  frequency: Users,
  time: Clock,
  season: CloudRain,
};

export function PriorityBadge({ band, score }: { band: PriorityBand; score?: number }) {
  const { t } = useTranslation();
  const s = BAND_STYLE[band] ?? BAND_STYLE.P4;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-xs font-semibold whitespace-nowrap shrink-0 ${s.pill}`}>
      <span className="w-2 h-2 rounded-full" style={{ background: s.hex }} aria-hidden />
      {band} · {t(`priority.band.${band}`, { defaultValue: s.label })}
      {score !== undefined && <span className="font-normal opacity-80">({score})</span>}
    </span>
  );
}

/** Score + one bar per factor with the reason behind its points. `collapsible` hides the factors behind a dropdown. */
export default function PriorityBreakdown({ score, band, factors, collapsible = false }: { score: number; band: PriorityBand; factors: PriorityFactor[]; collapsible?: boolean }) {
  const { t, i18n } = useTranslation();
  const [open, setOpen] = useState(!collapsible);
  const s = BAND_STYLE[band] ?? BAND_STYLE.P4;
  const head = (
    <>
      <div className="text-left">
        <h3 className="text-sm font-semibold text-gray-900">{t('priority.why')}</h3>
        <p className="text-xs text-gray-500">{t('priority.intro')}</p>
      </div>
      <div className="flex items-center gap-3">
        <div className="text-right">
          <div className="text-3xl font-bold text-gray-900 leading-none">{score}<span className="text-sm text-gray-400 font-normal">/100</span></div>
          <div className="mt-1"><PriorityBadge band={band} /></div>
        </div>
        {collapsible && <ChevronDown className={`w-5 h-5 text-gray-400 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden />}
      </div>
    </>
  );
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      {collapsible ? (
        <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open}
          className="w-full flex items-center justify-between gap-4">{head}</button>
      ) : (
        <div className="flex items-center justify-between gap-4">{head}</div>
      )}
      {open && (
        <ul className="space-y-3 mt-4">
          {factors.map((f) => {
            const Icon = ICONS[f.key] ?? AlertTriangle;
            return (
              <li key={f.key}>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 font-medium text-gray-800">
                    <Icon className="w-4 h-4 text-gray-400" aria-hidden /> {t(`priority.factor.${f.key}`, { defaultValue: f.label })}
                  </span>
                  <span className="tabular-nums text-gray-600">+{f.points} <span className="text-gray-400">/ {f.max}</span></span>
                </div>
                <div className="mt-1 h-1.5 rounded-full bg-gray-100 overflow-hidden" role="presentation">
                  <div className="h-full rounded-full" style={{ width: `${(f.points / f.max) * 100}%`, background: s.hex }} />
                </div>
                <p className="text-xs text-gray-500 mt-1">{localizeReason(f.reason, i18n.language)}</p>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

interface WhyData { factors: PriorityFactor[]; ai: AISeverity | null }

/**
 * The priority badge as a button: click it to see, in the public's own view, exactly why
 * this issue got this score. Loads the breakdown from the public tracker endpoint on demand.
 */
export function PriorityWhy({ uid, band, score }: { uid: string; band: PriorityBand; score: number }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const [data, setData] = useState<WhyData | null>(null);
  const [failed, setFailed] = useState(false);
  const btn = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const toggle = (e: React.MouseEvent) => {
    e.preventDefault(); // the badge sits inside links
    e.stopPropagation();
    if (open) return setOpen(false);
    const r = btn.current!.getBoundingClientRect();
    const width = Math.min(380, window.innerWidth - 16);
    const below = window.innerHeight - r.bottom > 420 || r.top < 420;
    setPos({
      left: Math.max(8, Math.min(r.right - width, window.innerWidth - width - 8)),
      top: below ? r.bottom + 8 : Math.max(8, r.top - 8 - 420),
    });
    setOpen(true);
    if (!data && !failed) {
      fetch(`/api/complaints/track/${uid}`)
        .then((res) => res.json())
        .then((d) => (d.success ? setData({ factors: d.complaint.priority_breakdown ?? [], ai: d.complaint.ai_severity }) : setFailed(true)))
        .catch(() => setFailed(true));
    }
  };

  return (
    <>
      <button ref={btn} type="button" onClick={toggle} title={t('priority.why')} aria-label={t('priority.why')} aria-expanded={open} className="inline-flex items-center gap-1 rounded-full hover:ring-2 hover:ring-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-300">
        <PriorityBadge band={band} score={score} />
        <Info className="w-3.5 h-3.5 text-indigo-500 -ml-0.5 mr-0.5" aria-hidden />
      </button>
      {open && createPortal(
        <div className="fixed inset-0 z-[2000]" onClick={() => setOpen(false)}>
          <div onClick={(e) => e.stopPropagation()} style={{ top: pos.top, left: pos.left, width: Math.min(380, window.innerWidth - 16) }} className="absolute max-h-[420px] overflow-y-auto rounded-xl shadow-2xl bg-white border border-slate-200">
            <button type="button" onClick={() => setOpen(false)} aria-label={t('common.close')} className="absolute top-2 right-2 z-10 p-1 rounded-full text-gray-400 hover:text-gray-700"><X className="w-4 h-4" /></button>
            {data ? (
              <>
                <PriorityBreakdown score={score} band={band} factors={data.factors} />
                {data.ai?.reasoning && (
                  <p className="px-5 pb-3 text-xs text-gray-600">
                    <span className="font-semibold text-gray-800">{t('priority.severityRead')}: </span>{data.ai.severity}/5. {data.ai.reasoning}
                  </p>
                )}
              </>
            ) : failed ? (
              <p className="p-5 text-sm text-gray-500">{t('priority.loadFail')}</p>
            ) : (
              <div className="flex justify-center p-8"><Loader2 className="w-5 h-5 animate-spin text-indigo-600" /></div>
            )}
            <div className="px-5 py-3 border-t border-gray-100 text-xs text-gray-500">
              {t('priority.sameFormula')}{' '}
              <Link href={`/issues/${uid}`} className="text-indigo-600 font-medium hover:underline">{t('priority.openIssue')}</Link>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
