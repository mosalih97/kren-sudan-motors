
export const filterSensitiveInfo = (message: string): string => {
  // إزالة أرقام الهواتف (الأرقام المتتالية 8-15 رقم)
  const phoneRegex = /\b\d{8,15}\b/g;
  
  // إزالة البريد الإلكتروني
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
  
  // إزالة الروابط
  const urlRegex = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/g;
  
  // إزالة أرقام الهوية (أرقام طويلة)
  const idRegex = /\b\d{10,20}\b/g;
  
  // إزالة أرقام الحسابات البنكية
  const bankRegex = /\b(?:IBAN|iban|رقم الحساب|حساب)\s*:?\s*\w+/gi;
  
  // إزالة معلومات بطاقات الائتمان
  const creditCardRegex = /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g;
  
  // إزالة كلمات المرور المحتملة
  const passwordRegex = /\b(?:password|كلمة مرور|كلمة السر|رمز|pin)\s*:?\s*\S+/gi;
  
  // إزالة مفاتيح API أو tokens
  const apiKeyRegex = /\b[A-Za-z0-9]{32,}\b/g;
  
  // إزالة أرقام CVV
  const cvvRegex = /\b\d{3,4}\b/g;
  
  let filteredMessage = message;
  
  // تطبيق المرشحات
  filteredMessage = filteredMessage.replace(phoneRegex, '[رقم هاتف محذوف]');
  filteredMessage = filteredMessage.replace(emailRegex, '[بريد إلكتروني محذوف]');
  filteredMessage = filteredMessage.replace(urlRegex, '[رابط محذوف]');
  filteredMessage = filteredMessage.replace(idRegex, '[رقم هوية محذوف]');
  filteredMessage = filteredMessage.replace(bankRegex, '[معلومات بنكية محذوفة]');
  filteredMessage = filteredMessage.replace(creditCardRegex, '[رقم بطاقة محذوف]');
  filteredMessage = filteredMessage.replace(passwordRegex, '[كلمة مرور محذوفة]');
  filteredMessage = filteredMessage.replace(apiKeyRegex, '[مفتاح API محذوف]');
  filteredMessage = filteredMessage.replace(cvvRegex, '[CVV محذوف]');
  
  return filteredMessage;
};
