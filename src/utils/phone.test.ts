import {
  cleanPhoneInput,
  groupDigits,
  formatPhone,
  isValidIndianMobile,
  toE164India,
} from './phone';

test('cleanPhoneInput strips non-digits and caps at 10', () => {
  expect(cleanPhoneInput('98765-43210 99')).toBe('9876543210');
  expect(cleanPhoneInput('+91 98')).toBe('9198');
});

test('isValidIndianMobile accepts 10 digits starting 6-9 only', () => {
  expect(isValidIndianMobile('9876543210')).toBe(true);
  expect(isValidIndianMobile('5876543210')).toBe(false);
  expect(isValidIndianMobile('987654321')).toBe(false);
});

test('toE164India and formatPhone round-trip for display', () => {
  expect(formatPhone(toE164India('9876543210'))).toBe('+91 98765 43210');
});

test('groupDigits splits after the fifth digit only once it is reached', () => {
  expect(groupDigits('9876')).toBe('9876');
  expect(groupDigits('9876543210')).toBe('98765 43210');
  expect(cleanPhoneInput(groupDigits('9876543210'))).toBe('9876543210');
});
