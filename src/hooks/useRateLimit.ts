
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface RateLimitConfig {
  maxAttempts: number;
  windowMinutes: number;
  blockDurationMinutes: number;
}

export const useRateLimit = (action: string, config: RateLimitConfig) => {
  const [isBlocked, setIsBlocked] = useState(false);
  const [attemptsLeft, setAttemptsLeft] = useState(config.maxAttempts);

  const checkRateLimit = useCallback(async (identifier: string): Promise<boolean> => {
    try {
      const windowStart = new Date(Date.now() - config.windowMinutes * 60 * 1000);
      
      // Check recent attempts
      const { data: attempts, error } = await supabase
        .from('password_reset_attempts')
        .select('*')
        .eq('email', identifier)
        .gte('attempted_at', windowStart.toISOString())
        .order('attempted_at', { ascending: false });

      if (error) {
        console.error('Rate limit check error:', error);
        return false; // Allow on error to prevent service disruption
      }

      const attemptCount = attempts?.length || 0;
      const remaining = Math.max(0, config.maxAttempts - attemptCount);
      
      setAttemptsLeft(remaining);
      
      if (attemptCount >= config.maxAttempts) {
        setIsBlocked(true);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Rate limit check failed:', error);
      return false;
    }
  }, [config.maxAttempts, config.windowMinutes]);

  const recordAttempt = useCallback(async (identifier: string) => {
    try {
      const { error } = await supabase
        .from('password_reset_attempts')
        .insert({
          email: identifier,
          ip_address: 'unknown', // Would need server-side implementation for real IP
          attempted_at: new Date().toISOString()
        });

      if (error) {
        console.error('Failed to record attempt:', error);
      }
    } catch (error) {
      console.error('Record attempt failed:', error);
    }
  }, []);

  return {
    checkRateLimit,
    recordAttempt,
    isBlocked,
    attemptsLeft
  };
};
