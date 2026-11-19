/** Digits only, capped at 10 (Indian mobile numbers). */
export const cleanPhoneInput = (raw: string) =>
  raw.replace(/\D/g, '').slice(0, 10);

/** Indian mobiles are 10 digits starting 6–9. */
export const isValidIndianMobile = (digits: string) =>
  /^[6-9]\d{9}$/.test(digits);

export const toE164India = (digits: string) => `+91${digits}`;

/** "+919876543210" → "+91 98765 43210" for display. */
export const formatPhone = (e164: string) =>
  e164.replace(/^\+91(\d{5})(\d{5})$/, '+91 $1 $2');

/** "9876543210" → "98765 43210" while typing, so the number is easy to check. */
export const groupDigits = (digits: string) =>
  digits.length > 5 ? `${digits.slice(0, 5)} ${digits.slice(5)}` : digits;

/** A gentle nudge while the number is incomplete or can't be a mobile. */
export const phoneHint = (digits: string): string | undefined => {
  if (!digits) return undefined;
  if (/^[0-5]/.test(digits)) return 'Mobile numbers start with 6, 7, 8 or 9';
  const left = 10 - digits.length;
  if (left > 0) return `${left} more digit${left === 1 ? '' : 's'}`;
  return undefined;
};
