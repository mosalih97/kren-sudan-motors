
import { useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const useSessionManager = () => {
  const { user } = useAuth();

  const createSession = useCallback(async () => {
    if (!user) return;

    try {
      const sessionToken = crypto.randomUUID();
      
      const { error } = await supabase
        .from('user_sessions')
        .insert({
          user_id: user.id,
          session_token: sessionToken,
          ip_address: 'unknown', // Would need server-side implementation
          user_agent: navigator.userAgent,
          created_at: new Date().toISOString(),
          last_activity: new Date().toISOString(),
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        });

      if (error) {
        console.error('Failed to create session:', error);
      }
    } catch (error) {
      console.error('Session creation failed:', error);
    }
  }, [user]);

  const updateLastActivity = useCallback(async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('user_sessions')
        .update({ last_activity: new Date().toISOString() })
        .eq('user_id', user.id)
        .eq('is_active', true);

      if (error) {
        console.error('Failed to update session activity:', error);
      }
    } catch (error) {
      console.error('Session activity update failed:', error);
    }
  }, [user]);

  const invalidateAllSessions = useCallback(async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('user_sessions')
        .update({ is_active: false })
        .eq('user_id', user.id);

      if (error) {
        console.error('Failed to invalidate sessions:', error);
      }
    } catch (error) {
      console.error('Session invalidation failed:', error);
    }
  }, [user]);

  // Update activity every 5 minutes
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(updateLastActivity, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [user, updateLastActivity]);

  // Create session on mount
  useEffect(() => {
    if (user) {
      createSession();
    }
  }, [user, createSession]);

  return {
    createSession,
    updateLastActivity,
    invalidateAllSessions
  };
};
