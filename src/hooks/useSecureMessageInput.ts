
import { useState, useCallback } from 'react';
import { filterInputRealTime, containsForbiddenContent, enhancedFilterSensitiveInfo, getForbiddenWord } from '@/utils/enhancedMessageFilter';

export const useSecureMessageInput = (initialValue: string = '') => {
  const [value, setValue] = useState(initialValue);
  const [warning, setWarning] = useState<string>('');

  const handleChange = useCallback((newValue: string) => {
    // Check for forbidden content
    if (containsForbiddenContent(newValue)) {
      const forbiddenWord = getForbiddenWord(newValue);
      setWarning(`لا يُسمح بكتابة "${forbiddenWord}" في الرسائل`);
      
      // Filter out forbidden content
      const filteredValue = filterInputRealTime(newValue);
      setValue(filteredValue);
      
      // Clear warning after 3 seconds
      setTimeout(() => setWarning(''), 3000);
    } else {
      setWarning('');
      setValue(newValue);
    }
  }, []);

  const reset = useCallback(() => {
    setValue(initialValue);
    setWarning('');
  }, [initialValue]);

  const getFinalMessage = useCallback(() => {
    return enhancedFilterSensitiveInfo(value);
  }, [value]);

  return {
    value,
    onChange: handleChange,
    reset,
    warning,
    getFinalMessage
  };
};
