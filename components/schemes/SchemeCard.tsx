'use client';

import React from 'react';
import Link from 'next/link';
import { Calendar, Tag, ArrowRight, Clock } from 'lucide-react';
import type { Scheme } from '@/types';
import { useLanguage } from '@/components/layout/LanguageProvider';
import { useTranslation } from 'react-i18next';

interface SchemeCardProps {
  scheme: Scheme;
}

const CATEGORY_COLORS: Record<string, string> = {
  students: 'bg-blue-100 text-blue-700',
  women: 'bg-pink-100 text-pink-700',
  senior_citizens: 'bg-amber-100 text-amber-700',
  small_business: 'bg-emerald-100 text-emerald-700',
  workers: 'bg-orange-100 text-orange-700',
  disability: 'bg-purple-100 text-purple-700',
  farmers: 'bg-lime-100 text-lime-700',
  general: 'bg-gray-100 text-gray-700',
};

export default function SchemeCard({ scheme }: SchemeCardProps) {
  const { language } = useLanguage();
  const { t } = useTranslation();

  const isDeadlineSoon = scheme.deadline
    ? new Date(scheme.deadline).getTime() - Date.now() < 7 * 24 * 60 * 60 * 1000
    : false;

  const isDeadlinePast = scheme.deadline
    ? new Date(scheme.deadline) < new Date()
    : false;

  const loc = (field: string) => scheme[`${field}_${language}` as keyof Scheme] as string;

  return (
    <div className="group bg-white rounded-xl border border-slate-200 shadow-sm p-5 hover:shadow-md hover:border-indigo-300 transition-all duration-200 flex flex-col h-full">
      {/* Category Badge + Deadline */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${CATEGORY_COLORS[scheme.category] || CATEGORY_COLORS.general}`}>
          {t(`filters.${scheme.category}`, { defaultValue: scheme.category })}
        </span>
        {scheme.deadline && (
          <span className={`text-xs font-medium px-2 py-1 rounded-full flex items-center gap-1 ${
            isDeadlinePast
              ? 'bg-gray-100 text-gray-500 line-through'
              : isDeadlineSoon
                ? 'bg-red-100 text-red-700'
                : 'bg-gray-100 text-gray-600'
          }`}>
            <Clock className="w-3 h-3" />
            {new Date(scheme.deadline).toLocaleDateString(language === 'hi' ? 'hi-IN' : 'en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
          </span>
        )}
      </div>

      {/* Title */}
      <h3 className="text-base font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-indigo-700 transition-colors">
        {loc('title') || scheme.title_en}
      </h3>

      {/* Short Description */}
      <p className="text-sm text-gray-600 mb-3 line-clamp-2 flex-grow">
        {loc('short_description') || scheme.short_description_en}
      </p>

      {/* Benefits */}
      <div className="bg-green-50 rounded-lg p-3 mb-3">
        <p className="text-xs font-medium text-green-800 line-clamp-2">
          💰 {loc('benefits') || scheme.benefits_en}
        </p>
      </div>

      {/* Target Groups */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {scheme.target_groups.slice(0, 3).map((group) => (
          <span key={group} className="inline-flex items-center gap-1 text-xs text-gray-500 bg-gray-50 px-2 py-0.5 rounded">
            <Tag className="w-3 h-3" />
            {group.replace(/_/g, ' ')}
          </span>
        ))}
      </div>

      {/* Department */}
      <p className="text-xs text-gray-400 mb-4">
        <Calendar className="w-3 h-3 inline mr-1" />
        {scheme.department}
      </p>

      {/* View Details Button */}
      <Link
        href={`/schemes/${scheme.id}`}
        className="mt-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-md
          bg-slate-100 text-slate-800 font-medium text-sm
          hover:bg-indigo-700 hover:text-white transition-colors group-hover:bg-indigo-700 group-hover:text-white"
      >
        {t('schemes.btnDetails')}
        <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  );
}
