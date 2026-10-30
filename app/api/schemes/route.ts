import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const query = searchParams.get('q');

    let dbQuery = supabaseAdmin
      .from('schemes')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    // Filter by category
    if (category) {
      dbQuery = dbQuery.eq('category', category);
    }

    // Keyword search on title, short_description, tags
    if (query) {
      const searchTerm = `%${query}%`;
      dbQuery = dbQuery.or(
        `title_en.ilike.${searchTerm},title_hi.ilike.${searchTerm},short_description_en.ilike.${searchTerm},tags.cs.{${query.toLowerCase()}}`
      );
    }

    const { data, error } = await dbQuery;

    if (error) {
      console.error('[API] schemes list error:', error.message);
      return NextResponse.json(
        { success: false, message: 'Failed to fetch schemes.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, schemes: data || [] });
  } catch (err) {
    console.error('[API] schemes error:', err);
    return NextResponse.json(
      { success: false, message: 'Internal server error.' },
      { status: 500 }
    );
  }
}
