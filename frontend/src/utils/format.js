import {
  Building2,
  UtensilsCrossed,
  Camera,
  Hotel,
  Bus,
  Flame,
  Sparkles,
  Music,
  Gem,
  Flower2,
  Gift,
  Palette,
  Mail,
  Shirt,
  Heart,
  Tag,
} from 'lucide-react';

export function formatINR(amount) {
  const num = Number(amount || 0);
  const abs = Math.abs(num);
  const formatted = new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 0,
  }).format(Math.round(abs));
  return `${num < 0 ? '-' : ''}₹${formatted}`;
}

export function formatCompactINR(amount) {
  const num = Number(amount || 0);
  const abs = Math.abs(num);
  const sign = num < 0 ? '-' : '';
  if (abs >= 10000000) {
    return `${sign}₹${(abs / 10000000).toFixed(2).replace(/\.00$/, '')}Cr`;
  }
  if (abs >= 100000) {
    return `${sign}₹${(abs / 100000).toFixed(1).replace(/\.0$/, '')}L`;
  }
  if (abs >= 1000) {
    return `${sign}₹${(abs / 1000).toFixed(0)}K`;
  }
  return `${sign}₹${Math.round(abs)}`;
}

export function formatDateReadable(dateStr) {
  if (!dateStr) return 'Not set';
  const d = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function getDaysUntil(dateStr) {
  if (!dateStr) return null;
  const target = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(target.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.ceil((target - today) / (1000 * 60 * 60 * 24));
}

export const ICON_MAP = {
  Building2,
  UtensilsCrossed,
  Camera,
  Hotel,
  Bus,
  Flame,
  Sparkles,
  Music,
  Gem,
  Flower2,
  Gift,
  Palette,
  Mail,
  Shirt,
  Heart,
  Tag,
};

export const ICON_OPTIONS = [
  { key: 'Building2', label: 'Venue' },
  { key: 'UtensilsCrossed', label: 'Food' },
  { key: 'Camera', label: 'Photo' },
  { key: 'Hotel', label: 'Hotel' },
  { key: 'Bus', label: 'Transport' },
  { key: 'Flame', label: 'Pooja' },
  { key: 'Sparkles', label: 'Pandit' },
  { key: 'Music', label: 'Dhol' },
  { key: 'Flower2', label: 'Decor' },
  { key: 'Gem', label: 'Jewellery' },
  { key: 'Shirt', label: 'Attire' },
  { key: 'Palette', label: 'Makeup' },
  { key: 'Mail', label: 'Invites' },
  { key: 'Gift', label: 'Gifts' },
  { key: 'Heart', label: 'Special' },
  { key: 'Tag', label: 'Other' },
];

// Royal violet & lavender spectrum matching the UI design
export const COLOR_PALETTE = [
  '#3B1786',
  '#5D2EC2',
  '#7C51DA',
  '#9A72EC',
  '#B695F5',
  '#CBB5FA',
  '#6D3B9E',
  '#8B4CB8',
  '#4F46E5',
  '#A855F7',
];

export function getStatusStyle(status) {
  switch (status) {
    case 'Paid':
      return 'bg-[#DCFCE7] text-[#15803D] border-[#86EFAC]';
    case 'Advance Paid':
      return 'bg-[#DBEAFE] text-[#1D4ED8] border-[#93C5FD]';
    default:
      return 'bg-[#FEF3C7] text-[#B45309] border-[#FCD34D]';
  }
}

export function getPayerStyle(paidBy) {
  switch (paidBy) {
    case 'Harsha':
      return 'bg-[#EDE9FE] text-[#4C1D95] border-[#C4B5FD]';
    case 'Divya':
      return 'bg-[#F5D0FE]/70 text-[#86198F] border-[#E879F9]/70';
    default:
      return 'bg-[#E5E7EB]/85 text-[#374151] border-[#D1D5DB]';
  }
}
