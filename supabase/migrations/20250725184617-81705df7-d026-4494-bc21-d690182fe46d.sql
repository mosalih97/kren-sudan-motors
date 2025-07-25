
-- Create admin dashboard statistics view
CREATE OR REPLACE VIEW admin_dashboard_stats AS
SELECT 
  (SELECT COUNT(*) FROM profiles) as total_users,
  (SELECT COUNT(*) FROM profiles WHERE membership_type = 'premium') as premium_users,
  (SELECT COUNT(*) FROM profiles WHERE created_at >= date_trunc('month', now())) as new_users_this_month,
  (SELECT COUNT(*) FROM ads WHERE status = 'active') as active_ads,
  (SELECT COUNT(*) FROM ads WHERE status = 'deleted') as deleted_ads,
  (SELECT COUNT(*) FROM ads WHERE is_premium = true) as premium_ads,
  (SELECT COUNT(*) FROM ad_boosts WHERE status = 'active') as active_boosts,
  (SELECT COUNT(*) FROM ad_boosts WHERE boost_plan = 'basic' AND status = 'active') as basic_boosts,
  (SELECT COUNT(*) FROM ad_boosts WHERE boost_plan = 'premium' AND status = 'active') as premium_boosts,
  (SELECT COUNT(*) FROM ad_boosts WHERE boost_plan = 'ultimate' AND status = 'active') as ultimate_boosts,
  (SELECT COALESCE(SUM(points), 0) FROM profiles) as total_points,
  (SELECT COALESCE(SUM(credits), 0) FROM profiles) as total_credits;

-- Create admin session management table
CREATE TABLE IF NOT EXISTS admin_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id uuid NOT NULL REFERENCES profiles(user_id),
  session_token text NOT NULL UNIQUE,
  ip_address text,
  user_agent text,
  created_at timestamp with time zone DEFAULT now(),
  expires_at timestamp with time zone DEFAULT (now() + interval '24 hours'),
  is_active boolean DEFAULT true
);

-- Enable RLS for admin sessions
ALTER TABLE admin_sessions ENABLE ROW LEVEL SECURITY;

-- RLS policies for admin sessions
CREATE POLICY "Admin can manage sessions" ON admin_sessions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() 
      AND membership_type = 'admin'
    )
  );

-- Function to create admin session
CREATE OR REPLACE FUNCTION create_admin_session(
  username_input text,
  password_input text,
  ip_addr text DEFAULT NULL,
  user_agent_input text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  admin_creds RECORD;
  admin_profile RECORD;
  session_token text;
  result jsonb;
BEGIN
  -- Get admin credentials
  SELECT * INTO admin_creds FROM admin_credentials LIMIT 1;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'message', 'بيانات المدير غير موجودة');
  END IF;
  
  -- Verify credentials
  IF admin_creds.username != username_input OR admin_creds.password_hash != crypt(password_input, admin_creds.password_hash) THEN
    RETURN jsonb_build_object('success', false, 'message', 'اسم المستخدم أو كلمة المرور خاطئة');
  END IF;
  
  -- Get admin profile
  SELECT * INTO admin_profile FROM profiles WHERE membership_type = 'admin' LIMIT 1;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'message', 'لا يوجد مدير مسجل');
  END IF;
  
  -- Generate session token
  session_token := encode(gen_random_bytes(32), 'hex');
  
  -- Create session
  INSERT INTO admin_sessions (admin_user_id, session_token, ip_address, user_agent)
  VALUES (admin_profile.user_id, session_token, ip_addr, user_agent_input);
  
  RETURN jsonb_build_object(
    'success', true,
    'session_token', session_token,
    'admin_id', admin_profile.user_id,
    'expires_at', (now() + interval '24 hours')
  );
END;
$$;

-- Function to verify admin session
CREATE OR REPLACE FUNCTION verify_admin_session(token text) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  session_record RECORD;
  result jsonb;
BEGIN
  SELECT * INTO session_record 
  FROM admin_sessions 
  WHERE session_token = token 
    AND is_active = true 
    AND expires_at > now();
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('valid', false, 'message', 'جلسة غير صالحة');
  END IF;
  
  -- Update last activity
  UPDATE admin_sessions 
  SET expires_at = now() + interval '24 hours'
  WHERE session_token = token;
  
  RETURN jsonb_build_object(
    'valid', true,
    'admin_id', session_record.admin_user_id
  );
END;
$$;

-- Function to logout admin session
CREATE OR REPLACE FUNCTION logout_admin_session(token text) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE admin_sessions 
  SET is_active = false 
  WHERE session_token = token;
  
  RETURN jsonb_build_object('success', true, 'message', 'تم تسجيل الخروج بنجاح');
END;
$$;

-- Function to logout all admin sessions
CREATE OR REPLACE FUNCTION logout_all_admin_sessions(admin_id uuid) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE admin_sessions 
  SET is_active = false 
  WHERE admin_user_id = admin_id;
  
  RETURN jsonb_build_object('success', true, 'message', 'تم تسجيل الخروج من جميع الجلسات');
END;
$$;

-- Function to delete ad permanently
CREATE OR REPLACE FUNCTION delete_ad_permanently(ad_id_param uuid, admin_user_id uuid) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb := '{"success": false, "message": ""}'::jsonb;
BEGIN
  -- Verify admin permissions
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = admin_user_id 
    AND membership_type = 'admin'
  ) THEN
    result := jsonb_set(result, '{message}', '"ليس لديك صلاحيات إدارية"');
    RETURN result;
  END IF;
  
  -- Delete related records first
  DELETE FROM favorites WHERE ad_id = ad_id_param;
  DELETE FROM ad_boosts WHERE ad_id = ad_id_param;
  DELETE FROM ad_boost_logs WHERE ad_id = ad_id_param;
  DELETE FROM ad_interactions WHERE ad_id = ad_id_param;
  DELETE FROM messages WHERE ad_id = ad_id_param;
  
  -- Delete the ad
  DELETE FROM ads WHERE id = ad_id_param;
  
  IF NOT FOUND THEN
    result := jsonb_set(result, '{message}', '"الإعلان غير موجود"');
    RETURN result;
  END IF;
  
  result := jsonb_set(result, '{success}', 'true');
  result := jsonb_set(result, '{message}', '"تم حذف الإعلان نهائياً"');
  
  RETURN result;
END;
$$;

-- Set initial admin credentials if not exist
INSERT INTO admin_credentials (username, password_hash)
SELECT 'admin', crypt('admin123', gen_salt('bf'))
WHERE NOT EXISTS (SELECT 1 FROM admin_credentials);
