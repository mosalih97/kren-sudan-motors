
import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

// Secure storage utilities
class SecureStorage {
  private static encrypt(data: string): string {
    // Simple XOR encryption for demo - in production use proper encryption
    return btoa(data.split('').map(char => 
      String.fromCharCode(char.charCodeAt(0) ^ 123)
    ).join(''));
  }

  private static decrypt(encryptedData: string): string {
    try {
      return atob(encryptedData).split('').map(char => 
        String.fromCharCode(char.charCodeAt(0) ^ 123)
      ).join('');
    } catch {
      return '';
    }
  }

  static setItem(key: string, value: string): void {
    const encrypted = this.encrypt(value);
    localStorage.setItem(`secure_${key}`, encrypted);
  }

  static getItem(key: string): string | null {
    const encrypted = localStorage.getItem(`secure_${key}`);
    if (!encrypted) return null;
    return this.decrypt(encrypted);
  }

  static removeItem(key: string): void {
    localStorage.removeItem(`secure_${key}`);
  }

  static clear(): void {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith('secure_')) {
        localStorage.removeItem(key);
      }
    });
  }
}

export const SecureStorageManager = () => {
  const { user } = useAuth();

  useEffect(() => {
    // Clear secure storage on logout
    if (!user) {
      SecureStorage.clear();
    }
  }, [user]);

  return null;
};

export { SecureStorage };
