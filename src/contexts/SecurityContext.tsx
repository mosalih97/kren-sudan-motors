
import React, { createContext, useContext, useCallback, ReactNode } from 'react';
import { useSecurityLogger } from '@/hooks/useSecurityLogger';
import { useAuth } from '@/contexts/AuthContext';

interface SecurityContextType {
  logSecurityEvent: (eventType: string, eventData?: Record<string, any>) => void;
  reportSuspiciousActivity: (activity: string, details?: Record<string, any>) => void;
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
  const { logSecurityEvent } = useSecurityLogger();
  const { user } = useAuth();

  const reportSuspiciousActivity = useCallback((
    activity: string,
    details: Record<string, any> = {}
  ) => {
    logSecurityEvent('suspicious_activity', {
      activity,
      details,
      timestamp: new Date().toISOString(),
      user_id: user?.id
    });
  }, [logSecurityEvent, user]);

  const value = {
    logSecurityEvent,
    reportSuspiciousActivity
  };

  return (
    <SecurityContext.Provider value={value}>
      {children}
    </SecurityContext.Provider>
  );
};
