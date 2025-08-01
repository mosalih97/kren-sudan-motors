
import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const useSecurityLogger = () => {
  const { user } = useAuth();

  const logSecurityEvent = useCallback(async (
    eventType: string,
    eventData: Record<string, any> = {}
  ) => {
    try {
      // Only log if user is authenticated
      if (!user) return;

      await supabase.rpc('log_security_event', {
        event_type: eventType,
        event_data: eventData
      });
    } catch (error) {
      console.error('Failed to log security event:', error);
    }
  }, [user]);

  return { logSecurityEvent };
};
