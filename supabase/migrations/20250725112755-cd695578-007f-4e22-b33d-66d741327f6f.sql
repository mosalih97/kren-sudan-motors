
-- Phase 1: Critical RLS Policy Fixes

-- Fix profiles table policy to require authentication for viewing profiles
DROP POLICY IF EXISTS "المستخدمون يمكنهم عرض جميع الملفا" ON public.profiles;
CREATE POLICY "المستخدمون يمكنهم عرض جميع الملفا" ON public.profiles
FOR SELECT USING (auth.uid() IS NOT NULL);

-- Fix admin_credentials policies to require admin authentication
DROP POLICY IF EXISTS "admin_can_view_credentials" ON public.admin_credentials;
CREATE POLICY "admin_can_view_credentials" ON public.admin_credentials
FOR SELECT USING (
  auth.uid() IS NOT NULL AND 
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND membership_type = 'admin'
  )
);

DROP POLICY IF EXISTS "admin_can_update_credentials" ON public.admin_credentials;
CREATE POLICY "admin_can_update_credentials" ON public.admin_credentials
FOR UPDATE USING (
  auth.uid() IS NOT NULL AND 
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND membership_type = 'admin'
  )
);

-- Fix security_logs policies to require admin authentication
DROP POLICY IF EXISTS "Admins can view security logs" ON public.security_logs;
CREATE POLICY "Admins can view security logs" ON public.security_logs
FOR SELECT USING (
  auth.uid() IS NOT NULL AND 
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND membership_type = 'admin'
  )
);

DROP POLICY IF EXISTS "System can insert security logs" ON public.security_logs;
CREATE POLICY "System can insert security logs" ON public.security_logs
FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Fix password_reset_tokens policies to require user authentication
DROP POLICY IF EXISTS "Users can view their own active reset tokens" ON public.password_reset_tokens;
CREATE POLICY "Users can view their own active reset tokens" ON public.password_reset_tokens
FOR SELECT USING (
  auth.uid() IS NOT NULL AND 
  auth.uid() = user_id AND 
  used = false AND 
  expires_at > now()
);

DROP POLICY IF EXISTS "System can update reset tokens" ON public.password_reset_tokens;
CREATE POLICY "System can update reset tokens" ON public.password_reset_tokens
FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Add search_path security to database functions
CREATE OR REPLACE FUNCTION public.log_security_event(event_type text, event_data jsonb DEFAULT '{}'::jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.security_logs (
    user_id,
    event_type,
    event_data,
    ip_address,
    user_agent,
    created_at
  ) VALUES (
    auth.uid(),
    event_type,
    event_data,
    current_setting('request.headers', true)::json->>'x-forwarded-for',
    current_setting('request.headers', true)::json->>'user-agent',
    now()
  );
END;
$$;

-- Add rate limiting table for password reset requests
CREATE TABLE IF NOT EXISTS public.password_reset_attempts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  email text NOT NULL,
  ip_address text,
  attempted_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now()
);

-- Add RLS to password reset attempts
ALTER TABLE public.password_reset_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "System can manage reset attempts" ON public.password_reset_attempts
FOR ALL USING (true);

-- Add index for rate limiting queries
CREATE INDEX IF NOT EXISTS idx_password_reset_attempts_email_time 
ON public.password_reset_attempts (email, attempted_at);

-- Add cleanup function for old reset attempts
CREATE OR REPLACE FUNCTION public.cleanup_old_reset_attempts()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  deleted_count integer;
BEGIN
  DELETE FROM public.password_reset_attempts
  WHERE attempted_at < now() - interval '1 hour';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RETURN deleted_count;
END;
$$;

-- Add session management table
CREATE TABLE IF NOT EXISTS public.user_sessions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  session_token text NOT NULL,
  ip_address text,
  user_agent text,
  created_at timestamp with time zone DEFAULT now(),
  last_activity timestamp with time zone DEFAULT now(),
  expires_at timestamp with time zone DEFAULT now() + interval '24 hours',
  is_active boolean DEFAULT true
);

-- Add RLS to user sessions
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own sessions" ON public.user_sessions
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own sessions" ON public.user_sessions
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "System can insert sessions" ON public.user_sessions
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Add index for session management
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_token 
ON public.user_sessions (user_id, session_token);

CREATE INDEX IF NOT EXISTS idx_user_sessions_expires 
ON public.user_sessions (expires_at);
