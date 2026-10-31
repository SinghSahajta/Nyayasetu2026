'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';
import { categoryLabel } from '@/constants/categories';
import { ComplaintCategory } from '@/types';
import {
  Trash2,
  Droplets,
  Construction,
  CloudRain,
  Lightbulb,
  CircleAlert,
  Trash,
  Bug,
  PawPrint,
  TreePine,
  Ban,
} from 'lucide-react';

interface CategorySelectorProps {
  selected: ComplaintCategory | null;
  onSelect: (category: ComplaintCategory) => void;
}

const CATEGORIES: { value: ComplaintCategory; label: string; icon: React.ElementType }[] = [
  { value: ComplaintCategory.GARBAGE_COLLECTION, label: 'Garbage Collection', icon: Trash2 },
  { value: ComplaintCategory.WATER_LEAKAGE, label: 'Water Leakage', icon: Droplets },
  { value: ComplaintCategory.SEWER_BLOCKAGE, label: 'Sewer Blockage', icon: Construction },
  { value: ComplaintCategory.DRAIN_OVERFLOW, label: 'Drain Overflow', icon: CloudRain },
  { value: ComplaintCategory.STREETLIGHT, label: 'Streetlight', icon: Lightbulb },
  { value: ComplaintCategory.POTHOLE, label: 'Pothole', icon: CircleAlert },
  { value: ComplaintCategory.ILLEGAL_DUMPING, label: 'Illegal Dumping', icon: Trash },
  { value: ComplaintCategory.MOSQUITO_SANITATION, label: 'Mosquito / Sanitation', icon: Bug },
  { value: ComplaintCategory.STRAY_ANIMAL, label: 'Stray Animal', icon: PawPrint },
  { value: ComplaintCategory.PARK_MAINTENANCE, label: 'Park Maintenance', icon: TreePine },
  { value: ComplaintCategory.ENCROACHMENT, label: 'Encroachment', icon: Ban },
];

export default function CategorySelector({ selected, onSelect }: CategorySelectorProps) {
  const { i18n } = useTranslation();
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {CATEGORIES.map(({ value, icon: Icon }) => {
        const isSelected = selected === value;
        return (
          <button
            key={value}
            type="button"
            onClick={() => onSelect(value)}
            className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all text-center ${
              isSelected
                ? 'border-indigo-500 bg-indigo-50 text-indigo-700 shadow-md'
                : 'border-gray-200 bg-white text-gray-600 hover:border-indigo-300 hover:bg-indigo-50/50'
            }`}
          >
            <Icon className={`w-6 h-6 ${isSelected ? 'text-indigo-600' : 'text-gray-400'}`} />
            <span className="text-xs font-medium leading-tight">{categoryLabel(value, i18n.language)}</span>
          </button>
        );
      })}
    </div>
  );
}
