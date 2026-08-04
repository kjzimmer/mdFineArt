// Progressive US-style phone formatter — (555) 123-4567 as the user types.
// Caps at 10 digits; anything beyond that (extensions, international numbers) is left
// untouched by simply not reformatting further, not truncated from what's displayed.
export function formatPhoneInput(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 10);
  const len = digits.length;
  if (len === 0) return '';
  if (len < 4) return digits;
  if (len < 7) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}
