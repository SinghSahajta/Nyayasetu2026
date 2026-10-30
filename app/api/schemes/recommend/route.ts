import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db';
import type { Scheme, SchemeRecommendRequest, SchemeRecommendResult } from '@/types';

/**
 * POST /api/schemes/recommend
 * Rule-based scheme matching based on user profile fields.
 * Returns top 5 matching schemes with match reasons.
 */
export async function POST(request: NextRequest) {
  try {
    const body: SchemeRecommendRequest = await request.json();
    const { age_group, gender, occupation, social_category, has_disability } = body;

    // Fetch all active schemes
    const { data: schemes, error } = await supabaseAdmin
      .from('schemes')
      .select('*')
      .eq('is_active', true);

    if (error || !schemes) {
      return NextResponse.json(
        { success: false, message: 'Failed to fetch schemes.' },
        { status: 500 }
      );
    }

    // Parse age from age_group
    const ageMap: Record<string, number> = {
      'below_18': 15,
      '18_25': 22,
      '26_35': 30,
      '36_45': 40,
      '46_59': 52,
      '60_plus': 65,
    };
    const userAge = age_group ? ageMap[age_group] || null : null;

    // Score and rank each scheme
    const scoredSchemes: { scheme: Scheme; score: number; reasons: string[] }[] = [];

    for (const scheme of schemes as Scheme[]) {
      const reasons: string[] = [];
      let score = 0;

      // Age matching
      if (userAge !== null) {
        const minOk = scheme.min_age === null || userAge >= scheme.min_age;
        const maxOk = scheme.max_age === null || userAge <= scheme.max_age;
        if (minOk && maxOk) {
          score += 2;
          reasons.push('Age group eligible');
        } else {
          continue; // Skip if age doesn't match
        }
      }

      // Gender matching
      if (gender && scheme.gender) {
        if (scheme.gender === gender) {
          score += 3;
          reasons.push(`Specifically for ${gender}`);
        } else {
          continue; // Skip if gender-specific and doesn't match
        }
      } else if (scheme.gender === null) {
        score += 1; // General scheme, slight bonus
      }

      // Occupation matching
      if (occupation && scheme.occupation) {
        if (scheme.occupation === occupation || scheme.target_groups.includes(occupation)) {
          score += 3;
          reasons.push(`Matches occupation: ${occupation}`);
        }
      }

      // Target group matching
      if (occupation && scheme.target_groups.includes(occupation)) {
        score += 2;
        if (!reasons.some(r => r.includes('occupation'))) {
          reasons.push(`Target group includes ${occupation}`);
        }
      }

      // Disability matching
      if (has_disability && scheme.has_disability) {
        score += 4;
        reasons.push('Designed for persons with disability');
      } else if (has_disability && scheme.category === 'disability') {
        score += 4;
        reasons.push('Disability-focused scheme');
      }

      // Social category matching
      if (social_category && scheme.social_category) {
        if (scheme.social_category === social_category) {
          score += 2;
          reasons.push(`For ${social_category} category`);
        }
      }

      // Category-based targeting hints
      if (age_group === '60_plus' && scheme.category === 'senior_citizens') {
        score += 3;
        if (!reasons.some(r => r.includes('Senior'))) {
          reasons.push('Senior citizen scheme');
        }
      }

      if (age_group && ['below_18', '18_25'].includes(age_group) && scheme.category === 'students') {
        score += 2;
        if (!reasons.some(r => r.includes('Student'))) {
          reasons.push('Student scheme');
        }
      }

      if (reasons.length === 0) {
        reasons.push('General eligibility match');
      }

      if (score > 0) {
        scoredSchemes.push({ scheme, score, reasons });
      }
    }

    // Sort by score descending and take top 5
    scoredSchemes.sort((a, b) => b.score - a.score);
    const topSchemes: SchemeRecommendResult[] = scoredSchemes
      .slice(0, 5)
      .map(({ scheme, reasons }) => ({ scheme, match_reasons: reasons }));

    return NextResponse.json({
      success: true,
      recommendations: topSchemes,
      total_matched: scoredSchemes.length,
    });
  } catch (err) {
    console.error('[API] scheme recommend error:', err);
    return NextResponse.json(
      { success: false, message: 'Internal server error.' },
      { status: 500 }
    );
  }
}
