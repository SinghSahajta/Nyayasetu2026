// Public accountability score (0-100) for a city, from numbers anyone can see on /stats.
// Resolution 40 + on-time 35 + not-overdue 25. No hidden inputs.
export interface Tally { total: number; open: number; overdue: number; on_time_rate: number | null }

export interface ScoreFactor { label: string; points: number; max: number; reason: string }

export function accountability(t: Tally): { score: number; grade: 'A' | 'B' | 'C' | 'D'; factors: ScoreFactor[] } {
  const resolved = t.total - t.open;
  const resolution = t.total ? (resolved / t.total) * 40 : 0;
  const onTime = t.on_time_rate == null ? 0 : (t.on_time_rate / 100) * 35;
  const notOverdue = t.open ? (1 - t.overdue / t.open) * 25 : 25;
  const factors: ScoreFactor[] = [
    { label: 'Issues resolved', points: Math.round(resolution), max: 40, reason: `${resolved} of ${t.total} reported issues are resolved` },
    { label: 'Fixed on time', points: Math.round(onTime), max: 35, reason: t.on_time_rate == null ? 'No resolved issues yet' : `${t.on_time_rate}% of resolved issues met their deadline` },
    { label: 'Nothing left overdue', points: Math.round(notOverdue), max: 25, reason: t.open ? `${t.overdue} of ${t.open} open issues are past their deadline` : 'No open issues' },
  ];
  const score = factors.reduce((s, f) => s + f.points, 0);
  return { score, grade: score >= 80 ? 'A' : score >= 65 ? 'B' : score >= 50 ? 'C' : 'D', factors };
}

if (process.argv[1]?.endsWith('accountability.ts')) {
  const perfect = accountability({ total: 10, open: 0, overdue: 0, on_time_rate: 100 });
  console.assert(perfect.score === 100 && perfect.grade === 'A', 'perfect city scores 100');
  const bad = accountability({ total: 10, open: 10, overdue: 10, on_time_rate: null });
  console.assert(bad.score === 0 && bad.grade === 'D', 'all-overdue city scores 0');
  console.log('accountability ok');
}
