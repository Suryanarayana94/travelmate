export const formatCurrency = (value, { compact = false } = {}) => {
  const number = Number(value) || 0;
  if (compact && number >= 100000) return `₹${(number / 100000).toFixed(number % 100000 === 0 ? 0 : 1)}L`;
  if (compact && number >= 1000) return `₹${(number / 1000).toFixed(number % 1000 === 0 ? 0 : 1)}k`;
  return `₹${number.toLocaleString('en-IN')}`;
};

export const formatNumber = (value) => (Number(value) || 0).toLocaleString('en-IN');

export const formatDate = (value, options = { day: 'numeric', month: 'short', year: 'numeric' }) => {
  if (!value) return 'Date flexible';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Date flexible';
  return date.toLocaleDateString('en-IN', options);
};

export const formatShortDate = (value) =>
  formatDate(value, { day: '2-digit', month: 'short' });

export const initials = (name = '') =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join('') || 'TM';

export const titleCase = (value = '') =>
  String(value)
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

export const pluralise = (count, singular, plural = `${singular}s`) =>
  `${count} ${count === 1 ? singular : plural}`;

export const toDateInput = (date = new Date()) => {
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60000).toISOString().slice(0, 10);
};

export const addDays = (days) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return toDateInput(date);
};

export const debounce = (fn, delay = 350) => {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
};
