import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db';
import { groq, CHAT_MODEL } from '@/lib/llm';

// Answers scheme questions using ONLY the schemes stored in our database, so it cannot
// invent a scheme. Returns the schemes the answer mentions so the UI can link to them.
export async function POST(req: NextRequest) {
  const client = groq();
  if (!client) return NextResponse.json({ success: false, message: 'The advisor needs a Groq API key.' }, { status: 503 });

  const { messages } = await req.json().catch(() => ({}));
  if (!Array.isArray(messages) || !messages.length) {
    return NextResponse.json({ success: false, message: 'messages are required.' }, { status: 400 });
  }

  const { data } = await supabaseAdmin
    .from('schemes')
    .select('id, title_en, short_description_en, eligibility_en, benefits_en, category, min_age, max_age, gender, occupation, social_category, has_disability, max_income')
    .eq('is_active', true);
  const schemes = data ?? [];

  const system = `You are the NyayaSetu scheme advisor for Delhi residents. Answer using ONLY the schemes listed below. If none fit, say so and suggest asking differently; never invent a scheme, amount or eligibility rule.
Reply in the language the user writes in (Hindi or English), in under 120 words. If you need age, gender, occupation, income or category to decide, ask one short question.
When you recommend a scheme, write its title exactly as listed. Use plain text only: no markdown, no asterisks; use numbered lines if listing.

SCHEMES:
${JSON.stringify(schemes)}`;

  try {
    const res = await client.chat.completions.create({
      model: CHAT_MODEL,
      temperature: 0.2,
      messages: [{ role: 'system', content: system }, ...messages.slice(-10)],
    });
    const reply = (res.choices[0]?.message?.content ?? '').replace(/<think>[\s\S]*?<\/think>/g, '').trim();
    const mentioned = schemes.filter((s) => reply.toLowerCase().includes(s.title_en.toLowerCase())).map((s) => ({ id: s.id, title: s.title_en }));
    return NextResponse.json({ success: true, reply, schemes: mentioned });
  } catch {
    return NextResponse.json({ success: false, message: 'The advisor is unavailable right now.' }, { status: 502 });
  }
}
