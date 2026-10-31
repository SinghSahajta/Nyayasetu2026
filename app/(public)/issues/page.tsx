'use client';

import React, { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { Loader2, Plus, ThumbsUp, ShieldAlert } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { PriorityWhy, BAND_STYLE } from '@/components/priority/PriorityBreakdown';
import { COMPLAINT_CATEGORIES, categoryLabel } from '@/constants/categories';
import type { MapIssue } from '@/components/map/IssuesMap';
import type { PriorityBand } from '@/types';
import { distanceM } from '@/lib/priority';

const IssuesMap = dynamic(() => import('@/components/map/IssuesMap'), {
  ssr: false,
  loading: () => <div className="h-[520px] w-full rounded-xl bg-gray-100 animate-pulse" />,
});

interface Issue extends MapIssue {
  category: string;
  confirmations: number;
  is_escalated: boolean;
  created_at: string;
}

// Areas are a centre + radius, so nearby villages count too whatever the address lookup calls them.
const CITY_VIEWS: Record<string, { center: [number, number]; zoom: number; radiusKm: number }> = {
  '': { center: [23.5, 78.5], zoom: 5, radiusKm: Infinity },
  Delhi: { center: [28.62, 77.21], zoom: 11, radiusKm: 30 },
  Neemrana: { center: [27.97, 76.39], zoom: 13, radiusKm: 12 },
};

export default function IssuesPage() {
  const { t, i18n } = useTranslation();
  const label = (cat: string) => categoryLabel(cat, i18n.language);
  const [issues, setIssues] = useState<Issue[] | null>(null);
  const [status, setStatus] = useState('open');
  const [category, setCategory] = useState('');
  const [city, setCity] = useState('');

  useEffect(() => {
    setIssues(null);
    const q = new URLSearchParams({ status, ...(category && { category }) });
    fetch(`/api/issues?${q}`).then((r) => r.json()).then((d) => setIssues(d.issues ?? [])).catch(() => setIssues([]));
  }, [status, category]);

  const shown = useMemo(
    () => {
      const v = CITY_VIEWS[city] ?? CITY_VIEWS[''];
      return (issues ?? []).filter((i) => !city || distanceM(v.center[0], v.center[1], i.latitude, i.longitude) <= v.radiusKm * 1000);
    },
    [issues, city],
  );
  const counts = useMemo(() => {
    const c: Record<PriorityBand, number> = { P1: 0, P2: 0, P3: 0, P4: 0 };
    for (const i of shown) c[i.priority_band] = (c[i.priority_band] ?? 0) + 1;
    return c;
  }, [shown]);
  const view = CITY_VIEWS[city] ?? CITY_VIEWS[''];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('issues.title')}</h1>
            <p className="text-sm text-gray-500 mt-1">{t('issues.sub')}</p>
          </div>
          <Link href="/complaints/file" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-md bg-indigo-700 text-white font-medium hover:bg-indigo-800">
            <Plus className="w-4 h-4" /> {t('issues.report')}
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Filters: one row above the map */}
        <div className="flex flex-wrap gap-3 mb-4">
          <select aria-label={t('issues.status')} value={status} onChange={(e) => setStatus(e.target.value)} className="px-3 py-2 rounded-md border border-gray-300 bg-white text-sm">
            <option value="open">{t('issues.open')}</option>
            <option value="resolved">{t('issues.resolved')}</option>
            <option value="all">{t('issues.all')}</option>
          </select>
          <select aria-label={t('issues.catLabel')} value={category} onChange={(e) => setCategory(e.target.value)} className="px-3 py-2 rounded-md border border-gray-300 bg-white text-sm">
            <option value="">{t('issues.allCats')}</option>
            {COMPLAINT_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{label(c.value)}</option>)}
          </select>
          <select aria-label={t('issues.areaLabel')} value={city} onChange={(e) => setCity(e.target.value)} className="px-3 py-2 rounded-md border border-gray-300 bg-white text-sm">
            <option value="">{t('issues.allIndia')}</option>
            <option value="Delhi">{t('cities.Delhi')}</option>
            <option value="Neemrana">{t('cities.Neemrana')}</option>
          </select>
          <div className="flex items-center gap-3 text-xs text-gray-600 ml-auto">
            {(Object.keys(BAND_STYLE) as PriorityBand[]).map((b) => (
              <span key={b} className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: BAND_STYLE[b].hex }} aria-hidden />
                {b} {t(`priority.band.${b}`)} <span className="tabular-nums text-gray-400">{counts[b]}</span>
              </span>
            ))}
          </div>
        </div>

        <div className="grid lg:grid-cols-5 gap-5 [&>*]:min-w-0">
          <div className="lg:col-span-3">
            <IssuesMap key={city} issues={shown} center={view.center} zoom={view.zoom} />
          </div>
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl border border-slate-200 divide-y divide-gray-100 max-h-[520px] overflow-y-auto">
              {issues === null ? (
                <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-indigo-600" /></div>
              ) : shown.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-16">{t('issues.none')}</p>
              ) : (
                shown.map((i, idx) => (
                  <Link key={i.uid} href={`/issues/${i.uid}`} className="flex gap-3 p-3 hover:bg-gray-50">
                    <span className="w-6 text-right text-xs tabular-nums text-gray-400 pt-0.5">{idx + 1}</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium text-gray-900 truncate">{i.title}</p>
                        <PriorityWhy uid={i.uid} band={i.priority_band} score={i.priority_score} />
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-2">
                        <span>{label(i.category)}</span>
                        {i.city && <span>· {t(`cities.${i.city}`, { defaultValue: i.city })}</span>}
                        <span>· {t(`status.${i.status}`, { defaultValue: i.status.replace('_', ' ') })}</span>
                        {i.confirmations > 0 && <span className="inline-flex items-center gap-0.5"><ThumbsUp className="w-3 h-3" />{i.confirmations}</span>}
                        {i.is_escalated && <ShieldAlert className="w-3 h-3 text-red-600" aria-label={t('issues.escalated')} />}
                      </p>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
