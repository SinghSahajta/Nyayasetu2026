'use client';

import React, { useEffect, useState } from 'react';
import { ShieldCheck, ShieldAlert } from 'lucide-react';

interface Entry { status: string; created_at: string; public_note: string | null; hash: string; valid: boolean }

/** Re-verifies the issue's hash-chained timeline on the server every time it is shown. */
export default function AuditLog({ uid }: { uid: string }) {
  const [log, setLog] = useState<{ verified: boolean; entries: Entry[] } | null>(null);

  useEffect(() => {
    fetch(`/api/audit/${uid}`).then((r) => r.json()).then((d) => d.success && setLog(d)).catch(() => {});
  }, [uid]);

  if (!log) return null; // hidden until the audit migration is applied

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <div className="flex items-start gap-3">
        {log.verified ? <ShieldCheck className="w-5 h-5 text-green-600 shrink-0" /> : <ShieldAlert className="w-5 h-5 text-red-600 shrink-0" />}
        <div>
          <h2 className="text-sm font-semibold text-gray-900">{log.verified ? 'Audit log verified' : 'Audit log failed verification'}</h2>
          <p className="text-xs text-gray-500">
            Each update stores a SHA-256 hash of the one before it. Changing or deleting any past update breaks every hash after it, and this check is re-run each time you open the page.
          </p>
        </div>
      </div>
      <details className="mt-3 text-xs">
        <summary className="cursor-pointer text-indigo-600 font-medium">Show the chain ({log.entries.length} entries)</summary>
        <ol className="mt-2 space-y-2">
          {log.entries.map((e, i) => (
            <li key={e.hash + i} className="rounded-md bg-gray-50 border border-gray-100 p-2">
              <div className="flex justify-between text-gray-700">
                <span className="font-medium">{e.status.replace('_', ' ')}</span>
                <span className={e.valid ? 'text-green-700' : 'text-red-700'}>{e.valid ? 'valid' : 'broken'}</span>
              </div>
              <p className="text-gray-500">{new Date(e.created_at).toLocaleString()}</p>
              <p className="font-mono text-[10px] text-gray-400 break-all">{e.hash}</p>
            </li>
          ))}
        </ol>
      </details>
    </div>
  );
}
