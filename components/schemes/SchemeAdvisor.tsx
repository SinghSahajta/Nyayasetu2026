'use client';

import React, { useRef, useState } from 'react';
import Link from 'next/link';
import { Bot, Loader2, Send } from 'lucide-react';

interface Msg { role: 'user' | 'assistant'; content: string; schemes?: { id: string; title: string }[] }

const EXAMPLES = ['I am a 20 year old student, what can I get?', 'मैं एक विधवा महिला हूँ, कौन सी योजना मिलेगी?', 'Schemes for a small shop owner'];

/** Chat that answers from the schemes in our database and links to the ones it names. */
export default function SchemeAdvisor() {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const end = useRef<HTMLDivElement>(null);

  const send = async (text: string) => {
    if (!text.trim() || busy) return;
    const next: Msg[] = [...msgs, { role: 'user', content: text.trim() }];
    setMsgs(next); setInput(''); setBusy(true);
    try {
      const res = await fetch('/api/schemes/advisor', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: next.map(({ role, content }) => ({ role, content })) }),
      });
      const d = await res.json();
      setMsgs([...next, { role: 'assistant', content: d.success ? d.reply : d.message || 'Something went wrong.', schemes: d.schemes }]);
    } catch {
      setMsgs([...next, { role: 'assistant', content: 'Something went wrong. Please try again.' }]);
    }
    setBusy(false);
    setTimeout(() => end.current?.scrollIntoView({ behavior: 'smooth' }), 50);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm mb-8">
      <div className="flex items-center gap-2 px-5 py-3 border-b border-gray-100">
        <Bot className="w-5 h-5 text-indigo-600" />
        <h2 className="text-sm font-semibold text-gray-900">Ask the scheme advisor</h2>
        <span className="text-xs text-gray-500">Answers only from the schemes listed below, in Hindi or English.</span>
      </div>
      {msgs.length > 0 && (
        <div className="px-5 py-4 space-y-3 max-h-80 overflow-y-auto">
          {msgs.map((m, i) => (
            <div key={i} className={m.role === 'user' ? 'text-right' : ''}>
              <div className={`inline-block max-w-[85%] text-left text-sm rounded-xl px-3 py-2 whitespace-pre-line ${m.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-800'}`}>{m.content}</div>
              {m.schemes && m.schemes.length > 0 && (
                <div className="mt-1.5 flex flex-wrap gap-2">
                  {m.schemes.map((s) => (
                    <Link key={s.id} href={`/schemes/${s.id}`} className="text-xs px-2.5 py-1 rounded-full border border-indigo-200 text-indigo-700 hover:bg-indigo-50">{s.title} →</Link>
                  ))}
                </div>
              )}
            </div>
          ))}
          {busy && <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />}
          <div ref={end} />
        </div>
      )}
      <div className="px-5 py-3 border-t border-gray-100">
        {msgs.length === 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {EXAMPLES.map((e) => (
              <button key={e} onClick={() => send(e)} className="text-xs px-3 py-1.5 rounded-full border border-gray-200 text-gray-600 hover:border-indigo-300 hover:text-indigo-600">{e}</button>
            ))}
          </div>
        )}
        <form onSubmit={(e) => { e.preventDefault(); send(input); }} className="flex gap-2">
          <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Tell me about yourself, e.g. age, work, family..." className="flex-1 px-3 py-2 rounded-lg border border-gray-300 text-sm outline-none focus:border-indigo-500" />
          <button type="submit" disabled={busy || !input.trim()} aria-label="Send" className="px-3 rounded-lg bg-indigo-700 text-white disabled:opacity-50"><Send className="w-4 h-4" /></button>
        </form>
      </div>
    </div>
  );
}
