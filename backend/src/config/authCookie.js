import "dotenv/config";

const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

const isProduction = process.env.NODE_ENV === 'production';

export const AUTH_COOKIE_NAME = process.env.COOKIE_NAME || 'token';

export const AUTH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.COOKIE_SECURE
    ? process.env.COOKIE_SECURE === 'true'
    : isProduction,
  sameSite: process.env.COOKIE_SAME_SITE || (isProduction ? 'none' : 'lax'),
  maxAge: ONE_WEEK_MS,
};

export const CLEAR_AUTH_COOKIE_OPTIONS = {
  httpOnly: AUTH_COOKIE_OPTIONS.httpOnly,
  secure: AUTH_COOKIE_OPTIONS.secure,
  sameSite: AUTH_COOKIE_OPTIONS.sameSite,
};
