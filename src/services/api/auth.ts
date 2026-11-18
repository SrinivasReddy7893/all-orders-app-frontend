import { apiRequest } from './client';

export type Session = {
  accessToken: string;
  refreshToken: string;
  user: { id: string; phone: string };
};

export const sendOtp = (phone: string) =>
  apiRequest<{ message: string }>('/auth/send-otp', {
    method: 'POST',
    body: JSON.stringify({ phone }),
  });

export const verifyOtp = async (phone: string, otp: string) =>
  (
    await apiRequest<{ data: Session }>('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ phone, otp }),
    })
  ).data;

export const getGmailConnectUrl = async (token: string) =>
  (
    await apiRequest<{ data: { url: string } }>('/auth/connect-gmail', {
      token,
    })
  ).data.url;
