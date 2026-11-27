import { Response, CookieOptions } from 'express';
import { env } from '../config/env.js';

const isProd = env.NODE_ENV === 'production';
const cookieDomain = env.COOKIE_DOMAIN ? env.COOKIE_DOMAIN : undefined;

export function getBaseCookieOptions(): CookieOptions {
  return {
    secure: isProd,
    sameSite: 'strict',
    domain: cookieDomain,
  };
}

export function setAuthCookies(
  res: Response,
  accessToken: string,
  refreshToken: string,
  csrfToken?: string
): void {
  const base = getBaseCookieOptions();

  // Access Token: 15 minutes, HttpOnly, Path: /
  res.cookie('access_token', accessToken, {
    ...base,
    httpOnly: true,
    path: '/',
    maxAge: 15 * 60 * 1000,
  });

  // Refresh Token: 14 days, HttpOnly, Path: /api/v1/auth
  res.cookie('refresh_token', refreshToken, {
    ...base,
    httpOnly: true,
    path: '/api/v1/auth',
    maxAge: 14 * 24 * 60 * 60 * 1000,
  });

  // CSRF Token: 14 days, readable by client JavaScript (HttpOnly: false), Path: /
  if (csrfToken) {
    res.cookie('csrf_token', csrfToken, {
      ...base,
      httpOnly: false,
      path: '/',
      maxAge: 14 * 24 * 60 * 60 * 1000,
    });
  }
}

export function clearAuthCookies(res: Response): void {
  const base = getBaseCookieOptions();

  res.clearCookie('access_token', {
    ...base,
    httpOnly: true,
    path: '/',
  });

  res.clearCookie('refresh_token', {
    ...base,
    httpOnly: true,
    path: '/api/v1/auth',
  });

  res.clearCookie('csrf_token', {
    ...base,
    httpOnly: false,
    path: '/',
  });
}
