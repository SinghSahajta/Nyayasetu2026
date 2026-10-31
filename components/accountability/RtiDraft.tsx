'use client';

import React, { useState } from 'react';
import { FileText, Loader2, Copy, Download } from 'lucide-react';
import { useTranslation } from 'react-i18next';

/** For overdue issues: drafts the RTI application a citizen can file to ask why. */
export default function RtiDraft({ uid }: { uid: string }) {
  const { t } = useTranslation();
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const generate = async () => {
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/rti', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ uid }) });
      const d = await res.json();
      if (d.success) setDraft(d.draft); else setError(d.message || t('rti.fail'));
    } catch { setError(t('rti.fail')); }
    setLoading(false);
  };

  const download = () => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([draft], { type: 'text/plain' }));
    a.download = `RTI-${uid}.txt`;
    a.click();
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2"><FileText className="w-4 h-4 text-indigo-600" /> {t('rti.title')}</h2>
      <p className="text-xs text-gray-500 mt-1 mb-3">{t('rti.desc')}</p>
      {!draft ? (
        <button onClick={generate} disabled={loading} className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-md border border-indigo-200 text-indigo-700 font-medium hover:bg-indigo-50 disabled:opacity-60">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />} {t('rti.draft')}
        </button>
      ) : (
        <>
          <textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={14} className="w-full text-xs font-mono p-3 rounded-lg border border-gray-300 text-gray-900" />
          <div className="flex gap-2 mt-2">
            <button onClick={() => { navigator.clipboard.writeText(draft); setCopied(true); setTimeout(() => setCopied(false), 1500); }} className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-md border border-gray-300 text-sm text-gray-700 hover:bg-gray-50"><Copy className="w-4 h-4" />{copied ? t('rti.copied') : t('rti.copy')}</button>
            <button onClick={download} className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-md bg-indigo-700 text-white text-sm hover:bg-indigo-800"><Download className="w-4 h-4" />{t('rti.download')}</button>
          </div>
        </>
      )}
      {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
    </div>
  );
}
