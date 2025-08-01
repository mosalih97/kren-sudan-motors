
import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import { useSecurityMonitor } from '@/hooks/useSecurityMonitor';
import { useSessionManager } from '@/hooks/useSessionManager';
import { useAuth } from '@/contexts/AuthContext';
import { SecureStorageManager } from '@/components/security/SecureStorageManager';

interface SecurityContextType {
  isMonitoring: boolean;
}

const SecurityContext = createContext<SecurityContextType | undefined>(undefined);

export const useSecurityContext = () => {
  const context = useContext(SecurityContext);
  if (!context) {
    throw new Error('useSecurityContext must be used within a SecurityProvider');
  }
  return context;
};

interface SecurityProviderProps {
  children: ReactNode;
}

export const SecurityProvider: React.FC<SecurityProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const { monitorSuspiciousActivity, monitorUnauthorizedAccess } = useSecurityMonitor();
  const { updateLastActivity } = useSessionManager();

  useEffect(() => {
    if (user) {
      // تفعيل مراقبة النشاطات المشبوهة
      const cleanup1 = monitorSuspiciousActivity();
      const cleanup2 = monitorUnauthorizedAccess();

      // تحديث آخر نشاط عند التفاعل
      const handleUserActivity = () => {
        updateLastActivity();
      };

      // مراقبة أحداث التفاعل
      const events = ['click', 'scroll', 'keypress', 'mousemove'];
      events.forEach(event => {
        document.addEventListener(event, handleUserActivity, { passive: true });
      });

      return () => {
        cleanup1();
        cleanup2();
        events.forEach(event => {
          document.removeEventListener(event, handleUserActivity);
        });
      };
    }
  }, [user, monitorSuspiciousActivity, monitorUnauthorizedAccess, updateLastActivity]);

  const value = {
    isMonitoring: !!user
  };

  return (
    <SecurityContext.Provider value={value}>
      <SecureStorageManager />
      {children}
    </SecurityContext.Provider>
  );
};
