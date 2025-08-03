
-- إنشاء دالة محسنة لجلب المستخدمين مع جميع البيانات المطلوبة
CREATE OR REPLACE FUNCTION public.get_admin_users_list()
RETURNS TABLE(
  user_id uuid,
  display_name text,
  phone text,
  city text,
  membership_type text,
  is_premium boolean,
  points integer,
  credits integer,
  created_at timestamp with time zone,
  upgraded_at timestamp with time zone,
  premium_expires_at timestamp with time zone,
  days_remaining integer,
  ads_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
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
    p.points,
    p.credits,
    p.created_at,
    p.upgraded_at,
    p.premium_expires_at,
    CASE 
      WHEN p.premium_expires_at IS NULL THEN 0
      WHEN p.premium_expires_at <= now() THEN 0
      ELSE GREATEST(0, EXTRACT(DAY FROM (p.premium_expires_at - now()))::INTEGER)
    END as days_remaining,
    COALESCE(a.ads_count, 0) as ads_count
  FROM public.profiles p
  LEFT JOIN (
    SELECT user_id, COUNT(*) as ads_count
    FROM public.ads
    WHERE status = 'active'
    GROUP BY user_id
  ) a ON p.user_id = a.user_id
  ORDER BY p.created_at DESC;
END;
$$;

-- إنشاء دالة للحصول على إحصائيات المستخدمين
CREATE OR REPLACE FUNCTION public.get_users_statistics()
RETURNS TABLE(
  total_users bigint,
  premium_users bigint,
  free_users bigint,
  total_ads bigint,
  active_ads bigint,
  total_boosts bigint,
  new_users_this_month bigint,
  premium_expiring_soon bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*) FROM public.profiles)::bigint as total_users,
    (SELECT COUNT(*) FROM public.profiles WHERE membership_type = 'premium' OR is_premium = true)::bigint as premium_users,
    (SELECT COUNT(*) FROM public.profiles WHERE membership_type = 'free' AND is_premium = false)::bigint as free_users,
    (SELECT COUNT(*) FROM public.ads)::bigint as total_ads,
    (SELECT COUNT(*) FROM public.ads WHERE status = 'active')::bigint as active_ads,
    (SELECT COUNT(*) FROM public.ad_boosts WHERE status = 'active')::bigint as total_boosts,
    (SELECT COUNT(*) FROM public.profiles WHERE created_at >= date_trunc('month', now()))::bigint as new_users_this_month,
    (SELECT COUNT(*) FROM public.profiles 
     WHERE premium_expires_at IS NOT NULL 
     AND premium_expires_at > now() 
     AND premium_expires_at <= now() + interval '7 days')::bigint as premium_expiring_soon;
END;
$$;

-- إنشاء دالة البحث في المستخدمين
CREATE OR REPLACE FUNCTION public.search_users(search_term text)
RETURNS TABLE(
  user_id uuid,
  display_name text,
  phone text,
  city text,
  membership_type text,
  is_premium boolean,
  points integer,
  credits integer,
  created_at timestamp with time zone,
  upgraded_at timestamp with time zone,
  premium_expires_at timestamp with time zone,
  days_remaining integer,
  ads_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
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
    p.points,
    p.credits,
    p.created_at,
    p.upgraded_at,
    p.premium_expires_at,
    CASE 
      WHEN p.premium_expires_at IS NULL THEN 0
      WHEN p.premium_expires_at <= now() THEN 0
      ELSE GREATEST(0, EXTRACT(DAY FROM (p.premium_expires_at - now()))::INTEGER)
    END as days_remaining,
    COALESCE(a.ads_count, 0) as ads_count
  FROM public.profiles p
  LEFT JOIN (
    SELECT user_id, COUNT(*) as ads_count
    FROM public.ads
    WHERE status = 'active'
    GROUP BY user_id
  ) a ON p.user_id = a.user_id
  WHERE 
    LOWER(p.display_name) LIKE LOWER('%' || search_term || '%') OR
    p.phone LIKE '%' || search_term || '%' OR
    LOWER(p.city) LIKE LOWER('%' || search_term || '%') OR
    p.user_id::text LIKE '%' || search_term || '%'
  ORDER BY p.created_at DESC;
END;
$$;
