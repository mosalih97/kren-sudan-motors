
export const sanitizeInput = (input: string, maxLength: number = 1000): string => {
  if (!input) return '';
  
  return input
    .trim()
    .slice(0, maxLength)
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: URLs
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .replace(/data:/gi, '') // Remove data: URLs
    .replace(/vbscript:/gi, '') // Remove vbscript: URLs
    .replace(/[\x00-\x1f\x7f-\x9f]/g, ''); // Remove control characters
};

export const sanitizeEmail = (email: string): string => {
  if (!email) return '';
  
  // Basic email sanitization
  return email
    .trim()
    .toLowerCase()
    .replace(/[^\w@.-]/g, '') // Only allow word chars, @, dot, and dash
    .slice(0, 254); // Email max length
};

export const sanitizePhone = (phone: string): string => {
  if (!phone) return '';
  
  // Remove all non-digit characters except + for country codes
  return phone
    .replace(/[^\d+]/g, '')
    .slice(0, 20); // Reasonable phone number length
};

export const sanitizeFilename = (filename: string): string => {
  if (!filename) return '';
  
  // Remove dangerous characters from filenames
  return filename
    .replace(/[<>:"/\\|?*\x00-\x1f]/g, '_')
    .replace(/\.\./g, '_')
    .slice(0, 255);
};

export const validateAndSanitizeUrl = (url: string): string | null => {
  if (!url) return null;
  
  try {
    const urlObj = new URL(url);
    
    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return null;
    }
    
    // Block localhost and private IP ranges in production
    if (process.env.NODE_ENV === 'production') {
      const hostname = urlObj.hostname;
      if (hostname === 'localhost' || 
          hostname.startsWith('127.') ||
          hostname.startsWith('10.') ||
          hostname.startsWith('192.168.') ||
          hostname.startsWith('172.')) {
        return null;
      }
    }
    
    return urlObj.toString();
  } catch {
    return null;
  }
};

export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
};

export const isValidPhone = (phone: string): boolean => {
  const phoneRegex = /^\+?[\d\s-()]{8,20}$/;
  return phoneRegex.test(phone);
};

export const escapeHtml = (unsafe: string): string => {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

export const stripHtml = (html: string): string => {
  return html.replace(/<[^>]*>/g, '');
};
