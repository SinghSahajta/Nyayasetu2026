import type { NextRequest } from 'next/server';

// ponytail: per-instance memory, resets on restart and isn't shared between serverless instances.
// Swap for Upstash/Redis if the deployment scales out.
const hits = new Map<string, number[]>();

export function clientIp(req: NextRequest): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0].trim() || req.headers.get('x-real-ip') || 'local';
}

/** True if `key` has used up `max` hits in the last `windowMs`; otherwise records this hit. */
export function limited(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  if (recent.length >= max) { hits.set(key, recent); return true; }
  recent.push(now);
  hits.set(key, recent);
  return false;
}
