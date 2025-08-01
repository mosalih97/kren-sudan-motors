
-- إنشاء جدول admin_users للمديرين
CREATE TABLE IF NOT EXISTS public.admin_users (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  email text NOT NULL UNIQUE,
  created_at timestamp with time zone DEFAULT now()
);

-- إدراج المدير الأساسي
INSERT INTO public.admin_users (email) 
VALUES ('m.el3min3@gmail.com')
ON CONFLICT (email) DO NOTHING;

-- تفعيل RLS على الجدول
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- سياسة للسماح بالوصول لجميع المديرين
CREATE POLICY "Admin access" ON public.admin_users
FOR SELECT USING (true);

-- دالة للتحقق من صلاحية المدير
CREATE OR REPLACE FUNCTION public.is_admin_user(user_email text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE email = user_email
  );
$$;

-- دالة لجلب إحصائيات لوحة التحكم
CREATE OR REPLACE FUNCTION public.get_dashboard_stats()
RETURNS jsonb
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT jsonb_build_object(
    'total_users', (SELECT COUNT(*) FROM public.profiles),
    'total_ads', (SELECT COUNT(*) FROM public.ads),
    'active_ads', (SELECT COUNT(*) FROM public.ads WHERE status = 'active'),
    'premium_users', (SELECT COUNT(*) FROM public.profiles WHERE membership_type = 'premium'),
    'total_boosts', (SELECT COUNT(*) FROM public.ad_boosts WHERE status = 'active'),
    'new_users_today', (
      SELECT COUNT(*) FROM public.profiles 
      WHERE created_at >= CURRENT_DATE
    ),
    'revenue_today', (
      SELECT COALESCE(SUM(cost), 0) FROM public.ad_boosts 
      WHERE DATE(boosted_at) = CURRENT_DATE
    )
  );
$$;

-- فهرس لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON public.admin_users(email);
CREATE INDEX IF NOT EXISTS idx_profiles_membership ON public.profiles(membership_type);
CREATE INDEX IF NOT EXISTS idx_ads_status ON public.ads(status);
CREATE INDEX IF NOT EXISTS idx_ad_boosts_status ON public.ad_boosts(status);
