// Hindi names for the English-only scheme fields (department, target groups). These values contain
// characters i18next uses as separators, so they live in a plain lookup instead of the JSON files.
// Anything not listed is shown as stored.

const DEPARTMENTS_HI: Record<string, string> = {
  DBOCWWB: 'दिल्ली भवन एवं अन्य निर्माण कर्मकार कल्याण बोर्ड',
  DSFDC: 'डीएसएफडीसी',
  'DSFDC (Delhi SC/ST/OBC/Minorities & Handicapped Financial and Development Corp.)': 'डीएसएफडीसी (दिल्ली अनुसूचित जाति/जनजाति/ओबीसी/अल्पसंख्यक एवं दिव्यांग वित्त एवं विकास निगम)',
  'Delhi Board of School Education': 'दिल्ली स्कूल शिक्षा बोर्ड',
  'Delhi Building and Other Construction Workers Welfare Board': 'दिल्ली भवन एवं अन्य निर्माण कर्मकार कल्याण बोर्ड',
  'Delhi Jal Board / MCD': 'दिल्ली जल बोर्ड / एमसीडी',
  'Department for the Welfare of SC/ST/OBC': 'अनुसूचित जाति/जनजाति/ओबीसी कल्याण विभाग',
  'Department of Agriculture and Farmers Welfare': 'कृषि एवं किसान कल्याण विभाग',
  'Department of Social Welfare': 'समाज कल्याण विभाग',
  'Department of Women & Child Development': 'महिला एवं बाल विकास विभाग',
  'Department of Women and Child Development': 'महिला एवं बाल विकास विभाग',
  'Development Department': 'विकास विभाग',
  'Development Department (APMC)': 'विकास विभाग (एपीएमसी)',
  'Dialogue and Development Commission of Delhi': 'दिल्ली संवाद एवं विकास आयोग',
  'Directorate of Education': 'शिक्षा निदेशालय',
  'Revenue Department': 'राजस्व विभाग',
  'Transport Department': 'परिवहन विभाग',
};

const GROUPS_HI: Record<string, string> = {
  'Adult Women': 'वयस्क महिलाएँ',
  'Agricultural Workers': 'कृषि श्रमिक',
  'COVID Affected Families': 'कोविड प्रभावित परिवार',
  Children: 'बच्चे',
  'Children with Disabilities': 'दिव्यांग बच्चे',
  'Construction Workers': 'निर्माण श्रमिक',
  'Destitute Women': 'निराश्रित महिलाएँ',
  'Divorced Women': 'तलाकशुदा महिलाएँ',
  Drivers: 'चालक',
  EWS: 'ईडब्ल्यूएस',
  Employers: 'नियोक्ता',
  Entrepreneurs: 'उद्यमी',
  Farmers: 'किसान',
  'Female Construction Workers': 'महिला निर्माण श्रमिक',
  Girls: 'बालिकाएँ',
  Homemakers: 'गृहिणियाँ',
  Laborers: 'मज़दूर',
  'Meritorious Students': 'मेधावी छात्र',
  Minorities: 'अल्पसंख्यक',
  'Persons with Disabilities': 'दिव्यांगजन',
  'Poor Families': 'गरीब परिवार',
  'SC/ST/OBC': 'अनुसूचित जाति/जनजाति/ओबीसी',
  'Sanitation Workers': 'सफाई कर्मचारी',
  'Senior Citizens': 'वरिष्ठ नागरिक',
  'Senior Construction Workers': 'वरिष्ठ निर्माण श्रमिक',
  'Small and Marginal Farmers': 'छोटे और सीमांत किसान',
  Startups: 'स्टार्टअप',
  Students: 'छात्र',
  'Students of SOSE': 'एसओएसई के छात्र',
  'Unemployed Youth': 'बेरोज़गार युवा',
  Widows: 'विधवाएँ',
  'Women Commuters': 'महिला यात्री',
  Youth: 'युवा',
};

export const schemeDepartment = (name: string, lang: string) => (lang === 'hi' ? DEPARTMENTS_HI[name] ?? name : name);
export const schemeGroup = (name: string, lang: string) => (lang === 'hi' ? GROUPS_HI[name] ?? name : name);
