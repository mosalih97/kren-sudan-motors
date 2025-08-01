
// حماية CSRF للطلبات الحساسة
export class CSRFProtection {
  private static readonly CSRF_HEADER = 'X-CSRF-Token';
  private static readonly CSRF_STORAGE_KEY = 'csrf_token';

  static generateToken(): string {
    const token = crypto.randomUUID();
    sessionStorage.setItem(this.CSRF_STORAGE_KEY, token);
    return token;
  }

  static getToken(): string | null {
    return sessionStorage.getItem(this.CSRF_STORAGE_KEY);
  }

  static validateToken(token: string): boolean {
    const storedToken = this.getToken();
    return storedToken === token;
  }

  static addTokenToHeaders(headers: Record<string, string> = {}): Record<string, string> {
    const token = this.getToken();
    if (token) {
      headers[this.CSRF_HEADER] = token;
    }
    return headers;
  }

  static clearToken(): void {
    sessionStorage.removeItem(this.CSRF_STORAGE_KEY);
  }

  // إنشاء حقل مخفي للنماذج
  static createHiddenField(): HTMLInputElement {
    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = 'csrf_token';
    input.value = this.getToken() || '';
    return input;
  }
}

// هوك لاستخدام حماية CSRF
export const useCSRFProtection = () => {
  const generateToken = () => CSRFProtection.generateToken();
  const getToken = () => CSRFProtection.getToken();
  const validateToken = (token: string) => CSRFProtection.validateToken(token);
  const addTokenToHeaders = (headers?: Record<string, string>) => 
    CSRFProtection.addTokenToHeaders(headers);
  const clearToken = () => CSRFProtection.clearToken();

  return {
    generateToken,
    getToken,
    validateToken,
    addTokenToHeaders,
    clearToken
  };
};
