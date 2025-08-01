
-- إنشاء جدول المدراء
CREATE TABLE IF NOT EXISTS public.admin_users (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    email text UNIQUE NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- إضافة البريد الإلكتروني للمدير
INSERT INTO public.admin_users (email) 
VALUES ('admin@addad.com')
ON CONFLICT (email) DO NOTHING;

-- إنشاء فانكشن للتحقق من صلاحيات المدير
CREATE OR REPLACE FUNCTION public.is_admin_user(email_param text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE email = email_param
  );
$$;

-- إنشاء فانكشن لتسجيل دخول المدير
CREATE OR REPLACE FUNCTION public.admin_login(
  email_param text,
  password_param text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result json;
BEGIN
  -- التحقق من صحة بيانات المدير (محاكاة)
  IF email_param = 'admin@addad.com' AND password_param = 'admin123' THEN
    -- التحقق من وجود المدير في الجدول
    IF EXISTS (SELECT 1 FROM public.admin_users WHERE email = email_param) THEN
      result := json_build_object(
        'success', true,
        'user', json_build_object(
          'id', 1,
          'name', 'المدير العام',
          'email', email_param,
          'role', 'admin'
        )
      );
    ELSE
      result := json_build_object('success', false, 'message', 'مستخدم غير مصرح له');
    END IF;
  ELSE
    result := json_build_object('success', false, 'message', 'بيانات الدخول غير صحيحة');
  END IF;
  
  RETURN result;
END;
$$;

-- إنشاء فانكشن لجلب إحصائيات الإدارة
CREATE OR REPLACE FUNCTION public.get_admin_stats()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  stats json;
  total_ads integer;
  total_users integer;
  active_ads integer;
BEGIN
  -- جلب عدد الإعلانات الإجمالي
  SELECT COUNT(*) INTO total_ads FROM public.ads;
  
  -- جلب عدد المستخدمين الإجمالي
  SELECT COUNT(*) INTO total_users FROM public.profiles;
  
  -- جلب عدد الإعلانات النشطة
  SELECT COUNT(*) INTO active_ads FROM public.ads WHERE status = 'active';
  
  stats := json_build_object(
    'total_ads', COALESCE(total_ads, 0),
    'total_users', COALESCE(total_users, 0),
    'active_ads', COALESCE(active_ads, 0),
    'growth_rate', '24.8%'
  );
  
  RETURN stats;
END;
$$;
