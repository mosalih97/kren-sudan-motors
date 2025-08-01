
import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSecurityLogger } from '@/hooks/useSecurityLogger';

export const SecurityAuditLogger = () => {
  const { user } = useAuth();
  const { logSecurityEvent } = useSecurityLogger();

  useEffect(() => {
    if (!user) return;

    // تسجيل معلومات الجلسة
    const sessionInfo = {
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform,
      cookieEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine,
      screen: {
        width: screen.width,
        height: screen.height,
        colorDepth: screen.colorDepth
      },
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      timestamp: new Date().toISOString()
    };

    logSecurityEvent('session_info', sessionInfo);

    // مراقبة تغيير الاتصال
    const handleOnlineStatusChange = () => {
      logSecurityEvent('connection_status_change', {
        online: navigator.onLine,
        timestamp: new Date().toISOString()
      });
    };

    window.addEventListener('online', handleOnlineStatusChange);
    window.addEventListener('offline', handleOnlineStatusChange);

    // مراقبة تغيير الصفحة
    const handleVisibilityChange = () => {
      logSecurityEvent('page_visibility_change', {
        hidden: document.hidden,
        visibilityState: document.visibilityState,
        timestamp: new Date().toISOString()
      });
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // مراقبة تغيير حجم النافذة
    const handleResize = () => {
      logSecurityEvent('window_resize', {
        width: window.innerWidth,
        height: window.innerHeight,
        timestamp: new Date().toISOString()
      });
    };

    window.addEventListener('resize', handleResize);

    // مراقبة أحداث لوحة المفاتيح الحساسة
    const handleKeyDown = (event: KeyboardEvent) => {
      // تسجيل محاولات الوصول لأدوات المطور
      if (event.key === 'F12' || 
          (event.ctrlKey && event.shiftKey && event.key === 'I') ||
          (event.ctrlKey && event.shiftKey && event.key === 'C') ||
          (event.ctrlKey && event.key === 'U')) {
        logSecurityEvent('dev_tools_access_attempt', {
          key: event.key,
          ctrlKey: event.ctrlKey,
          shiftKey: event.shiftKey,
          timestamp: new Date().toISOString()
        });
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('online', handleOnlineStatusChange);
      window.removeEventListener('offline', handleOnlineStatusChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [user, logSecurityEvent]);

  return null;
};
