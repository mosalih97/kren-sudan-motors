
-- التأكد من وجود جدول admin_users وإضافة البريد الإلكتروني كمدير
INSERT INTO public.admin_users (email) 
VALUES ('m.el3min3@gmail.com')
ON CONFLICT (email) DO NOTHING;

-- التأكد من أن دالة is_admin تعمل بشكل صحيح
CREATE OR REPLACE FUNCTION public.is_admin(user_email text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE email = user_email
  );
$$;

-- تحسين دالة get_admin_dashboard_stats للحصول على النتائج بشكل أسرع
CREATE OR REPLACE FUNCTION public.get_admin_dashboard_stats()
RETURNS json
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT json_build_object(
    'total_users', COALESCE((SELECT COUNT(*) FROM public.profiles), 0),
    'total_ads', COALESCE((SELECT COUNT(*) FROM public.ads), 0),
    'active_ads', COALESCE((SELECT COUNT(*) FROM public.ads WHERE status = 'active'), 0),
    'premium_users', COALESCE((SELECT COUNT(*) FROM public.profiles WHERE membership_type = 'premium' OR is_premium = true), 0),
    'total_boosts', COALESCE((SELECT COUNT(*) FROM public.ad_boosts WHERE status = 'active'), 0)
  );
$$;
