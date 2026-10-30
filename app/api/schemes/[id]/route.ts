import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const { data, error } = await supabaseAdmin
      .from('schemes')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { success: false, message: 'Scheme not found.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, scheme: data });
  } catch (err) {
    console.error('[API] scheme detail error:', err);
    return NextResponse.json(
      { success: false, message: 'Internal server error.' },
      { status: 500 }
    );
  }
}
