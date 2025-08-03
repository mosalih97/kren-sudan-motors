
import { useState, useCallback } from 'react';

interface ValidationRule {
  test: (value: string) => boolean;
  message: string;
}

export const useInputValidation = (rules: ValidationRule[] = []) => {
  const [errors, setErrors] = useState<string[]>([]);
  const [isValid, setIsValid] = useState(true);

  const validate = useCallback((value: string) => {
    const newErrors: string[] = [];
    
    rules.forEach(rule => {
      if (!rule.test(value)) {
        newErrors.push(rule.message);
      }
    });

    setErrors(newErrors);
    setIsValid(newErrors.length === 0);
    
    return newErrors.length === 0;
  }, [rules]);

  const clearErrors = useCallback(() => {
    setErrors([]);
    setIsValid(true);
  }, []);

  return {
    errors,
    isValid,
    validate,
    clearErrors
  };
};

// قوانين التحقق الشائعة
export const commonValidationRules = {
  required: (message: string = 'هذا الحقل مطلوب'): ValidationRule => ({
    test: (value: string) => value.trim().length > 0,
    message
  }),
  
  email: (message: string = 'البريد الإلكتروني غير صحيح'): ValidationRule => ({
    test: (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
    message
  }),
  
  minLength: (min: number, message?: string): ValidationRule => ({
    test: (value: string) => value.length >= min,
    message: message || `يجب أن يكون على الأقل ${min} أحرف`
  }),
  
  maxLength: (max: number, message?: string): ValidationRule => ({
    test: (value: string) => value.length <= max,
    message: message || `يجب أن يكون أقل من ${max} حرف`
  }),
  
  strongPassword: (message: string = 'كلمة المرور ضعيفة'): ValidationRule => ({
    test: (value: string) => {
      return value.length >= 8 &&
             /[A-Z]/.test(value) &&
             /[a-z]/.test(value) &&
             /[0-9]/.test(value);
    },
    message
  }),
  
  phone: (message: string = 'رقم الهاتف غير صحيح'): ValidationRule => ({
    test: (value: string) => /^[0-9]{8,15}$/.test(value.replace(/\s/g, '')),
    message
  }),
  
  noHTML: (message: string = 'لا يُسمح بـ HTML'): ValidationRule => ({
    test: (value: string) => !/<[^>]*>/.test(value),
    message
  }),
  
  noScript: (message: string = 'لا يُسمح بالسكريبت'): ValidationRule => ({
    test: (value: string) => !/javascript:|on\w+=/gi.test(value),
    message
  })
};
