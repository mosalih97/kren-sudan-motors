
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export const validateEmail = (email: string): ValidationResult => {
  const errors: string[] = [];
  
  if (!email || email.length === 0) {
    errors.push('البريد الإلكتروني مطلوب');
  } else if (email.length > 254) {
    errors.push('البريد الإلكتروني طويل جداً');
  } else if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)) {
    errors.push('صيغة البريد الإلكتروني غير صحيحة');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validatePhone = (phone: string): ValidationResult => {
  const errors: string[] = [];
  
  if (!phone || phone.length === 0) {
    errors.push('رقم الهاتف مطلوب');
  } else if (!/^[0-9+\-\s()]{10,15}$/.test(phone)) {
    errors.push('رقم الهاتف غير صحيح');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validateDisplayName = (name: string): ValidationResult => {
  const errors: string[] = [];
  
  if (!name || name.trim().length === 0) {
    errors.push('الاسم مطلوب');
  } else if (name.length > 100) {
    errors.push('الاسم طويل جداً');
  } else if (!/^[a-zA-Z\u0600-\u06FF\s]+$/.test(name)) {
    errors.push('الاسم يحتوي على أحرف غير مسموحة');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validateSecureText = (text: string, maxLength: number = 255): ValidationResult => {
  const errors: string[] = [];
  
  if (text.length > maxLength) {
    errors.push(`النص طويل جداً (الحد الأقصى ${maxLength} حرف)`);
  }
  
  // Check for potential XSS patterns
  const xssPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /<iframe/i,
    /<object/i,
    /<embed/i
  ];
  
  for (const pattern of xssPatterns) {
    if (pattern.test(text)) {
      errors.push('النص يحتوي على محتوى غير مسموح');
      break;
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

export const sanitizeHtml = (input: string): string => {
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};
