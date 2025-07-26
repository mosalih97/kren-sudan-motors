
-- Create admin credentials table
CREATE TABLE IF NOT EXISTS public.admin_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create admin sessions table
CREATE TABLE IF NOT EXISTS public.admin_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_token TEXT NOT NULL UNIQUE,
  ip_address TEXT,
  user_agent TEXT,
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMPTZ DEFAULT (now() + INTERVAL '24 hours'),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on admin tables
ALTER TABLE public.admin_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_sessions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for admin_credentials (only admins can access)
CREATE POLICY "Admins can view credentials" ON public.admin_credentials
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND membership_type = 'admin'
  ));

CREATE POLICY "Admins can update credentials" ON public.admin_credentials
  FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND membership_type = 'admin'
  ));

-- Create RLS policies for admin_sessions
CREATE POLICY "Admin sessions policy" ON public.admin_sessions
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND membership_type = 'admin'
  ));

-- Grant current user admin role if they don't have it
UPDATE public.profiles 
SET membership_type = 'admin', is_premium = true
WHERE user_id = auth.uid() AND membership_type != 'admin';

-- Insert default admin credentials if they don't exist
INSERT INTO public.admin_credentials (username, password_hash)
SELECT 'admin', crypt('admin123', gen_salt('bf'))
WHERE NOT EXISTS (
  SELECT 1 FROM public.admin_credentials WHERE username = 'admin'
);

-- Create admin login function
CREATE OR REPLACE FUNCTION public.admin_login(
  username_param TEXT,
  password_param TEXT,
  ip_address_param TEXT DEFAULT NULL,
  user_agent_param TEXT DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  admin_creds RECORD;
  current_user_id UUID;
  session_token TEXT;
  result JSONB;
BEGIN
  -- Get current authenticated user
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'المستخدم غير مسجل دخول'
    );
  END IF;
  
  -- Check if user is admin
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = current_user_id AND membership_type = 'admin'
  ) THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'ليس لديك صلاحيات إدارية'
    );
  END IF;
  
  -- Get admin credentials
  SELECT * INTO admin_creds FROM public.admin_credentials WHERE username = username_param;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'بيانات دخول خاطئة'
    );
  END IF;
  
  -- Verify password
  IF admin_creds.password_hash != crypt(password_param, admin_creds.password_hash) THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'بيانات دخول خاطئة'
    );
  END IF;
  
  -- Generate session token
  session_token := encode(gen_random_bytes(32), 'hex');
  
  -- Invalidate old sessions for this admin
  UPDATE public.admin_sessions 
  SET is_active = false 
  WHERE admin_user_id = current_user_id AND is_active = true;
  
  -- Create new session
  INSERT INTO public.admin_sessions (
    admin_user_id, session_token, ip_address, user_agent
  ) VALUES (
    current_user_id, session_token, ip_address_param, user_agent_param
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'session_token', session_token,
    'admin_id', current_user_id,
    'expires_at', (now() + INTERVAL '24 hours')
  );
END;
$$;

-- Create admin session verification function
CREATE OR REPLACE FUNCTION public.verify_admin_session(token_param TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  session_record RECORD;
BEGIN
  SELECT * INTO session_record 
  FROM public.admin_sessions 
  WHERE session_token = token_param 
    AND is_active = true 
    AND expires_at > now();
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('valid', false, 'message', 'جلسة غير صالحة');
  END IF;
  
  -- Extend session
  UPDATE public.admin_sessions 
  SET expires_at = now() + INTERVAL '24 hours'
  WHERE session_token = token_param;
  
  RETURN jsonb_build_object(
    'valid', true,
    'admin_id', session_record.admin_user_id
  );
END;
$$;

-- Create admin logout function
CREATE OR REPLACE FUNCTION public.admin_logout(token_param TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.admin_sessions 
  SET is_active = false 
  WHERE session_token = token_param;
  
  RETURN jsonb_build_object('success', true, 'message', 'تم تسجيل الخروج بنجاح');
END;
$$;

-- Create admin dashboard stats view
CREATE OR REPLACE VIEW public.admin_dashboard_stats AS
SELECT 
  (SELECT COUNT(*) FROM public.profiles) as total_users,
  (SELECT COUNT(*) FROM public.profiles WHERE membership_type = 'premium') as premium_users,
  (SELECT COUNT(*) FROM public.profiles WHERE created_at >= date_trunc('month', now())) as new_users_this_month,
  (SELECT COUNT(*) FROM public.ads WHERE status = 'active') as active_ads,
  (SELECT COUNT(*) FROM public.ads WHERE status = 'deleted') as deleted_ads,
  (SELECT COUNT(*) FROM public.ads WHERE is_premium = true AND status = 'active') as premium_ads,
  (SELECT COUNT(*) FROM public.ad_boosts WHERE status = 'active' AND expires_at > now()) as active_boosts,
  (SELECT COUNT(*) FROM public.ad_boosts WHERE boost_plan = 'basic') as basic_boosts,
  (SELECT COUNT(*) FROM public.ad_boosts WHERE boost_plan = 'premium') as premium_boosts,
  (SELECT COUNT(*) FROM public.ad_boosts WHERE boost_plan = 'ultimate') as ultimate_boosts,
  (SELECT COALESCE(SUM(points), 0) FROM public.profiles) as total_points,
  (SELECT COALESCE(SUM(credits), 0) FROM public.profiles) as total_credits;

-- Grant access to the view for admins only
CREATE POLICY "Admin can view dashboard stats" ON public.admin_dashboard_stats
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND membership_type = 'admin'
  ));
