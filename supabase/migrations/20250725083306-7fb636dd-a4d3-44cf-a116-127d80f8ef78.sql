
-- Phase 1: Critical Security Fixes

-- 1. Fix unsafe search_path in remaining functions
CREATE OR REPLACE FUNCTION public.verify_password_reset_token(reset_token text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  token_record RECORD;
  user_email TEXT;
  result JSONB := '{"success": false, "message": ""}'::jsonb;
BEGIN
  -- البحث عن الرمز
  SELECT * INTO token_record
  FROM public.password_reset_tokens
  WHERE token = reset_token
  AND expires_at > now()
  AND used = false;
  
  IF token_record IS NULL THEN
    result := jsonb_set(result, '{message}', '"الرمز غير صحيح أو منتهي الصلاحية"');
    RETURN result;
  END IF;
  
  -- الحصول على بريد المستخدم
  SELECT email INTO user_email
  FROM auth.users
  WHERE id = token_record.user_id;
  
  result := jsonb_set(result, '{success}', 'true');
  result := jsonb_set(result, '{user_id}', to_jsonb(token_record.user_id));
  result := jsonb_set(result, '{email}', to_jsonb(user_email));
  
  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_password_reset_token(user_email text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  target_user_id UUID;
  reset_token TEXT;
  expires_time TIMESTAMPTZ;
  result JSONB := '{"success": false, "message": ""}'::jsonb;
BEGIN
  -- البحث عن المستخدم بالبريد الإلكتروني
  SELECT id INTO target_user_id
  FROM auth.users
  WHERE email = user_email;
  
  IF target_user_id IS NULL THEN
    result := jsonb_set(result, '{message}', '"البريد الإلكتروني غير مسجل"');
    RETURN result;
  END IF;
  
  -- إنشاء رمز عشوائي باستخدام طريقة أبسط وأكثر أماناً
  reset_token := encode(
    digest(
      random()::text || clock_timestamp()::text || user_email || target_user_id::text, 
      'sha256'::text
    ), 
    'hex'
  );
  
  -- تحديد وقت انتهاء الرمز (ساعة واحدة)
  expires_time := now() + interval '1 hour';
  
  -- حذف الرموز القديمة للمستخدم
  DELETE FROM public.password_reset_tokens 
  WHERE user_id = target_user_id;
  
  -- إدراج الرمز الجديد
  INSERT INTO public.password_reset_tokens (user_id, token, expires_at)
  VALUES (target_user_id, reset_token, expires_time);
  
  result := jsonb_set(result, '{success}', 'true');
  result := jsonb_set(result, '{token}', to_jsonb(reset_token));
  result := jsonb_set(result, '{user_id}', to_jsonb(target_user_id));
  result := jsonb_set(result, '{expires_at}', to_jsonb(expires_time));
  result := jsonb_set(result, '{message}', '"تم إنشاء رمز الاستعادة بنجاح"');
  
  RETURN result;
END;
$$;

-- 2. Tighten RLS policies - Remove anonymous access where not needed
-- Update notifications table to require authentication
DROP POLICY IF EXISTS "المستخدمون يمكنهم عرض إشعاراتهم" ON public.notifications;
CREATE POLICY "المستخدمون يمكنهم عرض إشعاراتهم" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id AND auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "المستخدمون يمكنهم تحديث إشعاراتهم" ON public.notifications;
CREATE POLICY "المستخدمون يمكنهم تحديث إشعاراتهم" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id AND auth.uid() IS NOT NULL);

-- Update messages table to require authentication
DROP POLICY IF EXISTS "المستخدمون يمكنهم عرض رسائلهم" ON public.messages;
CREATE POLICY "المستخدمون يمكنهم عرض رسائلهم" ON public.messages
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND 
    (auth.uid() = sender_id OR auth.uid() = receiver_id)
  );

DROP POLICY IF EXISTS "المستخدمون يمكنهم إرسال رسائل" ON public.messages;
CREATE POLICY "المستخدمون يمكنهم إرسال رسائل" ON public.messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id AND auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "المستخدمون يمكنهم تحديث رسائلهم" ON public.messages;
CREATE POLICY "المستخدمون يمكنهم تحديث رسائلهم" ON public.messages
  FOR UPDATE USING (auth.uid() = receiver_id AND auth.uid() IS NOT NULL);

-- Update favorites table to require authentication
DROP POLICY IF EXISTS "المستخدمون يمكنهم عرض مفضلاتهم" ON public.favorites;
CREATE POLICY "المستخدمون يمكنهم عرض مفضلاتهم" ON public.favorites
  FOR SELECT USING (auth.uid() = user_id AND auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "المستخدمون يمكنهم إضافة مفضلات" ON public.favorites;
CREATE POLICY "المستخدمون يمكنهم إضافة مفضلات" ON public.favorites
  FOR INSERT WITH CHECK (auth.uid() = user_id AND auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "المستخدمون يمكنهم حذف مفضلات" ON public.favorites;
CREATE POLICY "المستخدمون يمكنهم حذف مفضلات" ON public.favorites
  FOR DELETE USING (auth.uid() = user_id AND auth.uid() IS NOT NULL);

-- Update ad_interactions table to require authentication
DROP POLICY IF EXISTS "المستخدمون يمكنهم عرض تفاعلاتهم" ON public.ad_interactions;
CREATE POLICY "المستخدمون يمكنهم عرض تفاعلاتهم" ON public.ad_interactions
  FOR SELECT USING (auth.uid() = user_id AND auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "المستخدمون يمكنهم إضافة تفاعلاتهم" ON public.ad_interactions;
CREATE POLICY "المستخدمون يمكنهم إضافة تفاعلاتهم" ON public.ad_interactions
  FOR INSERT WITH CHECK (auth.uid() = user_id AND auth.uid() IS NOT NULL);

-- Update ad_boosts table to require authentication
DROP POLICY IF EXISTS "المستخدمون يمكنهم عرض ترقياتهم" ON public.ad_boosts;
CREATE POLICY "المستخدمون يمكنهم عرض ترقياتهم" ON public.ad_boosts
  FOR SELECT USING (user_id = auth.uid() AND auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "المستخدمون يمكنهم إضافة ترقيات" ON public.ad_boosts;
CREATE POLICY "المستخدمون يمكنهم إضافة ترقيات" ON public.ad_boosts
  FOR INSERT WITH CHECK (user_id = auth.uid() AND auth.uid() IS NOT NULL);

-- Update ad_boost_logs table to require authentication
DROP POLICY IF EXISTS "المستخدمون يمكنهم عرض تعزيزاتهم" ON public.ad_boost_logs;
CREATE POLICY "المستخدمون يمكنهم عرض تعزيزاتهم" ON public.ad_boost_logs
  FOR SELECT USING (auth.uid() = user_id AND auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "المستخدمون يمكنهم إضافة تعزيزات" ON public.ad_boost_logs;
CREATE POLICY "المستخدمون يمكنهم إضافة تعزيزات" ON public.ad_boost_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id AND auth.uid() IS NOT NULL);

-- Update profiles table to require authentication for sensitive operations
DROP POLICY IF EXISTS "المستخدمون يمكنهم تحديث ملفهم الش" ON public.profiles;
CREATE POLICY "المستخدمون يمكنهم تحديث ملفهم الش" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id AND auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "المستخدمون يمكنهم إنشاء ملفهم الش" ON public.profiles;
CREATE POLICY "المستخدمون يمكنهم إنشاء ملفهم الش" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id AND auth.uid() IS NOT NULL);

-- Update ads table to require authentication for sensitive operations
DROP POLICY IF EXISTS "المستخدمون يمكنهم إنشاء إعلاناتهم" ON public.ads;
CREATE POLICY "المستخدمون يمكنهم إنشاء إعلاناتهم" ON public.ads
  FOR INSERT WITH CHECK (auth.uid() = user_id AND auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "المستخدمون يمكنهم تحديث إعلاناتهم" ON public.ads;
CREATE POLICY "المستخدمون يمكنهم تحديث إعلاناتهم" ON public.ads
  FOR UPDATE USING (auth.uid() = user_id AND auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "المستخدمون يمكنهم حذف إعلاناتهم" ON public.ads;
CREATE POLICY "المستخدمون يمكنهم حذف إعلاناتهم" ON public.ads
  FOR DELETE USING (auth.uid() = user_id AND auth.uid() IS NOT NULL);

-- 3. Create security monitoring function
CREATE OR REPLACE FUNCTION public.log_security_event(
  event_type text,
  event_data jsonb DEFAULT '{}'::jsonb
) RETURNS void
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

-- Create security logs table
CREATE TABLE IF NOT EXISTS public.security_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  event_type text NOT NULL,
  event_data jsonb DEFAULT '{}'::jsonb,
  ip_address text,
  user_agent text,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on security logs
ALTER TABLE public.security_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view security logs
CREATE POLICY "Admins can view security logs" ON public.security_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() 
      AND membership_type = 'admin'
    )
  );

-- System can insert security logs
CREATE POLICY "System can insert security logs" ON public.security_logs
  FOR INSERT WITH CHECK (true);
