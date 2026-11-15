/**
 * Client-side authentication cookie helpers.
 * Manages the synchronization of access tokens with Next.js middleware.
 */

import { AUTH_CONSTANTS } from '@/lib/constants';

/**
 * Sets the authentication access token cookie in the browser.
 *
 * @param accessToken - The JWT access token from Supabase
 */
export function setAuthCookie(accessToken: string): void {
  if (typeof document !== 'undefined') {
    document.cookie = `${AUTH_CONSTANTS.COOKIE_NAME}=${accessToken}; path=/; max-age=${AUTH_CONSTANTS.COOKIE_MAX_AGE_SECONDS}; SameSite=Lax`;
  }
}

/**
 * Clears the authentication access token cookie from the browser upon sign out.
 */
export function clearAuthCookie(): void {
  if (typeof document !== 'undefined') {
    document.cookie = `${AUTH_CONSTANTS.COOKIE_NAME}=; path=/; max-age=0; SameSite=Lax`;
  }
}
