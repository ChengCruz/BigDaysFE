// src/utils/categoryConfig.ts
import { TransactionCategory } from '../types/transaction';

export interface CategoryConfig {
  emoji: string;
  label: string;
  color: string;
  bgColor: string;
  textColor: string;
  borderColor: string;
}

export const CATEGORY_CONFIG: Record<TransactionCategory, CategoryConfig> = {
  [TransactionCategory.Venue]: {
    emoji: '🏛️',
    label: 'Venue',
    color: 'purple',
    bgColor: 'bg-purple-100',
    textColor: 'text-purple-700',
    borderColor: 'border-purple-200',
  },
  [TransactionCategory.Catering]: {
    emoji: '🍽️',
    label: 'Catering',
    color: 'orange',
    bgColor: 'bg-orange-100',
    textColor: 'text-orange-700',
    borderColor: 'border-orange-200',
  },
  [TransactionCategory.Photography]: {
    emoji: '📸',
    label: 'Photography',
    color: 'pink',
    bgColor: 'bg-pink-100',
    textColor: 'text-pink-700',
    borderColor: 'border-pink-200',
  },
  [TransactionCategory.Decoration]: {
    emoji: '💐',
    label: 'Decoration',
    color: 'teal',
    bgColor: 'bg-teal-100',
    textColor: 'text-teal-700',
    borderColor: 'border-teal-200',
  },
  [TransactionCategory.Attire]: {
    emoji: '👗',
    label: 'Attire',
    color: 'indigo',
    bgColor: 'bg-indigo-100',
    textColor: 'text-indigo-700',
    borderColor: 'border-indigo-200',
  },
  [TransactionCategory.Entertainment]: {
    emoji: '🎵',
    label: 'Entertainment',
    color: 'violet',
    bgColor: 'bg-violet-100',
    textColor: 'text-violet-700',
    borderColor: 'border-violet-200',
  },
  [TransactionCategory.Transport]: {
    emoji: '🚗',
    label: 'Transport',
    color: 'blue',
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-700',
    borderColor: 'border-blue-200',
  },
  [TransactionCategory.Invitation]: {
    emoji: '💌',
    label: 'Invitation',
    color: 'rose',
    bgColor: 'bg-rose-100',
    textColor: 'text-rose-700',
    borderColor: 'border-rose-200',
  },
  [TransactionCategory.Gifts]: {
    emoji: '🎁',
    label: 'Gifts',
    color: 'amber',
    bgColor: 'bg-amber-100',
    textColor: 'text-amber-700',
    borderColor: 'border-amber-200',
  },
  [TransactionCategory.Others]: {
    emoji: '📦',
    label: 'Others',
    color: 'gray',
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-700',
    borderColor: 'border-gray-200',
  },
};

export const getCategoryConfig = (category: TransactionCategory): CategoryConfig => {
  return CATEGORY_CONFIG[category] || CATEGORY_CONFIG[TransactionCategory.Others];
};

export const getAllCategories = (): TransactionCategory[] => {
  return Object.values(TransactionCategory);
};
