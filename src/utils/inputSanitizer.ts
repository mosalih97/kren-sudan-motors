
export const sanitizeInput = (input: string, maxLength: number = 255): string => {
  if (!input || typeof input !== 'string') {
    return '';
  }
  
  // Remove potentially dangerous characters and trim whitespace
  return input
    .trim()
    .substring(0, maxLength)
    .replace(/[<>]/g, '') // Remove basic HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, ''); // Remove event handlers
};

export const sanitizeEmail = (email: string): string => {
  if (!email || typeof email !== 'string') {
    return '';
  }
  
  // Basic email sanitization
  return email
    .trim()
    .toLowerCase()
    .substring(0, 254) // RFC compliant max email length
    .replace(/[<>"']/g, ''); // Remove quotes and brackets
};

export const isValidEmail = (email: string): boolean => {
  if (!email || typeof email !== 'string') {
    return false;
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
};
