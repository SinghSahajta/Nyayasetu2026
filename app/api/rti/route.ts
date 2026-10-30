import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, PUBLIC_COMPLAINT_COLUMNS } from '@/lib/db';
import { groq, CHAT_MODEL } from '@/lib/llm';
import { blurLocation } from '@/lib/privacy';

// Drafts an RTI application (Section 6(1), RTI Act 2005) about one public issue.
// Uses only public fields. Falls back to a fixed template when there is no Groq key.
export async function POST(request: NextRequest) {
  const { uid } = await request.json().catch(() => ({}));
  if (typeof uid !== 'string') return NextResponse.json({ success: false, message: 'uid is required.' }, { status: 400 });

  const { data: c } = await supabaseAdmin.from('complaints').select(PUBLIC_COMPLAINT_COLUMNS).eq('uid', uid.toUpperCase()).single();
  if (!c) return NextResponse.json({ success: false, message: 'Issue not found.' }, { status: 404 });
  const row = blurLocation(c as unknown as Record<string, string | null>);
  const { data: dept } = row.department_id
    ? await supabaseAdmin.from('departments').select('name').eq('id', row.department_id).single()
    : { data: null };

  const facts = {
    issue_id: row.uid, title: row.title, description: row.description, location: row.location_text,
    city: row.city, state: row.state, department: dept?.name ?? 'the concerned department',
    reported_on: new Date(row.created_at!).toDateString(), resolution_deadline: new Date(row.sla_deadline!).toDateString(), status: row.status,
  };

  const questions = [
    'The date on which the above complaint was received and the name and designation of the officer it was assigned to.',
    'A certified copy of all action taken so far on the complaint, with dates (file notings and orders).',
    'The reasons for any delay beyond the stated resolution deadline.',
    'The date by which the problem will be resolved, and the name and designation of the officer responsible.',
  ];
  const template = `To,
The Public Information Officer,
${facts.department},
${facts.city ?? ''}${facts.state ? ', ' + facts.state : ''}

Subject: Application under Section 6(1) of the Right to Information Act, 2005

Sir/Madam,

I, [Your full name], resident of [Your address], request the following information regarding civic complaint ${facts.issue_id} ("${facts.title}") reported on ${facts.reported_on} at ${facts.location}. The resolution deadline was ${facts.resolution_deadline} and the current status is "${facts.status}".

${questions.map((q, i) => `${i + 1}. ${q}`).join('\n')}

I am enclosing the application fee of Rs. 10 as prescribed [attach postal order / court-fee stamp / online receipt]. If this information relates to another public authority, please transfer this application under Section 6(3) of the Act.

Yours faithfully,
[Your name]
[Phone number]
Date: ${new Date().toDateString()}
Place: ${facts.city ?? '[City]'}`;

  const ai = groq();
  if (!ai) return NextResponse.json({ success: true, source: 'template', draft: template });
  try {
    const res = await ai.chat.completions.create({
      model: CHAT_MODEL,
      temperature: 0.2,
      messages: [
        { role: 'system', content: 'You draft formal Indian RTI applications under Section 6(1) of the RTI Act 2005. Output only the letter in plain text, no markdown. Keep placeholders like [Your full name] for personal details. Ask 4-5 specific, answerable questions based on the facts. Do not invent facts.' },
        { role: 'user', content: `Draft an RTI application using these facts:\n${JSON.stringify(facts, null, 2)}\nBase the questions on:\n${questions.join('\n')}` },
      ],
    });
    const draft = res.choices[0]?.message?.content?.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
    return NextResponse.json({ success: true, source: draft ? 'ai' : 'template', draft: draft || template });
  } catch {
    return NextResponse.json({ success: true, source: 'template', draft: template });
  }
}
