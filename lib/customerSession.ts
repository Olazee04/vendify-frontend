export interface StoredCustomerSession {
  token: string;
  expiresAt: string;
  name: string;
  email: string;
  phone: string;
}

const key = (slug: string) => `vnd_customer_${slug}`;

export function getStoredSession(slug: string): StoredCustomerSession | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(key(slug));
    if (!raw) return null;
    const s: StoredCustomerSession = JSON.parse(raw);
    if (!s.token || new Date(s.expiresAt).getTime() < Date.now()) {
      localStorage.removeItem(key(slug));
      return null;
    }
    return s;
  } catch {
    return null;
  }
}

export function saveSession(slug: string, s: StoredCustomerSession) {
  try {
    localStorage.setItem(key(slug), JSON.stringify(s));
  } catch {}
}

export function clearStoredSession(slug: string) {
  try {
    localStorage.removeItem(key(slug));
  } catch {}
}