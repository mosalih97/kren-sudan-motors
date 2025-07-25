
import { useEffect, useCallback } from 'react';
import { useSecurityLogger } from '@/hooks/useSecurityLogger';
import { useAuth } from '@/contexts/AuthContext';

export const useSecurityMonitor = () => {
  const { logSuspiciousActivity } = useSecurityLogger();
  const { user } = useAuth();

  // مراقبة المحاولات المشبوهة
  const monitorSuspiciousActivity = useCallback(() => {
    // مراقبة عدد النقرات المتكررة
    let clickCount = 0;
    const clickThreshold = 10;
    const timeWindow = 5000; // 5 ثوان

    const handleClick = () => {
      clickCount++;
      if (clickCount > clickThreshold) {
        logSuspiciousActivity('excessive_clicking', {
          clickCount,
          timeWindow,
          timestamp: new Date().toISOString()
        });
      }
    };

    // مراقبة التنقل السريع
    let navigationCount = 0;
    const navigationThreshold = 20;
    const originalPushState = window.history.pushState;
    
    window.history.pushState = function(...args) {
      navigationCount++;
      if (navigationCount > navigationThreshold) {
        logSuspiciousActivity('excessive_navigation', {
          navigationCount,
          timeWindow,
          timestamp: new Date().toISOString()
        });
      }
      return originalPushState.apply(this, args);
    };

    // إعادة تعيين العدادات
    const resetCounts = () => {
      clickCount = 0;
      navigationCount = 0;
    };

    const interval = setInterval(resetCounts, timeWindow);

    document.addEventListener('click', handleClick);

    return () => {
      clearInterval(interval);
      document.removeEventListener('click', handleClick);
      window.history.pushState = originalPushState;
    };
  }, [logSuspiciousActivity]);

  // مراقبة أخطاء وحدة التحكم
  useEffect(() => {
    const originalError = console.error;
    console.error = (...args) => {
      if (user) {
        logSuspiciousActivity('console_error', {
          error: args.join(' '),
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent
        });
      }
      originalError.apply(console, args);
    };

    return () => {
      console.error = originalError;
    };
  }, [logSuspiciousActivity, user]);

  // مراقبة محاولات الوصول غير المصرح بها
  const monitorUnauthorizedAccess = useCallback(() => {
    const protectedPaths = ['/admin', '/profile', '/messages'];
    
    const checkAccess = () => {
      const currentPath = window.location.pathname;
      if (protectedPaths.some(path => currentPath.startsWith(path)) && !user) {
        logSuspiciousActivity('unauthorized_access_attempt', {
          path: currentPath,
          timestamp: new Date().toISOString(),
          referrer: document.referrer
        });
      }
    };

    checkAccess();
    window.addEventListener('popstate', checkAccess);

    return () => {
      window.removeEventListener('popstate', checkAccess);
    };
  }, [logSuspiciousActivity, user]);

  useEffect(() => {
    const cleanup1 = monitorSuspiciousActivity();
    const cleanup2 = monitorUnauthorizedAccess();

    return () => {
      cleanup1();
      cleanup2();
    };
  }, [monitorSuspiciousActivity, monitorUnauthorizedAccess]);

  return {
    monitorSuspiciousActivity,
    monitorUnauthorizedAccess
  };
};
