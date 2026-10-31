// The server writes priority reasons in English from fixed templates (lib/priority.ts) and stores them.
// This translates those templates for Hindi readers. Anything it does not recognise stays in English,
// and free text from the AI review (after the colon) is left as written.

const PLACES: Record<string, string> = { 'hospital/clinic': 'अस्पताल/क्लिनिक', school: 'स्कूल', 'main road': 'मुख्य सड़क', market: 'बाज़ार', 'bus stop': 'बस स्टॉप' };
const place = (p: string) => p.replace(/^(hospital\/clinic|school|main road|market|bus stop)/, (m) => PLACES[m] ?? m);

const RULES: [RegExp, (m: RegExpMatchArray) => string][] = [
  [/^(AI review of the report|Keyword check) rated it (\d)\/5 \(category baseline (\d)\/5\)(?:: ([\s\S]*))?$/, (m) =>
    `${m[1] === 'Keyword check' ? 'कीवर्ड जाँच' : 'रिपोर्ट की AI समीक्षा'} ने इसे ${m[2]}/5 आँका (श्रेणी का आधार स्तर ${m[3]}/5)${m[4] ? ': ' + m[4] : ''}`],
  [/^Category baseline (\d)\/5(, \+1 for urgent words in the description)?$/, (m) =>
    `श्रेणी का आधार स्तर ${m[1]}/5${m[2] ? ', विवरण में तात्कालिक शब्दों के लिए +1' : ''}`],
  [/^Nearby places could not be checked for this location$/, () => 'इस स्थान के आसपास के स्थानों की जाँच नहीं हो सकी'],
  [/^Within (\d+) m of: ([\s\S]+)$/, (m) => `${m[1]} मीटर के भीतर: ${m[2].split(', ').map(place).join(', ')}`],
  [/^No schools, hospitals, main roads or markets within (\d+) m$/, (m) => `${m[1]} मीटर के भीतर कोई स्कूल, अस्पताल, मुख्य सड़क या बाज़ार नहीं`],
  [/^Only one report so far$/, () => 'अब तक केवल एक रिपोर्ट'],
  [/^Resolved, so no longer waiting$/, () => 'हल हो चुकी है, इसलिए अब प्रतीक्षा में नहीं'],
  [/^Past its resolution deadline by (\d+) hours?$/, (m) => `समाधान की समय-सीमा से ${m[1]} घंटे पीछे`],
  [/^(\d+)% of the (\d+) h deadline used$/, (m) => `${m[2]} घंटे की समय-सीमा का ${m[1]}% उपयोग हो चुका`],
  [/^Monsoon season: flooding and mosquito-borne disease risk is higher$/, () => 'मानसून का मौसम: बाढ़ और मच्छर-जनित रोगों का जोखिम अधिक है'],
  [/^No seasonal risk for this category right now$/, () => 'इस श्रेणी के लिए अभी कोई मौसमी जोखिम नहीं'],
];

// The reports-and-confirmations reason is several clauses joined by "; ".
const CLAUSES: [RegExp, (m: RegExpMatchArray) => string][] = [
  [/^1 person confirmed it$/, () => '1 व्यक्ति ने पुष्टि की'],
  [/^(\d+) people confirmed it$/, (m) => `${m[1]} लोगों ने पुष्टि की`],
  [/^(\d+) similar reports? within 150 m in 14 days$/, (m) => `14 दिनों में 150 मीटर के भीतर ${m[1]} समान रिपोर्ट`],
];

export function localizeReason(reason: string, lang: string): string {
  if (lang !== 'hi') return reason;
  for (const [re, fn] of RULES) { const m = reason.match(re); if (m) return fn(m); }
  const parts = reason.split('; ');
  if (parts.length && parts.every((p) => CLAUSES.some(([re]) => re.test(p)))) {
    return parts.map((p) => { for (const [re, fn] of CLAUSES) { const m = p.match(re); if (m) return fn(m); } return p; }).join('; ');
  }
  return reason;
}

if (process.argv[1]?.endsWith('reasons.ts')) {
  const eq = (a: string, b: string) => console.assert(a === b, `${a}\n  != ${b}`);
  eq(localizeReason('Category baseline 4/5, +1 for urgent words in the description', 'hi'), 'श्रेणी का आधार स्तर 4/5, विवरण में तात्कालिक शब्दों के लिए +1');
  eq(localizeReason('Within 250 m of: hospital/clinic (Lajpat Nagar Colony Hospital), market', 'hi'), '250 मीटर के भीतर: अस्पताल/क्लिनिक (Lajpat Nagar Colony Hospital), बाज़ार');
  eq(localizeReason('3 people confirmed it; 2 similar reports within 150 m in 14 days', 'hi'), '3 लोगों ने पुष्टि की; 14 दिनों में 150 मीटर के भीतर 2 समान रिपोर्ट');
  eq(localizeReason('Past its resolution deadline by 39 hours', 'hi'), 'समाधान की समय-सीमा से 39 घंटे पीछे');
  eq(localizeReason('AI review of the report rated it 4/5 (category baseline 3/5): open drain', 'hi'), 'रिपोर्ट की AI समीक्षा ने इसे 4/5 आँका (श्रेणी का आधार स्तर 3/5): open drain');
  eq(localizeReason('Something unexpected', 'hi'), 'Something unexpected');
  eq(localizeReason('Only one report so far', 'en'), 'Only one report so far');
  console.log('reasons ok');
}
