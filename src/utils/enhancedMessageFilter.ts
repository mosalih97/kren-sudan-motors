
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
  
  // Apply filters with Arabic replacements
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
  
  return filteredMessage;
};

// Check if message contains sensitive information
export const containsSensitiveInfo = (message: string): boolean => {
  const original = message;
  const filtered = enhancedFilterSensitiveInfo(message);
  return original !== filtered;
};
