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

export type Tokens = { accessToken: string; refreshToken: string };

/** Trades a refresh token for a new pair; the old one stops working. */
export const refreshTokens = async (refreshToken: string) =>
  (
    await apiRequest<{ data: Tokens }>('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    })
  ).data;

/** Revokes this device's refresh token on the server. */
export const logout = (accessToken: string, refreshToken: string) =>
  apiRequest<unknown>('/auth/logout', {
    method: 'POST',
    token: accessToken,
    body: JSON.stringify({ refreshToken }),
  });
