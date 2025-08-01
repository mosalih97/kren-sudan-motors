
import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

// Secure storage utilities using browser's built-in security features
class SecureStorage {
  private static readonly STORAGE_PREFIX = 'secure_';
  private static readonly ENCRYPTION_KEY = 'user_session_';

  // Use sessionStorage for sensitive data (cleared on tab close)
  static setSecureItem(key: string, value: string): void {
    try {
      const fullKey = `${this.STORAGE_PREFIX}${key}`;
      // Use sessionStorage for sensitive data
      sessionStorage.setItem(fullKey, value);
    } catch (error) {
      console.error('Failed to store secure item:', error);
    }
  }

  static getSecureItem(key: string): string | null {
    try {
      const fullKey = `${this.STORAGE_PREFIX}${key}`;
      return sessionStorage.getItem(fullKey);
    } catch (error) {
      console.error('Failed to retrieve secure item:', error);
      return null;
    }
  }

  static removeSecureItem(key: string): void {
    try {
      const fullKey = `${this.STORAGE_PREFIX}${key}`;
      sessionStorage.removeItem(fullKey);
    } catch (error) {
      console.error('Failed to remove secure item:', error);
    }
  }

  static clearSecureStorage(): void {
    try {
      // Clear all secure items from sessionStorage
      const keys = Object.keys(sessionStorage);
      keys.forEach(key => {
        if (key.startsWith(this.STORAGE_PREFIX)) {
          sessionStorage.removeItem(key);
        }
      });

      // Also clear localStorage items that might contain sensitive data
      const localKeys = Object.keys(localStorage);
      localKeys.forEach(key => {
        if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.error('Failed to clear secure storage:', error);
    }
  }

  // Store non-sensitive user preferences in localStorage
  static setUserPreference(key: string, value: string): void {
    try {
      const fullKey = `pref_${key}`;
      localStorage.setItem(fullKey, value);
    } catch (error) {
      console.error('Failed to store user preference:', error);
    }
  }

  static getUserPreference(key: string): string | null {
    try {
      const fullKey = `pref_${key}`;
      return localStorage.getItem(fullKey);
    } catch (error) {
      console.error('Failed to retrieve user preference:', error);
      return null;
    }
  }
}

export const SecureStorageManager = () => {
  const { user } = useAuth();

  useEffect(() => {
    // Clear secure storage on logout
    if (!user) {
      SecureStorage.clearSecureStorage();
    }
  }, [user]);

  // Clear secure storage on page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      SecureStorage.clearSecureStorage();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  return null;
};

export { SecureStorage };
