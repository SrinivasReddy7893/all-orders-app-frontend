import {
  phoneHint,
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

describe('phoneHint', () => {
  it('counts the digits left', () => {
    expect(phoneHint('789654231')).toBe('1 more digit');
    expect(phoneHint('78965')).toBe('5 more digits');
  });
  it('flags numbers that cannot be mobiles', () => {
    expect(phoneHint('12')).toBe('Mobile numbers start with 6, 7, 8 or 9');
  });
  it('is quiet when empty or complete', () => {
    expect(phoneHint('')).toBeUndefined();
    expect(phoneHint('7896542310')).toBeUndefined();
  });
});
