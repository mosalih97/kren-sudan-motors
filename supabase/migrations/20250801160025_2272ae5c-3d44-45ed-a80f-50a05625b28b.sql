
-- إنشاء جدول المديرين
CREATE TABLE public.admin_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- إضافة مدير افتراضي
INSERT INTO public.admin_users (email) VALUES ('m.el3min3@gmail.com');

-- إنشاء جدول إحصائيات لوحة التحكم
CREATE TABLE public.dashboard_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  total_users bigint DEFAULT 0,
  total_ads bigint DEFAULT 0,
  active_ads bigint DEFAULT 0,
  premium_users bigint DEFAULT 0,
  total_revenue bigint DEFAULT 0,
  updated_at timestamptz DEFAULT now()
);

-- دالة للتحقق من صلاحيات المدير
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
CREATE OR REPLACE FUNCTION public.get_admin_dashboard_stats()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'total_users', COALESCE((SELECT COUNT(*) FROM public.profiles), 0),
    'total_ads', COALESCE((SELECT COUNT(*) FROM public.ads), 0),
    'active_ads', COALESCE((SELECT COUNT(*) FROM public.ads WHERE status = 'active'), 0),
    'premium_users', COALESCE((SELECT COUNT(*) FROM public.profiles WHERE membership_type = 'premium'), 0),
    'total_boosts', COALESCE((SELECT COUNT(*) FROM public.ad_boosts WHERE status = 'active'), 0),
    'total_revenue', COALESCE((SELECT SUM(cost) FROM public.ad_boosts), 0),
    'new_users_today', COALESCE((
      SELECT COUNT(*) FROM public.profiles 
      WHERE created_at >= CURRENT_DATE
    ), 0),
    'ads_today', COALESCE((
      SELECT COUNT(*) FROM public.ads 
      WHERE created_at >= CURRENT_DATE
    ), 0)
  ) INTO result;
  
  RETURN result;
END;
$$;

-- دالة لجلب قائمة المستخدمين للمدير
CREATE OR REPLACE FUNCTION public.get_users_list()
RETURNS TABLE(
  user_id uuid,
  display_name text,
  phone text,
  city text,
  membership_type text,
  points integer,
  credits integer,
  created_at timestamptz,
  ads_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.user_id,
    p.display_name,
    p.phone,
    p.city,
    p.membership_type,
    p.points,
    p.credits,
    p.created_at,
    COALESCE(a.ads_count, 0) as ads_count
  FROM public.profiles p
  LEFT JOIN (
    SELECT user_id, COUNT(*) as ads_count
    FROM public.ads
    WHERE status = 'active'
    GROUP BY user_id
  ) a ON p.user_id = a.user_id
  ORDER BY p.created_at DESC
  LIMIT 100;
END;
$$;

-- دالة لجلب قائمة الإعلانات
CREATE OR REPLACE FUNCTION public.get_ads_list()
RETURNS TABLE(
  id uuid,
  title text,
  brand text,
  model text,
  price bigint,
  city text,
  status text,
  view_count integer,
  created_at timestamptz,
  user_display_name text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id,
    a.title,
    a.brand,
    a.model,
    a.price,
    a.city,
    a.status,
    a.view_count,
    a.created_at,
    p.display_name as user_display_name
  FROM public.ads a
  LEFT JOIN public.profiles p ON a.user_id = p.user_id
  ORDER BY a.created_at DESC
  LIMIT 100;
END;
$$;

-- إنشاء سياسات الأمان
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admin can view admin users"
  ON public.admin_users
  FOR SELECT
  USING (true);

ALTER TABLE public.dashboard_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admin can view dashboard stats"
  ON public.dashboard_stats
  FOR SELECT
  USING (true);
