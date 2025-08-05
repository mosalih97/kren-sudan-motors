
import { sanitizeInput } from './inputSanitizer';

export const enhancedFilterSensitiveInfo = (message: string): string => {
  if (!message) return '';
  
  // First sanitize the input
  let filteredMessage = sanitizeInput(message, 2000);
  
  // Enhanced phone number detection (Arabic and English)
  const phoneRegex = /\b(?:\+?9665|05|009665|5)\d{8}\b/g;
  const generalPhoneRegex = /\b\d{8,15}\b/g;
  
  // Enhanced email detection
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
  
  // Enhanced URL detection
  const urlRegex = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/g;
  const socialMediaRegex = /(?:@|#)\w+/g;
  
  // Enhanced ID number detection (Saudi ID, Iqama, etc.)
  const saudiIdRegex = /\b[12]\d{9}\b/g;
  const iqamaRegex = /\b[12]\d{9}\b/g;
  
  // Bank account and financial info
  const bankAccountRegex = /\b(?:IBAN|iban|رقم الحساب|حساب|بنك)\s*:?\s*\w+/gi;
  const creditCardRegex = /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g;
  
  // Password and sensitive data
  const passwordRegex = /\b(?:password|كلمة مرور|كلمة السر|رمز|pin|رقم سري)\s*:?\s*\S+/gi;
  const otpRegex = /\b(?:otp|رمز التحقق|كود التحقق)\s*:?\s*\d+/gi;
  
  // Location coordinates
  const coordinatesRegex = /\b\d+\.\d+,\s*\d+\.\d+\b/g;
  
  // Arabic numerals (٠-٩)
  const arabicNumeralsRegex = /[٠-٩]/g;
  
  // Enhanced location-related keywords (individual word blocking)
  const blockedWords = [
    'الرقم', 'العنوان', 'مكانك', 'وين', 'الموقع', 'موقع', 'موقعك', 'لوكيشن',
    'رقم', 'عنوان', 'مكان', 'اين', 'location'
  ];
  
  // Create regex for each blocked word individually
  blockedWords.forEach(word => {
    const wordRegex = new RegExp(`\\b${word}\\b`, 'gi');
    filteredMessage = filteredMessage.replace(wordRegex, '[كلمة محظورة]');
  });
  
  // Apply other filters with Arabic replacements
  filteredMessage = filteredMessage.replace(phoneRegex, '[رقم هاتف محذوف]');
  filteredMessage = filteredMessage.replace(generalPhoneRegex, '[رقم محذوف]');
  filteredMessage = filteredMessage.replace(emailRegex, '[بريد إلكتروني محذوف]');
  filteredMessage = filteredMessage.replace(urlRegex, '[رابط محذوف]');
  filteredMessage = filteredMessage.replace(socialMediaRegex, '[حساب محذوف]');
  filteredMessage = filteredMessage.replace(saudiIdRegex, '[رقم هوية محذوف]');
  filteredMessage = filteredMessage.replace(iqamaRegex, '[رقم إقامة محذوف]');
  filteredMessage = filteredMessage.replace(bankAccountRegex, '[معلومات بنكية محذوفة]');
  filteredMessage = filteredMessage.replace(creditCardRegex, '[رقم بطاقة محذوف]');
  filteredMessage = filteredMessage.replace(passwordRegex, '[كلمة مرور محذوفة]');
  filteredMessage = filteredMessage.replace(otpRegex, '[رمز التحقق محذوف]');
  filteredMessage = filteredMessage.replace(coordinatesRegex, '[إحداثيات محذوفة]');
  filteredMessage = filteredMessage.replace(arabicNumeralsRegex, '[رقم محذوف]');
  
  return filteredMessage;
};

// Check if message contains sensitive information
export const containsSensitiveInfo = (message: string): boolean => {
  const original = message;
  const filtered = enhancedFilterSensitiveInfo(message);
  return original !== filtered;
};

// Real-time filter for input prevention
export const filterInputRealTime = (input: string): string => {
  if (!input) return '';
  
  // Enhanced blocked words list
  const blockedWords = [
    'الرقم', 'العنوان', 'مكانك', 'وين', 'الموقع', 'موقع', 'موقعك', 'لوكيشن',
    'رقم', 'عنوان', 'مكان', 'اين', 'location'
  ];
  
  let filtered = input;
  
  // Remove Arabic numerals immediately
  filtered = filtered.replace(/[٠-٩]/g, '');
  
  // Remove blocked words individually
  blockedWords.forEach(word => {
    const wordRegex = new RegExp(`\\b${word}\\b`, 'gi');
    filtered = filtered.replace(wordRegex, '');
  });
  
  return filtered;
};

// Check if input contains forbidden content for real-time validation
export const containsForbiddenContent = (input: string): boolean => {
  const arabicNumeralsRegex = /[٠-٩]/;
  
  // Enhanced blocked words list
  const blockedWords = [
    'الرقم', 'العنوان', 'مكانك', 'وين', 'الموقع', 'موقع', 'موقعك', 'لوكيشن',
    'رقم', 'عنوان', 'مكان', 'اين', 'location'
  ];
  
  // Check for Arabic numerals
  if (arabicNumeralsRegex.test(input)) return true;
  
  // Check for each blocked word individually
  for (const word of blockedWords) {
    const wordRegex = new RegExp(`\\b${word}\\b`, 'i');
    if (wordRegex.test(input)) return true;
  }
  
  return false;
};

// Get the specific forbidden word that was detected
export const getForbiddenWord = (input: string): string => {
  const blockedWords = [
    'الرقم', 'العنوان', 'مكانك', 'وين', 'الموقع', 'موقع', 'موقعك', 'لوكيشن',
    'رقم', 'عنوان', 'مكان', 'اين', 'location'
  ];
  
  // Check for Arabic numerals first
  if (/[٠-٩]/.test(input)) return 'الأرقام العربية';
  
  // Check for each blocked word
  for (const word of blockedWords) {
    const wordRegex = new RegExp(`\\b${word}\\b`, 'i');
    if (wordRegex.test(input)) return word;
  }
  
  return '';
};
