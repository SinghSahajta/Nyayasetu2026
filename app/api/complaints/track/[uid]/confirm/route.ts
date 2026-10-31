import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db';
import { clientIp, limited } from '@/lib/ratelimit';
import { rescoreComplaint } from '@/lib/scoring';

// "I see this too": one confirmation per browser per issue, plus a per-network cap. No phone, no account. Raises the frequency factor.
export async function POST(request: NextRequest, { params }: { params: { uid: string } }) {
  try {
    const { device_id } = await request.json();
    if (typeof device_id !== 'string' || device_id.length < 8) {
      return NextResponse.json({ success: false, message: 'Could not identify this browser.' }, { status: 400 });
    }
    if (limited(`confirm:${clientIp(request)}`, 20, 60 * 60_000)) {
      return NextResponse.json({ success: false, message: 'Too many confirmations from this network. Try again later.' }, { status: 429 });
    }
    const { data: c } = await supabaseAdmin.from('complaints').select('id, status, reporter_device').eq('uid', params.uid.toUpperCase()).single();
    if (!c) return NextResponse.json({ success: false, message: 'Issue not found.' }, { status: 404 });
    if (['resolved', 'closed'].includes(c.status)) {
      return NextResponse.json({ success: false, message: 'This issue is already resolved.' }, { status: 409 });
    }
    if (c.reporter_device === device_id) {
      return NextResponse.json({ success: false, message: 'You reported this issue, so it already counts.' }, { status: 409 });
    }
    const { error } = await supabaseAdmin.from('complaint_confirmations').insert({ complaint_id: c.id, device_id: device_id.slice(0, 64) });
    if (error?.code === '23505') return NextResponse.json({ success: false, message: 'You have already confirmed this issue.' }, { status: 409 });
    if (error) throw new Error(error.message);

    const { count } = await supabaseAdmin.from('complaint_confirmations').select('*', { count: 'exact', head: true }).eq('complaint_id', c.id);
    await supabaseAdmin.from('complaints').update({ confirmations: count ?? 0 }).eq('id', c.id);
    const priority = await rescoreComplaint(c.id);
    return NextResponse.json({ success: true, confirmations: count ?? 0, priority });
  } catch (err) {
    console.error('[API] confirm error:', err);
    return NextResponse.json({ success: false, message: 'Internal server error.' }, { status: 500 });
  }
}
