'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';

interface WardHeatmapProps {
  wards: {
    ward: string;
    total_complaints: number;
    overdue_complaints?: number;
  }[];
}

export default function WardHeatmap({ wards }: WardHeatmapProps) {
  const { t } = useTranslation();

  const getIntensityColors = (count: number) => {
    if (count === 0) return 'bg-slate-50 text-slate-500 border-slate-200';
    if (count <= 5) return 'bg-emerald-50 text-emerald-800 border-emerald-200';
    if (count <= 15) return 'bg-amber-50 text-amber-800 border-amber-200';
    return 'bg-red-50 text-red-800 border-red-200';
  };

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {wards.map((w, idx) => (
          <div
            key={idx}
            className={`rounded-xl border shadow-sm hover:shadow-md transition-all duration-200 p-4 ${getIntensityColors(
              w.total_complaints
            )}`}
          >
            <h3 className="font-bold truncate" title={w.ward}>
              {w.ward}
            </h3>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-black">{w.total_complaints}</span>
              <span className="text-sm opacity-80 uppercase tracking-wider font-semibold">Total</span>
            </div>
            {w.overdue_complaints !== undefined && (
              <p
                className={`text-sm mt-1 font-medium flex items-center gap-1 ${
                  w.overdue_complaints > 0 ? 'text-red-600' : 'opacity-60'
                }`}
              >
                {w.overdue_complaints > 0 && <span className="w-2 h-2 rounded-full bg-red-600 inline-block" />}
                {w.overdue_complaints} {t('supervisor.heatmap.overdue', { defaultValue: 'Overdue' })}
              </p>
            )}
          </div>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-xs font-medium text-slate-500">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-slate-50 border border-slate-200"></span>
          {t('supervisor.heatmap.legend.none', { defaultValue: '0 complaints' })}
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-emerald-50 border border-emerald-200"></span>
          {t('supervisor.heatmap.legend.low', { defaultValue: '1–5' })}
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-amber-50 border border-amber-200"></span>
          {t('supervisor.heatmap.legend.medium', { defaultValue: '6–15' })}
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-red-50 border border-red-200"></span>
          {t('supervisor.heatmap.legend.high', { defaultValue: '16+' })}
        </div>
      </div>
    </div>
  );
}
