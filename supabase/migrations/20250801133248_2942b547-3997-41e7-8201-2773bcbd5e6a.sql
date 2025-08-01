
-- إنشاء جدول admin_users إذا لم يكن موجوداً مع البيانات المطلوبة
INSERT INTO public.admin_users (email) 
VALUES ('m.el3min3@gmail.com')
ON CONFLICT (email) DO NOTHING;

-- إنشاء دالة للتحقق من صلاحية المدير
CREATE OR REPLACE FUNCTION public.check_admin_access(user_email text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE email = user_email
  );
$$;

-- إنشاء دالة محسّنة لإحصائيات المدير
CREATE OR REPLACE FUNCTION public.get_admin_stats()
RETURNS jsonb
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT jsonb_build_object(
    'total_users', COALESCE((SELECT COUNT(*) FROM public.profiles), 0),
    'total_ads', COALESCE((SELECT COUNT(*) FROM public.ads), 0),
    'active_ads', COALESCE((SELECT COUNT(*) FROM public.ads WHERE status = 'active'), 0),
    'premium_users', COALESCE((SELECT COUNT(*) FROM public.profiles WHERE membership_type = 'premium' OR is_premium = true), 0),
    'total_boosts', COALESCE((SELECT COUNT(*) FROM public.ad_boosts WHERE status = 'active'), 0),
    'new_users_this_month', COALESCE((
      SELECT COUNT(*) FROM public.profiles 
      WHERE created_at >= date_trunc('month', now())
    ), 0)
  );
$$;

-- تأكد من وجود سياسة RLS للوصول السريع
DROP POLICY IF EXISTS "Admin users can access admin data" ON public.admin_users;
CREATE POLICY "Admin users can access admin data" 
ON public.admin_users 
FOR SELECT 
USING (true);

-- إنشاء فهرس لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON public.admin_users(email);
