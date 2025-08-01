
-- حذف الجداول السابقة للوحة التحكم
DROP TABLE IF EXISTS public.admin_sessions CASCADE;
DROP TABLE IF EXISTS public.admin_credentials CASCADE;
DROP FUNCTION IF EXISTS public.create_admin_session;
DROP FUNCTION IF EXISTS public.verify_admin_session;
DROP FUNCTION IF EXISTS public.logout_admin_session;

-- إنشاء جدول بسيط للمديرين
CREATE TABLE public.admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- تمكين RLS
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- سياسة RLS للمديرين
CREATE POLICY "Admin users can view admin table"
ON public.admin_users
FOR SELECT
USING (email = 'm.el3min3@gmail.com');

-- إضافة المدير الوحيد
INSERT INTO public.admin_users (email) 
VALUES ('m.el3min3@gmail.com')
ON CONFLICT (email) DO NOTHING;

-- دالة للتحقق من كون المستخدم مديراً
CREATE OR REPLACE FUNCTION public.is_admin(user_email TEXT)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE email = user_email
  );
$$;

-- دالة للحصول على إحصائيات المدير
CREATE OR REPLACE FUNCTION public.get_admin_dashboard_stats()
RETURNS JSON
LANGUAGE SQL
SECURITY DEFINER
AS $$
  SELECT json_build_object(
    'total_users', (SELECT COUNT(*) FROM public.profiles),
    'total_ads', (SELECT COUNT(*) FROM public.ads),
    'active_ads', (SELECT COUNT(*) FROM public.ads WHERE status = 'active'),
    'premium_users', (SELECT COUNT(*) FROM public.profiles WHERE membership_type = 'premium'),
    'total_boosts', (SELECT COUNT(*) FROM public.ad_boosts)
  );
$$;
