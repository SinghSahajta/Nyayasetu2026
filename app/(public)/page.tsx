'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { MapPin, ArrowRight, ArrowDown, AlertTriangle, Users, Clock, CloudRain, Camera, ListOrdered, CheckCircle2, MessageSquare, Scale, HandHelping, Eye } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { WEIGHTS } from '@/lib/priority';
import LuminousType from '@/components/home/LuminousType';
import ElasticReel, { type ReelItem } from '@/components/home/ElasticReel';
import { PriorityWhy } from '@/components/priority/PriorityBreakdown';
import type { PriorityBand } from '@/types';

interface Overall { total: number; open: number; resolved: number; overdue: number; on_time_rate: number | null; avg_resolution_hours: number | null }
interface TopIssue { uid: string; title: string; city: string | null; priority_band: PriorityBand; priority_score: number; confirmations: number }

// Points come from the real weights in lib/priority.ts, so this page can't drift from the scoring code.
const FACTORS = [
  { icon: AlertTriangle, name: 'Severity', max: WEIGHTS.severity, line: 'An open manhole outranks a faded sign.' },
  { icon: Users, name: 'Reports & confirmations', max: WEIGHTS.frequency, line: 'Verified reports push it up. Spam cannot.' },
  { icon: MapPin, name: 'Location sensitivity', max: WEIGHTS.location, line: 'Schools, hospitals and main roads count more.' },
  { icon: Clock, name: 'Time pressure', max: WEIGHTS.time, line: 'The longer it waits, the higher it climbs.' },
  { icon: CloudRain, name: 'Seasonal risk', max: WEIGHTS.season, line: 'Blocked drains matter more in monsoon.' },
];

const REEL: ReelItem[] = [
  { src: '/reel/waterlogging.png', alt: 'A flooded road with cars and a scooter wading through water', title: 'Waterlogging', subtitle: 'Water & Sewerage' },
  { src: '/reel/pothole.png', alt: 'A large water-filled pothole in the middle of a road', title: 'Potholes', subtitle: 'Roads & Infrastructure' },
  { src: '/reel/wires.png', alt: 'A utility pole with a dangerous tangle of cables', title: 'Tangled wires', subtitle: 'Electrical & Street Lighting' },
  { src: '/reel/garbage.png', alt: 'Garbage dumped at the foot of a wall', title: 'Garbage dumping', subtitle: 'Sanitation & Solid Waste' },
  { src: '/reel/streetlight.png', alt: 'A damaged streetlight at dusk with loose cabling', title: 'Broken streetlights', subtitle: 'Electrical & Street Lighting' },
  { src: '/reel/manhole.png', alt: 'An open manhole beside a footpath', title: 'Open manholes', subtitle: 'Water & Sewerage' },
  { src: '/reel/river.png', alt: 'Toxic foam on a river below a bridge', title: 'River pollution', subtitle: 'Parks & Environment' },
  { src: '/reel/smog.png', alt: 'A smoggy street with a landmark barely visible', title: 'Smog', subtitle: 'Parks & Environment' },
];

const TRUST = [
  { icon: Scale, title: 'Same rules for everyone', body: 'One formula scores every report in every ward.' },
  { icon: HandHelping, title: 'No one can bump a score', body: 'Not officers, not supervisors, not us.' },
  { icon: Eye, title: 'Every point has a reason', body: 'Tap the ⓘ next to any score to read why.' },
];

export default function LandingPage() {
  const { t } = useTranslation();
  const [stats, setStats] = useState<Overall | null>(null);
  const [top, setTop] = useState<TopIssue[]>([]);
  const hero = useRef<HTMLDivElement>(null);
  const [reelH, setReelH] = useState(640);
  const [reelOpen, setReelOpen] = useState(false);

  useEffect(() => {
    fetch('/api/stats').then((r) => r.json()).then((d) => d.success && setStats(d.overall)).catch(() => {});
    fetch('/api/issues?status=open').then((r) => r.json()).then((d) => setTop((d.issues ?? []).slice(0, 5))).catch(() => {});
  }, []);

  // The hero is exactly one screen tall; the reel behind it fills it.
  useEffect(() => {
    const size = () => setReelH(window.innerHeight - 72);
    size();
    window.addEventListener('resize', size);
    return () => window.removeEventListener('resize', size);
  }, []);

  // The pinned headline fades out as the list slides up behind it.
  useEffect(() => {
    const onScroll = () => {
      if (!hero.current) return;
      const p = Math.min(1, window.scrollY / (window.innerHeight * 0.55));
      hero.current.style.opacity = String(1 - p);
      hero.current.style.filter = `blur(${p * 14}px)`;
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const ticker = stats && [
    { label: 'Issues reported', value: stats.total },
    { label: 'Resolved', value: stats.resolved },
    { label: 'Still open', value: stats.open },
    { label: 'Resolved on time', value: stats.on_time_rate == null ? '–' : `${stats.on_time_rate}%` },
    { label: 'Avg. time to fix', value: stats.avg_resolution_hours == null ? '–' : `${stats.avg_resolution_hours} h` },
  ];

  return (
    <div className="flex flex-col w-full animate-fadeIn">
      {/* Hero: headline pinned in the middle, live list slides up behind it */}
      <section className="hero-smoke relative">
        <div ref={hero} className="sticky top-[72px] z-30 h-[calc(100vh-72px)] overflow-hidden">
          {/* Reel fills the hero; the veil keeps the headline readable. Pointer events pass through the text to the reel. */}
          <div className="absolute inset-0 z-0">
            <ElasticReel items={REEL} height={reelH} barWidth={116} gap={20} barHeight={0.68} influence={360} magnify={2.0} lift={1.12} radius={20} onOpenChange={(i) => setReelOpen(i >= 0)} />
          </div>
          <div className="hero-veil absolute inset-0 z-[1] pointer-events-none transition-opacity duration-500" style={{ opacity: reelOpen ? 0 : 1 }} />
          <div className={`relative z-10 h-full flex flex-col items-center justify-center text-center px-4 pointer-events-none transition-opacity duration-500 ${reelOpen ? 'opacity-0' : 'opacity-100'}`}>
          <p className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-100 text-indigo-800 text-sm font-medium mb-6">
            <MapPin className="w-4 h-4" /> {t('landing.v2.badge', { defaultValue: 'Civic issues, India-wide' })}
          </p>
          {/* The hero text layer ignores the pointer (so the reel behind it gets it), so no click-to-reveal here. */}
          <LuminousType
            as="h1"
            text={t('landing.v2.headline', { defaultValue: 'Report it. See how urgent it is. Watch it get fixed.' })}
            className="text-5xl md:text-7xl font-extrabold text-gray-900 tracking-tight leading-[1.08] max-w-4xl"
            baseOpacity={0.3}
            radius={3.4}
            tint="rgba(26, 125, 144, .35)"
            clickToReveal={false}
          />
          <p className="text-lg text-gray-600 mt-6 max-w-2xl">
            {t('landing.v2.sub', { defaultValue: 'Pin a pothole, garbage dump or dead streetlight on the map. We score its priority, explain every point, and show everyone its progress until it is resolved.' })}
          </p>
          <div className="flex flex-wrap justify-center gap-3 mt-8 pointer-events-auto">
            <Link href="/complaints/file" className="inline-flex items-center gap-2 px-6 py-3 rounded-md bg-indigo-700 text-white font-semibold hover:bg-indigo-800">
              {t('landing.v2.report', { defaultValue: 'Report an issue' })} <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/issues" className="inline-flex items-center gap-2 px-6 py-3 rounded-md border border-slate-300 bg-white text-slate-800 font-semibold hover:bg-slate-50">
              {t('landing.v2.map', { defaultValue: 'See the live map' })}
            </Link>
            <Link href="/chat" className="inline-flex items-center gap-2 px-6 py-3 rounded-md text-indigo-800 font-semibold hover:bg-indigo-50">
              <MessageSquare className="w-4 h-4" /> {t('landing.v2.chat', { defaultValue: 'Report by chat (Hindi / English)' })}
            </Link>
          </div>
          <p className="mt-10 text-sm text-gray-500 inline-flex items-center gap-2"><ArrowDown className="w-4 h-4 animate-bounce" /> See what is being fixed right now</p>
          </div>
        </div>

        <div className="relative z-40 max-w-3xl mx-auto px-4 pb-24">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold text-gray-900">{t('landing.v2.topNow', { defaultValue: 'Highest priority right now' })}</h2>
              <Link href="/issues" className="text-xs text-indigo-700 font-medium hover:underline">View all →</Link>
            </div>
            {top.length === 0 ? (
              <p className="text-sm text-gray-500 py-10 text-center">No open issues yet.</p>
            ) : (
              <ol className="divide-y divide-gray-100">
                {top.map((i, idx) => (
                  <li key={i.uid}>
                    <Link href={`/issues/${i.uid}`} className="flex items-center gap-3 py-3 hover:bg-gray-50 rounded-md px-1">
                      <span className="w-5 text-xs tabular-nums text-gray-400">{idx + 1}</span>
                      <span className="flex-1 min-w-0">
                        <span className="block text-sm font-medium text-gray-900 truncate">{i.title}</span>
                        <span className="block text-xs text-gray-500">{i.city ?? ''}{i.confirmations ? ` · ${i.confirmations} confirmation${i.confirmations === 1 ? '' : 's'}` : ''}</span>
                      </span>
                      <PriorityWhy uid={i.uid} band={i.priority_band} score={i.priority_score} />
                    </Link>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>
      </section>

      {/* Live numbers as a running stripe */}
      {ticker && (
        <div className="stat-stripe overflow-hidden border-y border-indigo-900/20 bg-indigo-800 text-white" aria-label="Live numbers">
          <div className="animate-marquee flex w-max">
            {[0, 1].map((copy) => (
              <div key={copy} className="flex shrink-0" aria-hidden={copy === 1}>
                {ticker.map((s) => (
                  <div key={s.label} className="flex items-baseline gap-3 px-10 py-4 whitespace-nowrap">
                    <span className="text-3xl font-bold tabular-nums">{s.value}</span>
                    <span className="text-sm uppercase tracking-wider text-indigo-100">{s.label}</span>
                    <span className="ml-10 text-amber-400" aria-hidden>◆</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* The three main ideas */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 grid md:grid-cols-3 gap-8">
          {[
            { icon: Camera, title: 'Pin & snap', body: 'Drop a pin, add a photo. Already reported nearby? Confirm it instead of duplicating.' },
            { icon: ListOrdered, title: 'Scored automatically', body: 'A 0–100 priority with a reason for every point. Officers work from the top of the list.' },
            { icon: CheckCircle2, title: 'Tracked in public', body: 'Deadlines, auto-escalation and before/after photos that anyone can check.' },
          ].map((s) => (
            <div key={s.title} className="glow-card bg-white rounded-2xl border p-8">
              <span className="inline-flex h-14 w-14 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700"><s.icon className="w-7 h-7" /></span>
              <h3 className="text-2xl font-semibold text-gray-900 mt-5">{s.title}</h3>
              <p className="text-gray-600 mt-3">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Scoring, in plain words */}
      <section className="py-20 bg-gray-50 border-t border-slate-200">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-900">How the priority score works</h2>
          <p className="text-gray-600 mt-3">Transparent by design: five factors, fixed weights, a written reason for each one.</p>

          <div className="mt-8 grid md:grid-cols-5 gap-4">
            {FACTORS.map((f) => (
              <div key={f.name} className="bg-white rounded-xl border border-slate-200 p-5">
                <f.icon className="w-5 h-5 text-indigo-700" />
                <p className="mt-3 font-semibold text-gray-900">{f.name}</p>
                <p className="text-sm text-indigo-800 font-medium">up to {f.max} pts</p>
                <p className="text-xs text-gray-600 mt-2">{f.line}</p>
              </div>
            ))}
          </div>

          <p className="mt-6 text-sm text-gray-600">
            Bands: P1 Critical ≥ 70, P2 High ≥ 50, P3 Medium ≥ 30, P4 Low.
          </p>

          <div className="mt-10 grid md:grid-cols-3 gap-4">
            {TRUST.map((x) => (
              <div key={x.title} className="flex gap-3 rounded-xl bg-white border border-slate-200 p-4">
                <x.icon className="w-6 h-6 text-indigo-700 shrink-0" />
                <div>
                  <p className="font-semibold text-gray-900">{x.title}</p>
                  <p className="text-sm text-gray-600">{x.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
