
import { useState, useCallback, useEffect } from 'react';
import { validateSecureText, sanitizeHtml } from '@/utils/securityValidation';
import { useCSRFProtection } from '@/utils/csrfProtection';
import { useSecurityLogger } from '@/hooks/useSecurityLogger';

interface SecureFormOptions {
  enableCSRF?: boolean;
  sanitizeInputs?: boolean;
  validateInputs?: boolean;
  logSubmissions?: boolean;
}

export const useSecureForm = (options: SecureFormOptions = {}) => {
  const {
    enableCSRF = true,
    sanitizeInputs = true,
    validateInputs = true,
    logSubmissions = true
  } = options;

  const { generateToken, getToken, validateToken } = useCSRFProtection();
  const { logSecurityEvent } = useSecurityLogger();
  const [csrfToken, setCsrfToken] = useState<string | null>(null);

  useEffect(() => {
    if (enableCSRF) {
      const token = generateToken();
      setCsrfToken(token);
    }
  }, [enableCSRF, generateToken]);

  const secureSubmit = useCallback(async (
    formData: Record<string, any>,
    submitFn: (data: Record<string, any>) => Promise<any>
  ) => {
    try {
      // التحقق من CSRF
      if (enableCSRF && csrfToken) {
        const currentToken = getToken();
        if (!currentToken || !validateToken(currentToken)) {
          throw new Error('Invalid CSRF token');
        }
      }

      // تنظيف البيانات
      let cleanData = formData;
      if (sanitizeInputs) {
        cleanData = Object.keys(formData).reduce((acc, key) => {
          const value = formData[key];
          if (typeof value === 'string') {
            acc[key] = sanitizeHtml(value);
          } else {
            acc[key] = value;
          }
          return acc;
        }, {} as Record<string, any>);
      }

      // التحقق من صحة البيانات
      if (validateInputs) {
        const errors: string[] = [];
        Object.keys(cleanData).forEach(key => {
          const value = cleanData[key];
          if (typeof value === 'string') {
            const validation = validateSecureText(value);
            if (!validation.isValid) {
              errors.push(...validation.errors);
            }
          }
        });

        if (errors.length > 0) {
          throw new Error(`Validation errors: ${errors.join(', ')}`);
        }
      }

      // تسجيل الإرسال
      if (logSubmissions) {
        logSecurityEvent('form_submission', {
          timestamp: new Date().toISOString(),
          formFields: Object.keys(cleanData),
          csrfProtected: enableCSRF
        });
      }

      // إرسال النموذج
      const result = await submitFn(cleanData);

      // تسجيل النجاح
      if (logSubmissions) {
        logSecurityEvent('form_submission_success', {
          timestamp: new Date().toISOString()
        });
      }

      return result;
    } catch (error) {
      // تسجيل الخطأ
      if (logSubmissions) {
        logSecurityEvent('form_submission_error', {
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        });
      }

      throw error;
    }
  }, [enableCSRF, csrfToken, sanitizeInputs, validateInputs, logSubmissions, getToken, validateToken, logSecurityEvent]);

  const createSecureInput = useCallback((
    name: string,
    value: string,
    onChange: (value: string) => void
  ) => {
    const handleChange = (newValue: string) => {
      let cleanValue = newValue;
      if (sanitizeInputs) {
        cleanValue = sanitizeHtml(newValue);
      }
      onChange(cleanValue);
    };

    return {
      name,
      value,
      onChange: handleChange
    };
  }, [sanitizeInputs]);

  return {
    secureSubmit,
    createSecureInput,
    csrfToken
  };
};
