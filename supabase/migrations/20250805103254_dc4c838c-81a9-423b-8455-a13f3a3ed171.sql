
-- إضافة جدول لجلسات الإدارة إذا لم يكن موجود
CREATE TABLE IF NOT EXISTS public.admin_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID REFERENCES public.admin_credentials(id) ON DELETE CASCADE,
  session_token TEXT UNIQUE NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ DEFAULT (now() + INTERVAL '24 hours'),
  is_active BOOLEAN DEFAULT true
);

-- إضافة RLS للجدول
ALTER TABLE public.admin_sessions ENABLE ROW LEVEL SECURITY;

-- سياسة للوصول الإداري
CREATE POLICY "Admin sessions policy" ON public.admin_sessions
FOR ALL USING (true);

-- التأكد من وجود جدول upgrade_logs مع الحقول المطلوبة
ALTER TABLE public.upgrade_logs 
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS notes TEXT;

-- دالة للبحث في المستخدمين (محسنة)
CREATE OR REPLACE FUNCTION public.admin_search_users(
  search_term TEXT DEFAULT '',
  membership_filter TEXT DEFAULT 'all',
  limit_count INTEGER DEFAULT 50
)
RETURNS TABLE(
  user_id UUID,
  display_name TEXT,
  phone TEXT,
  city TEXT,
  membership_type TEXT,
  is_premium BOOLEAN,
  points INTEGER,
  credits INTEGER,
  created_at TIMESTAMPTZ,
  premium_expires_at TIMESTAMPTZ,
  days_remaining INTEGER,
  ads_count BIGINT,
  user_id_display TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.user_id,
    p.display_name,
    p.phone,
    p.city,
    p.membership_type,
    p.is_premium,
    COALESCE(p.points, 0) as points,
    COALESCE(p.credits, 0) as credits,
    p.created_at,
    p.premium_expires_at,
    CASE 
      WHEN p.premium_expires_at IS NULL THEN 0
      WHEN p.premium_expires_at <= now() THEN 0
      ELSE GREATEST(0, EXTRACT(DAY FROM (p.premium_expires_at - now()))::INTEGER)
    END as days_remaining,
    COALESCE(ads.ads_count, 0) as ads_count,
    p.user_id_display
  FROM public.profiles p
  LEFT JOIN (
    SELECT user_id, COUNT(*)::BIGINT as ads_count
    FROM public.ads
    WHERE status = 'active'
    GROUP BY user_id
  ) ads ON p.user_id = ads.user_id
  WHERE 
    (search_term = '' OR 
     LOWER(p.display_name) LIKE LOWER('%' || search_term || '%') OR
     p.phone LIKE '%' || search_term || '%' OR
     LOWER(p.city) LIKE LOWER('%' || search_term || '%') OR
     p.user_id_display LIKE '%' || search_term || '%')
    AND 
    (membership_filter = 'all' OR p.membership_type = membership_filter)
  ORDER BY p.created_at DESC
  LIMIT limit_count;
END;
$$;
