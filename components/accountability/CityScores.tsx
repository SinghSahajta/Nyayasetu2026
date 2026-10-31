'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';
import { accountability, type Tally } from '@/lib/accountability';

const GRADE_STYLE: Record<string, string> = {
  A: 'bg-green-100 text-green-800 border-green-200',
  B: 'bg-lime-100 text-lime-800 border-lime-200',
  C: 'bg-amber-100 text-amber-800 border-amber-200',
  D: 'bg-red-100 text-red-800 border-red-200',
};

/** One card per city: grade, score, and the three published inputs behind it. */
export default function CityScores({ cities }: { cities: (Tally & { name: string })[] }) {
  const { t } = useTranslation();
  const reasonFor = (i: number, c: Tally) => {
    const resolved = c.total - c.open;
    if (i === 0) return t('score.r.resolved', { r: resolved, t: c.total });
    if (i === 1) return c.on_time_rate == null ? t('score.r.noneResolved') : t('score.r.onTime', { p: c.on_time_rate });
    return c.open ? t('score.r.overdue', { o: c.overdue, n: c.open }) : t('score.r.noOpen');
  };
  const labels = ['score.f.resolved', 'score.f.onTime', 'score.f.overdue'];
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <h2 className="text-sm font-semibold text-gray-900">{t('score.title')}</h2>
      <p className="text-xs text-gray-500 mb-4">{t('score.desc')}</p>
      <div className="grid md:grid-cols-2 gap-4">
        {cities.map((c) => {
          const { score, grade, factors } = accountability(c);
          return (
            <div key={c.name} className="rounded-lg border border-gray-100 p-4">
              <div className="flex items-center justify-between">
                <p className="font-medium text-gray-900">{t(`cities.${c.name}`, { defaultValue: c.name })}</p>
                <span className={`inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full border text-sm font-semibold ${GRADE_STYLE[grade]}`}>
                  {t('score.grade', { g: grade })} <span className="font-normal tabular-nums">{score}/100</span>
                </span>
              </div>
              <ul className="mt-3 space-y-2">
                {factors.map((f, i) => (
                  <li key={f.label}>
                    <div className="flex justify-between text-xs text-gray-700">
                      <span>{t(labels[i])}</span>
                      <span className="tabular-nums">{f.points}/{f.max}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden mt-0.5">
                      <div className="h-full rounded-full bg-indigo-500" style={{ width: `${(f.points / f.max) * 100}%` }} />
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">{reasonFor(i, c)}</p>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}
