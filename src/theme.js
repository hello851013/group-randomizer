export const CATEGORY_THEMES = [
  {
    id: 1,
    name: '分類 1',
    shortName: '分1',
    color: '#38bdf8', // sky-400
    colorDark: '#0284c7',
    bg: 'rgba(56, 189, 248, 0.1)',
    border: 'rgba(56, 189, 248, 0.45)',
    avatarGradient: 'linear-gradient(135deg, #0284c7, #38bdf8)',
    badgeBg: 'rgba(56, 189, 248, 0.18)',
    badgeText: '#7dd3fc',
  },
  {
    id: 2,
    name: '分類 2',
    shortName: '分2',
    color: '#fb7185', // rose-400
    colorDark: '#e11d48',
    bg: 'rgba(251, 113, 133, 0.1)',
    border: 'rgba(251, 113, 133, 0.45)',
    avatarGradient: 'linear-gradient(135deg, #e11d48, #fb7185)',
    badgeBg: 'rgba(251, 113, 133, 0.18)',
    badgeText: '#fda4af',
  },
  {
    id: 3,
    name: '分類 3',
    shortName: '分3',
    color: '#34d399', // emerald-400
    colorDark: '#059669',
    bg: 'rgba(52, 211, 153, 0.1)',
    border: 'rgba(52, 211, 153, 0.45)',
    avatarGradient: 'linear-gradient(135deg, #059669, #34d399)',
    badgeBg: 'rgba(52, 211, 153, 0.18)',
    badgeText: '#6ee7b7',
  },
  {
    id: 4,
    name: '分類 4',
    shortName: '分4',
    color: '#c084fc', // purple-400
    colorDark: '#9333ea',
    bg: 'rgba(192, 132, 252, 0.1)',
    border: 'rgba(192, 132, 252, 0.45)',
    avatarGradient: 'linear-gradient(135deg, #9333ea, #c084fc)',
    badgeBg: 'rgba(192, 132, 252, 0.18)',
    badgeText: '#d8b4fe',
  },
  {
    id: 5,
    name: '分類 5',
    shortName: '分5',
    color: '#fb923c', // orange-400
    colorDark: '#ea580c',
    bg: 'rgba(251, 146, 60, 0.1)',
    border: 'rgba(251, 146, 60, 0.45)',
    avatarGradient: 'linear-gradient(135deg, #ea580c, #fb923c)',
    badgeBg: 'rgba(251, 146, 60, 0.18)',
    badgeText: '#fed7aa',
  },
  {
    id: 6,
    name: '分類 6',
    shortName: '分6',
    color: '#2dd4bf', // teal-400
    colorDark: '#0d9488',
    bg: 'rgba(45, 212, 191, 0.1)',
    border: 'rgba(45, 212, 191, 0.45)',
    avatarGradient: 'linear-gradient(135deg, #0d9488, #2dd4bf)',
    badgeBg: 'rgba(45, 212, 191, 0.18)',
    badgeText: '#99f6e4',
  },
  {
    id: 7,
    name: '分類 7',
    shortName: '分7',
    color: '#facc15', // yellow-400
    colorDark: '#ca8a04',
    bg: 'rgba(250, 204, 21, 0.1)',
    border: 'rgba(250, 204, 21, 0.45)',
    avatarGradient: 'linear-gradient(135deg, #ca8a04, #facc15)',
    badgeBg: 'rgba(250, 204, 21, 0.18)',
    badgeText: '#fef08a',
  },
  {
    id: 8,
    name: '分類 8',
    shortName: '分8',
    color: '#818cf8', // indigo-400
    colorDark: '#4f46e5',
    bg: 'rgba(129, 140, 248, 0.1)',
    border: 'rgba(129, 140, 248, 0.45)',
    avatarGradient: 'linear-gradient(135deg, #4f46e5, #818cf8)',
    badgeBg: 'rgba(129, 140, 248, 0.18)',
    badgeText: '#c7d2fe',
  },
];

export function getCategoryTheme(sourceId) {
  if (!sourceId || !sourceId.startsWith('source-')) {
    return CATEGORY_THEMES[0];
  }
  const index = parseInt(sourceId.replace('source-', ''), 10) - 1;
  return CATEGORY_THEMES[Math.max(0, index) % CATEGORY_THEMES.length];
}

export function getDensity(count) {
  if (count <= 5) return 'normal';
  if (count <= 12) return 'compact';
  if (count <= 22) return 'mini';
  return 'micro';
}
