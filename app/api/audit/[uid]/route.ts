import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db';

export const dynamic = 'force-dynamic';

// Public: re-verifies the hash chain of an issue's timeline. Internal notes are never returned.
export async function GET(_req: NextRequest, { params }: { params: { uid: string } }) {
  const { data: c } = await supabaseAdmin.from('complaints').select('id').eq('uid', params.uid.toUpperCase()).single();
  if (!c) return NextResponse.json({ success: false, message: 'Issue not found.' }, { status: 404 });
  const { data, error } = await supabaseAdmin.rpc('audit_chain', { p_complaint: c.id });
  if (error) return NextResponse.json({ success: false, message: 'Audit log is not set up yet.' }, { status: 503 });
  const entries = (data ?? []) as { status: string; created_at: string; public_note: string | null; hash: string; valid: boolean }[];
  return NextResponse.json({
    success: true,
    verified: entries.length > 0 && entries.every((e) => e.valid),
    entries: entries.map(({ status, created_at, public_note, hash, valid }) => ({ status, created_at, public_note, hash, valid })),
  });
}
