'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Calendar,
  ExternalLink,
  FileText,
  Loader2,
  Tag,
  Clock,
  CheckSquare,
  Building2,
} from 'lucide-react';
import type { Scheme } from '@/types';
import { useLanguage } from '@/components/layout/LanguageProvider';
import { useTranslation } from 'react-i18next';

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

export default function SchemeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [scheme, setScheme] = useState<Scheme | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { language } = useLanguage();
  const { t } = useTranslation();

  const loc = (field: string) => scheme ? (scheme[`${field}_${language}` as keyof Scheme] as string) : '';

  useEffect(() => {
    async function fetchScheme() {
      try {
        const res = await fetch(`/api/schemes/${params.id}`);
        const data = await res.json();
        if (data.success) {
          setScheme(data.scheme);
        } else {
          setError('Scheme not found.');
        }
      } catch {
        setError('Failed to load scheme details.');
      } finally {
        setLoading(false);
      }
    }
    if (params.id) fetchScheme();
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  if (error || !scheme) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 gap-4">
        <p className="text-gray-500 text-lg">{error || t('schemes.notFound', { defaultValue: 'Scheme not found' })}</p>
        <button
          onClick={() => router.push('/schemes')}
          className="flex items-center gap-2 text-indigo-600 hover:text-indigo-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> {t('schemes.back')}
        </button>
      </div>
    );
  }

  const isDeadlineSoon = scheme.deadline
    ? new Date(scheme.deadline).getTime() - Date.now() < 7 * 24 * 60 * 60 * 1000
    : false;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with back button */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <button
            onClick={() => router.push('/schemes')}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-indigo-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> {t('schemes.back')}
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Title Section */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
          <div className="flex items-start gap-3 mb-4">
            <span className={`text-xs font-medium px-3 py-1 rounded-full ${CATEGORY_COLORS[scheme.category] || CATEGORY_COLORS.general}`}>
              {t(`filters.${scheme.category}`, { defaultValue: scheme.category })}
            </span>
            {scheme.deadline && (
              <span className={`text-xs font-medium px-3 py-1 rounded-full flex items-center gap-1 ${
                isDeadlineSoon ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'
              }`}>
                <Clock className="w-3 h-3" />
                {t('schemes.deadline', { defaultValue: 'Deadline' })}: {new Date(scheme.deadline).toLocaleDateString(language === 'hi' ? 'hi-IN' : 'en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
            )}
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-1">{loc('title') || scheme.title_en}</h1>
          {language === 'en' && scheme.title_hi && <p className="text-base text-gray-500 mb-4">{scheme.title_hi}</p>}
          {language === 'hi' && scheme.title_en && <p className="text-base text-gray-500 mb-4">{scheme.title_en}</p>}

          <div className="flex items-center gap-2 text-sm text-gray-500 mt-4">
            <Building2 className="w-4 h-4" />
            <span>{scheme.department}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600" /> {t('schemes.about', { defaultValue: 'About This Scheme' })}
              </h2>
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{loc('description') || scheme.description_en}</p>
            </div>

            {/* Eligibility */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">
                {t('schemes.eligibility')}
              </h2>
              <p className="text-gray-700 whitespace-pre-wrap">{loc('eligibility') || scheme.eligibility_en}</p>
            </div>

            {/* Benefits */}
            <div className="bg-green-50 rounded-xl border border-green-200 p-6">
              <h2 className="text-lg font-semibold text-green-800 mb-3">
                💰 {t('schemes.benefits')}
              </h2>
              <p className="text-green-700 font-medium whitespace-pre-wrap">{loc('benefits') || scheme.benefits_en}</p>
            </div>

            {/* Required Documents */}
            {scheme.required_documents && scheme.required_documents.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <CheckSquare className="w-5 h-5 text-indigo-600" /> {t('schemes.documents')}
                </h2>
                <ul className="space-y-2">
                  {scheme.required_documents.map((doc, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-sm text-gray-700">
                      <span className="w-5 h-5 rounded border-2 border-gray-300 flex-shrink-0 mt-0.5" />
                      {doc}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-5">
            {/* Apply Now */}
            {(scheme.application_link || scheme.apply_url) && (
              <a
                href={scheme.application_link || scheme.apply_url || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full px-5 py-3.5 rounded-xl
                  bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-all
                  shadow-lg shadow-indigo-200"
              >
                {t('schemes.btnApply', { defaultValue: 'Apply Now' })}
                <ExternalLink className="w-4 h-4" />
              </a>
            )}

            {/* Quick Info */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
                {t('schemes.quickInfo', { defaultValue: 'Quick Info' })}
              </h3>

              {scheme.min_age !== null || scheme.max_age !== null ? (
                <div>
                  <p className="text-xs text-gray-400 mb-1">{t('schemes.minAge').replace('Min ', '') || 'Age'}</p>
                  <p className="text-sm text-gray-700">
                    {scheme.min_age ?? t('schemes.any', { defaultValue: 'Any' })} – {scheme.max_age ?? t('schemes.noLimit', { defaultValue: 'No limit' })} {t('schemes.years')}
                  </p>
                </div>
              ) : null}

              {scheme.gender && (
                <div>
                  <p className="text-xs text-gray-400 mb-1">{t('schemes.gender')}</p>
                  <p className="text-sm text-gray-700 capitalize">{scheme.gender}</p>
                </div>
              )}

              {scheme.max_income && (
                <div>
                  <p className="text-xs text-gray-400 mb-1">{t('schemes.maxIncome', { defaultValue: 'Max Income' })}</p>
                  <p className="text-sm text-gray-700">₹{scheme.max_income.toLocaleString('en-IN')}/{t('schemes.year', { defaultValue: 'year' })}</p>
                </div>
              )}

              {scheme.occupation && (
                <div>
                  <p className="text-xs text-gray-400 mb-1">{t('schemes.occupation')}</p>
                  <p className="text-sm text-gray-700 capitalize">{scheme.occupation.replace(/_/g, ' ')}</p>
                </div>
              )}
            </div>

            {/* Tags */}
            {scheme.tags && scheme.tags.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-3">
                  {t('schemes.tags', { defaultValue: 'Tags' })}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {scheme.tags.map((tag) => (
                    <span key={tag} className="inline-flex items-center gap-1 text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">
                      <Tag className="w-3 h-3" />
                      {tag.replace(/_/g, ' ')}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Target Groups */}
            {scheme.target_groups && scheme.target_groups.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-3">
                  {t('schemes.targetGroups', { defaultValue: 'Target Groups' })}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {scheme.target_groups.map((group) => (
                    <span key={group} className="text-xs bg-indigo-50 text-indigo-600 px-2.5 py-1 rounded-full font-medium">
                      {group.replace(/_/g, ' ')}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Deadline Alert */}
            {scheme.deadline && isDeadlineSoon && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Calendar className="w-4 h-4 text-red-600" />
                  <p className="text-sm font-semibold text-red-800">
                    {t('schemes.deadlineAlert', { defaultValue: 'Deadline Approaching!' })}
                  </p>
                </div>
                <p className="text-xs text-red-600">
                  {t('schemes.applyBefore', { defaultValue: 'Apply before' })} {new Date(scheme.deadline).toLocaleDateString(language === 'hi' ? 'hi-IN' : 'en-IN', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
