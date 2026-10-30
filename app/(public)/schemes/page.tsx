'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Search, Sparkles, FilterX } from 'lucide-react';
import type { Scheme, SchemeCategory } from '@/types';
import SchemeCard from '@/components/schemes/SchemeCard';
import RecommendationModal from '@/components/schemes/RecommendationModal';
import { useTranslation } from 'react-i18next';

const CATEGORY_FILTERS: { value: SchemeCategory | 'all'; labelKey: string }[] = [
  { value: 'all', labelKey: 'filters.all' },
  { value: 'students', labelKey: 'filters.students' },
  { value: 'women', labelKey: 'filters.women' },
  { value: 'senior_citizens', labelKey: 'filters.senior_citizens' },
  { value: 'small_business', labelKey: 'filters.small_business' },
  { value: 'workers', labelKey: 'filters.workers' },
  { value: 'disability', labelKey: 'filters.disability' },
  { value: 'farmers', labelKey: 'filters.farmers' },
];

export default function SchemesPage() {
  const { t } = useTranslation();
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<SchemeCategory | 'all'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchSchemes = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (activeCategory !== 'all') params.set('category', activeCategory);
      if (searchQuery.trim()) params.set('q', searchQuery.trim());

      const res = await fetch(`/api/schemes?${params.toString()}`);
      const data = await res.json();
      setSchemes(data.schemes || []);
    } catch {
      setSchemes([]);
    } finally {
      setLoading(false);
    }
  }, [activeCategory, searchQuery]);

  useEffect(() => {
    const debounce = setTimeout(fetchSchemes, 300);
    return () => clearTimeout(debounce);
  }, [fetchSchemes]);

  return (
    <div className="min-h-screen bg-gray-50 animate-fadeIn">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
        <div className="max-w-6xl mx-auto px-4 py-10">
          <h1 className="text-3xl font-bold mb-2">{t('schemes.title')}</h1>
          <p className="text-indigo-200 text-sm">
            {t('schemes.subtitle')}
          </p>

          {/* Search Bar */}
          <div className="mt-6 relative max-w-2xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('schemes.searchPlaceholder')}
              className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-white/10 backdrop-blur-sm
                border border-white/20 text-white placeholder-indigo-200
                outline-none focus:bg-white/20 focus:border-white/40 transition-all"
            />
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Category Chips + Recommend Button */}
        <div className="flex flex-wrap items-center gap-2 mb-6">
          {CATEGORY_FILTERS.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setActiveCategory(cat.value)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                activeCategory === cat.value
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-indigo-300 hover:text-indigo-600'
              }`}
            >
              {t(cat.labelKey)}
            </button>
          ))}

          <div className="ml-auto">
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full
                bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm
                font-semibold hover:from-amber-600 hover:to-orange-600 transition-all
                shadow-lg shadow-orange-200"
            >
              <Sparkles className="w-4 h-4" />
              {t('schemes.recommendTitle')}
            </button>
          </div>
        </div>

        {/* Results */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm animate-pulse h-64 flex flex-col justify-between">
                 <div className="space-y-4">
                   <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                   <div className="h-4 bg-gray-100 rounded w-1/2"></div>
                   <div className="space-y-2 mt-4">
                     <div className="h-3 bg-gray-100 rounded w-full"></div>
                     <div className="h-3 bg-gray-100 rounded w-5/6"></div>
                   </div>
                 </div>
                 <div className="flex gap-2 mt-6">
                   <div className="h-6 bg-gray-100 rounded-full w-16"></div>
                   <div className="h-6 bg-gray-100 rounded-full w-20"></div>
                 </div>
              </div>
            ))}
          </div>
        ) : schemes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {schemes.map((scheme) => (
              <SchemeCard key={scheme.id} scheme={scheme} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <FilterX className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">{t('schemes.noSchemes')}</p>
          </div>
        )}
      </div>

      {/* Recommendation Modal */}
      <RecommendationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
