// فلتر لحظر الأرقام في الرسائل
export const filterMessage = (message: string): { isValid: boolean; filteredMessage: string; errorMessage?: string } => {
  // نمط لإيجاد الأرقام الإنجليزية والعربية
  const englishNumberPattern = /[0-9]/g;
  const arabicNumberPattern = /[٠-٩]/g;
  
  // التحقق من وجود أرقام
  const hasEnglishNumbers = englishNumberPattern.test(message);
  const hasArabicNumbers = arabicNumberPattern.test(message);
  
  if (hasEnglishNumbers || hasArabicNumbers) {
    return {
      isValid: false,
      filteredMessage: message,
      errorMessage: "لا يُسمح بإرسال الأرقام في الرسائل. للحصول على معلومات التواصل، يرجى استخدام أزرار الاتصال والواتساب."
    };
  }
  
  return {
    isValid: true,
    filteredMessage: message
  };
};