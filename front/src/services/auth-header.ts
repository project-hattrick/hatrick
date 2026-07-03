import { useAuthStore } from '@/store/auth.store';

/**
 * Authorization header for authenticated api calls — spread into a fetch's
 * headers. Empty object when signed out. Reads the store outside React on
 * purpose (services aren't components).
 */
export function authHeaders(): Record<string, string> {
  const { token } = useAuthStore.getState();
  return token ? { Authorization: `Bearer ${token}` } : {};
}
