
import { useState, useCallback } from 'react';

export const useSecureInput = (initialValue: string = '') => {
  const [value, setValue] = useState(initialValue);

  const sanitize = useCallback((input: string) => {
    // إزالة الأحرف الخطيرة
    return input
      .replace(/[<>]/g, '') // إزالة HTML tags
      .replace(/javascript:/gi, '') // إزالة javascript: protocol
      .replace(/on\w+=/gi, '') // إزالة event handlers
      .trim();
  }, []);

  const handleChange = useCallback((newValue: string) => {
    const sanitizedValue = sanitize(newValue);
    setValue(sanitizedValue);
  }, [sanitize]);

  const reset = useCallback(() => {
    setValue(initialValue);
  }, [initialValue]);

  return {
    value,
    onChange: handleChange,
    reset,
    sanitize
  };
};
