import { ComplaintCategory, SLA_HOURS } from '@/types';

/**
 * Complaint categories with their display labels and SLA hours.
 */
export const COMPLAINT_CATEGORIES: {
  value: ComplaintCategory;
  label_en: string;
  label_hi: string;
  sla_hours: number;
}[] = [
  { value: ComplaintCategory.GARBAGE_COLLECTION, label_en: 'Garbage Collection', label_hi: 'कचरा संग्रहण', sla_hours: SLA_HOURS[ComplaintCategory.GARBAGE_COLLECTION] },
  { value: ComplaintCategory.WATER_LEAKAGE, label_en: 'Water Leakage', label_hi: 'पानी का रिसाव', sla_hours: SLA_HOURS[ComplaintCategory.WATER_LEAKAGE] },
  { value: ComplaintCategory.SEWER_BLOCKAGE, label_en: 'Sewer Blockage', label_hi: 'सीवर अवरोध', sla_hours: SLA_HOURS[ComplaintCategory.SEWER_BLOCKAGE] },
  { value: ComplaintCategory.DRAIN_OVERFLOW, label_en: 'Drain Overflow', label_hi: 'नाला अतिप्रवाह', sla_hours: SLA_HOURS[ComplaintCategory.DRAIN_OVERFLOW] },
  { value: ComplaintCategory.STREETLIGHT, label_en: 'Streetlight', label_hi: 'स्ट्रीटलाइट', sla_hours: SLA_HOURS[ComplaintCategory.STREETLIGHT] },
  { value: ComplaintCategory.POTHOLE, label_en: 'Pothole', label_hi: 'गड्ढा', sla_hours: SLA_HOURS[ComplaintCategory.POTHOLE] },
  { value: ComplaintCategory.ILLEGAL_DUMPING, label_en: 'Illegal Dumping', label_hi: 'अवैध डंपिंग', sla_hours: SLA_HOURS[ComplaintCategory.ILLEGAL_DUMPING] },
  { value: ComplaintCategory.MOSQUITO_SANITATION, label_en: 'Mosquito / Sanitation', label_hi: 'मच्छर / स्वच्छता', sla_hours: SLA_HOURS[ComplaintCategory.MOSQUITO_SANITATION] },
  { value: ComplaintCategory.STRAY_ANIMAL, label_en: 'Stray Animal', label_hi: 'आवारा पशु', sla_hours: SLA_HOURS[ComplaintCategory.STRAY_ANIMAL] },
  { value: ComplaintCategory.PARK_MAINTENANCE, label_en: 'Park Maintenance', label_hi: 'पार्क रखरखाव', sla_hours: SLA_HOURS[ComplaintCategory.PARK_MAINTENANCE] },
  { value: ComplaintCategory.ENCROACHMENT, label_en: 'Encroachment', label_hi: 'अतिक्रमण', sla_hours: SLA_HOURS[ComplaintCategory.ENCROACHMENT] },
];

/** Category label in the visitor's language (falls back to the raw value for unknown categories). */
export function categoryLabel(value: string, lang: string): string {
  const c = COMPLAINT_CATEGORIES.find((x) => x.value === value);
  return c ? (lang === 'hi' ? c.label_hi : c.label_en) : value;
}
