'use client';

import React from 'react';
import { accountability, type Tally } from '@/lib/accountability';

const GRADE_STYLE: Record<string, string> = {
  A: 'bg-green-100 text-green-800 border-green-200',
  B: 'bg-lime-100 text-lime-800 border-lime-200',
  C: 'bg-amber-100 text-amber-800 border-amber-200',
  D: 'bg-red-100 text-red-800 border-red-200',
};

/** One card per city: grade, score, and the three published inputs behind it. */
export default function CityScores({ cities }: { cities: (Tally & { name: string })[] }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <h2 className="text-sm font-semibold text-gray-900">Accountability score by city</h2>
      <p className="text-xs text-gray-500 mb-4">Out of 100: 40 for issues resolved, 35 for fixed on time, 25 for nothing left overdue. Computed from the public numbers below, no hidden inputs.</p>
      <div className="grid md:grid-cols-2 gap-4">
        {cities.map((c) => {
          const { score, grade, factors } = accountability(c);
          return (
            <div key={c.name} className="rounded-lg border border-gray-100 p-4">
              <div className="flex items-center justify-between">
                <p className="font-medium text-gray-900">{c.name}</p>
                <span className={`inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full border text-sm font-semibold ${GRADE_STYLE[grade]}`}>
                  Grade {grade} <span className="font-normal tabular-nums">{score}/100</span>
                </span>
              </div>
              <ul className="mt-3 space-y-2">
                {factors.map((f) => (
                  <li key={f.label}>
                    <div className="flex justify-between text-xs text-gray-700">
                      <span>{f.label}</span>
                      <span className="tabular-nums">{f.points}/{f.max}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden mt-0.5">
                      <div className="h-full rounded-full bg-indigo-500" style={{ width: `${(f.points / f.max) * 100}%` }} />
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">{f.reason}</p>
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
