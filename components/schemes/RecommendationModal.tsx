'use client';

import React, { useState, useCallback } from 'react';
import { X, Loader2, Sparkles, ArrowRight, ArrowLeft, CheckCircle } from 'lucide-react';
import type { SchemeRecommendResult } from '@/types';
import SchemeCard from '@/components/schemes/SchemeCard';

interface RecommendationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Step = 'age' | 'gender' | 'occupation' | 'social_category' | 'disability' | 'results';

const AGE_OPTIONS = [
  { value: 'below_18', label: 'Below 18' },
  { value: '18_25', label: '18–25 years' },
  { value: '26_35', label: '26–35 years' },
  { value: '36_45', label: '36–45 years' },
  { value: '46_59', label: '46–59 years' },
  { value: '60_plus', label: '60+ years' },
];

const GENDER_OPTIONS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
];

const OCCUPATION_OPTIONS = [
  { value: 'student', label: 'Student' },
  { value: 'farmer', label: 'Farmer' },
  { value: 'self_employed', label: 'Self Employed / Business' },
  { value: 'labour', label: 'Construction / Labour' },
  { value: 'salaried', label: 'Salaried Employee' },
  { value: 'homemaker', label: 'Homemaker' },
  { value: 'unemployed', label: 'Unemployed' },
  { value: 'retired', label: 'Retired' },
];

const SOCIAL_CATEGORY_OPTIONS = [
  { value: 'general', label: 'General' },
  { value: 'obc', label: 'OBC' },
  { value: 'sc', label: 'SC' },
  { value: 'st', label: 'ST' },
  { value: 'ews', label: 'EWS' },
];

const STEPS_ORDER: Step[] = ['age', 'gender', 'occupation', 'social_category', 'disability', 'results'];

export default function RecommendationModal({ isOpen, onClose }: RecommendationModalProps) {
  const [step, setStep] = useState<Step>('age');
  const [ageGroup, setAgeGroup] = useState<string | null>(null);
  const [gender, setGender] = useState<string | null>(null);
  const [occupation, setOccupation] = useState<string | null>(null);
  const [socialCategory, setSocialCategory] = useState<string | null>(null);
  const [hasDisability, setHasDisability] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SchemeRecommendResult[]>([]);

  const currentIndex = STEPS_ORDER.indexOf(step);

  const goNext = useCallback(async () => {
    const nextIndex = currentIndex + 1;
    if (nextIndex < STEPS_ORDER.length - 1) {
      setStep(STEPS_ORDER[nextIndex]);
    } else {
      // Submit and get results
      setLoading(true);
      setStep('results');
      try {
        const res = await fetch('/api/schemes/recommend', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            age_group: ageGroup,
            gender,
            occupation,
            social_category: socialCategory,
            has_disability: hasDisability,
          }),
        });
        const data = await res.json();
        setResults(data.recommendations || []);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }
  }, [currentIndex, ageGroup, gender, occupation, socialCategory, hasDisability]);

  const goBack = useCallback(() => {
    if (currentIndex > 0) {
      setStep(STEPS_ORDER[currentIndex - 1]);
    }
  }, [currentIndex]);

  const resetAndClose = useCallback(() => {
    setStep('age');
    setAgeGroup(null);
    setGender(null);
    setOccupation(null);
    setSocialCategory(null);
    setHasDisability(false);
    setResults([]);
    onClose();
  }, [onClose]);

  if (!isOpen) return null;

  function renderOptionGrid(
    options: { value: string; label: string }[],
    selected: string | null,
    onSelect: (val: string) => void
  ) {
    return (
      <div className="grid grid-cols-2 gap-3">
        {options.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onSelect(opt.value)}
            className={`px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all ${
              selected === opt.value
                ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                : 'border-gray-200 hover:border-indigo-300 text-gray-700'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg font-semibold text-gray-900">
              Find Schemes For You
            </h2>
          </div>
          <button onClick={resetAndClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Progress Bar */}
        {step !== 'results' && (
          <div className="px-5 pt-4">
            <div className="flex gap-1.5">
              {STEPS_ORDER.slice(0, -1).map((s, i) => (
                <div
                  key={s}
                  className={`h-1.5 flex-1 rounded-full transition-colors ${
                    i <= currentIndex ? 'bg-indigo-500' : 'bg-gray-200'
                  }`}
                />
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Step {currentIndex + 1} of {STEPS_ORDER.length - 1}
            </p>
          </div>
        )}

        {/* Body */}
        <div className="p-5">
          {step === 'age' && (
            <div>
              <h3 className="text-base font-medium text-gray-900 mb-4">What is your age group?</h3>
              {renderOptionGrid(AGE_OPTIONS, ageGroup, setAgeGroup)}
            </div>
          )}

          {step === 'gender' && (
            <div>
              <h3 className="text-base font-medium text-gray-900 mb-4">What is your gender?</h3>
              {renderOptionGrid(GENDER_OPTIONS, gender, setGender)}
            </div>
          )}

          {step === 'occupation' && (
            <div>
              <h3 className="text-base font-medium text-gray-900 mb-4">What is your occupation?</h3>
              {renderOptionGrid(OCCUPATION_OPTIONS, occupation, setOccupation)}
            </div>
          )}

          {step === 'social_category' && (
            <div>
              <h3 className="text-base font-medium text-gray-900 mb-4">What is your social category?</h3>
              {renderOptionGrid(SOCIAL_CATEGORY_OPTIONS, socialCategory, setSocialCategory)}
            </div>
          )}

          {step === 'disability' && (
            <div>
              <h3 className="text-base font-medium text-gray-900 mb-4">Do you have a disability (40%+)?</h3>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setHasDisability(true)}
                  className={`px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all ${
                    hasDisability
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                      : 'border-gray-200 hover:border-indigo-300 text-gray-700'
                  }`}
                >
                  Yes
                </button>
                <button
                  onClick={() => setHasDisability(false)}
                  className={`px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all ${
                    !hasDisability
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                      : 'border-gray-200 hover:border-indigo-300 text-gray-700'
                  }`}
                >
                  No
                </button>
              </div>
            </div>
          )}

          {step === 'results' && (
            <div>
              {loading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mb-3" />
                  <p className="text-sm text-gray-500">Finding the best schemes for you...</p>
                </div>
              ) : results.length > 0 ? (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <h3 className="text-base font-medium text-gray-900">
                      {results.length} scheme{results.length > 1 ? 's' : ''} recommended for you
                    </h3>
                  </div>
                  <div className="space-y-4">
                    {results.map(({ scheme, match_reasons }) => (
                      <div key={scheme.id}>
                        <SchemeCard scheme={scheme} />
                        <div className="mt-1.5 flex flex-wrap gap-1.5">
                          {match_reasons.map((reason, i) => (
                            <span key={i} className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full">
                              ✓ {reason}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500">No matching schemes found. Try adjusting your profile.</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Nav */}
        {step !== 'results' && (
          <div className="flex items-center justify-between p-5 border-t border-gray-100">
            <button
              onClick={goBack}
              disabled={currentIndex === 0}
              className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700
                disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <button
              onClick={goNext}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg
                bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors"
            >
              {currentIndex === STEPS_ORDER.length - 2 ? 'Get Recommendations' : 'Next'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {step === 'results' && !loading && (
          <div className="p-5 border-t border-gray-100">
            <button
              onClick={resetAndClose}
              className="w-full px-4 py-2.5 rounded-lg bg-gray-100 text-gray-700 text-sm
                font-medium hover:bg-gray-200 transition-colors"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
