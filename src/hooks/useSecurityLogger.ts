
import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { sanitizeHtml } from '@/utils/securityValidation';

export const useSecurityLogger = () => {
  const { user } = useAuth();

  const logSecurityEvent = useCallback(async (
    eventType: string,
    eventData: Record<string, any> = {}
  ) => {
    try {
      // Only log if user is authenticated
      if (!user) return;

      // Sanitize event data
      const sanitizedData = Object.entries(eventData).reduce((acc, [key, value]) => {
        if (typeof value === 'string') {
          acc[key] = sanitizeHtml(value);
        } else if (typeof value === 'object' && value !== null) {
          acc[key] = JSON.parse(JSON.stringify(value)); // Deep clone
        } else {
          acc[key] = value;
        }
        return acc;
      }, {} as Record<string, any>);

      // Add timestamp and user context
      const enhancedData = {
        ...sanitizedData,
        timestamp: new Date().toISOString(),
        user_id: user.id,
        session_id: crypto.randomUUID()
      };

      await supabase.rpc('log_security_event', {
        event_type: sanitizeHtml(eventType),
        event_data: enhancedData
      });
    } catch (error) {
      console.error('Failed to log security event:', error);
    }
  }, [user]);

  const logAuthEvent = useCallback(async (
    action: 'login' | 'logout' | 'signup' | 'password_reset',
    success: boolean,
    additionalData?: Record<string, any>
  ) => {
    await logSecurityEvent(`auth_${action}`, {
      success,
      ...additionalData
    });
  }, [logSecurityEvent]);

  const logSuspiciousActivity = useCallback(async (
    activity: string,
    details: Record<string, any> = {}
  ) => {
    await logSecurityEvent('suspicious_activity', {
      activity: sanitizeHtml(activity),
      details,
      severity: 'high'
    });
  }, [logSecurityEvent]);

  return { 
    logSecurityEvent,
    logAuthEvent,
    logSuspiciousActivity
  };
};
