'use client';

import React from 'react';
import { CheckCircle, Circle, AlertTriangle } from 'lucide-react';
import type { ComplaintTimelineEntry } from '@/types';
import { ComplaintStatus } from '@/types';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/components/layout/LanguageProvider';

interface StatusTimelineProps {
  updates: ComplaintTimelineEntry[];
  currentStatus: ComplaintStatus;
}

const STATUS_LABELS: Record<string, string> = {
  submitted: 'Complaint Submitted',
  verified: 'Verified',
  assigned: 'Assigned to Officer',
  in_progress: 'In Progress',
  resolved: 'Resolved',
  closed: 'Closed',
  escalated: 'Escalated',
  reopened: 'Reopened',
  transferred: 'Transferred',
};

// Notes the system itself writes (English, stored in the database); anything else is shown as written.
const NOTE_KEYS: Record<string, string> = {
  'Issue reported by a citizen.': 'tnote.reported',
  'Assigned to an officer.': 'tnote.assigned',
  'Complaint transferred to a different department for resolution.': 'tnote.transferred',
  'New officer assigned to your complaint.': 'tnote.newOfficer',
  'Your complaint has been escalated for priority resolution.': 'tnote.escalated',
  'Your complaint has been escalated for priority resolution due to SLA breach.': 'tnote.escalatedSla',
};

function formatTimelineDate(dateStr: string, lang: string): string {
  const d = new Date(dateStr);
  return d.toLocaleString(lang === 'hi' ? 'hi-IN' : 'en-IN', {
    timeZone: 'Asia/Kolkata',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

export default function StatusTimeline({ updates, currentStatus }: StatusTimelineProps) {
  const { t } = useTranslation();
  const { language } = useLanguage();

  if (!updates || updates.length === 0) {
    return (
      <p className="text-sm text-gray-400 italic">{t('complaints.noTimelineUpdates', { defaultValue: 'No timeline updates available.' })}</p>
    );
  }

  return (
    <div className="relative">
      {updates.map((entry, idx) => {
        const isLast = idx === updates.length - 1;
        const isCurrent = entry.status === currentStatus && isLast;
        const isEscalated = entry.status === ComplaintStatus.ESCALATED;
        const isCompleted = !isCurrent && !isEscalated;

        return (
          <div key={entry.id} className="flex gap-4 pb-6 last:pb-0">
            {/* Vertical line + dot */}
            <div className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                isEscalated
                  ? 'bg-red-100'
                  : isCurrent
                    ? 'bg-indigo-100 ring-2 ring-indigo-400 ring-offset-2'
                    : 'bg-green-100'
              }`}>
                {isEscalated ? (
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                ) : isCurrent ? (
                  <Circle className="w-4 h-4 text-indigo-600 fill-indigo-600" />
                ) : (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                )}
              </div>
              {!isLast && (
                <div className={`w-0.5 flex-1 mt-1 ${
                  isCompleted ? 'bg-green-300' : 'bg-gray-200'
                }`} />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 pb-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-sm font-semibold ${
                  isEscalated
                    ? 'text-red-700'
                    : isCurrent
                      ? 'text-indigo-700'
                      : 'text-gray-900'
                }`}>
                  {t(`complaints.status.${entry.status}`, { defaultValue: STATUS_LABELS[entry.status] || entry.status })}
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                {formatTimelineDate(entry.created_at, language || 'en')}
              </p>
              {entry.public_note && (
                <p className="text-sm text-gray-600 mt-1 bg-gray-50 rounded-lg p-2.5 border border-gray-100">
                  {NOTE_KEYS[entry.public_note] ? t(NOTE_KEYS[entry.public_note]) : entry.public_note}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
