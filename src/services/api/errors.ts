import { ApiError, NETWORK_ERROR } from './client';

/** Plain-language message for a failed request: what failed and what to do. */
export function describeError(error: unknown): string {
  if (!(error instanceof ApiError)) {
    return 'Something went wrong on our side. Please try again.';
  }
  switch (error.code) {
    case NETWORK_ERROR:
      return "Can't reach All Orders. Check your connection and try again.";
    case 'OTP_RATE_LIMIT':
      return 'Please wait a minute before asking for another code.';
    case 'INVALID_OTP':
      return "That code isn't right. Check the SMS and try again.";
    case 'OTP_EXPIRED':
      return 'This code has expired. Send a new one.';
    case 'OTP_ATTEMPTS_EXCEEDED':
      return 'Too many wrong codes. Send a new one.';
    case 'VALIDATION_ERROR':
      return 'Please check the number and try again.';
    default:
      if (error.status === 429) {
        return 'Too many attempts. Wait a few minutes and try again.';
      }
      return 'Something went wrong on our side. Please try again.';
  }
}
