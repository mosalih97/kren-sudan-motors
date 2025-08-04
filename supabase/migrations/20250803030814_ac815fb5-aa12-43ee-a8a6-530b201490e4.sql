
-- إضافة صلاحيات RLS للدوال الإدارية
-- السماح للمديرين بالوصول لجميع بيانات المستخدمين

-- تحديث دالة get_admin_users_list لتعمل مع المديرين
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
  -- التحقق من أن المستخدم مدير
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND membership_type = 'admin'
  ) THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;

  RETURN QUERY
  SELECT 
    p.user_id,
    COALESCE(p.display_name, 'غير محدد') as display_name,
    COALESCE(p.phone, 'غير محدد') as phone,
    COALESCE(p.city, 'غير محدد') as city,
    COALESCE(p.membership_type, 'free') as membership_type,
    COALESCE(p.is_premium, false) as is_premium,
    COALESCE(p.points, 0) as points,
    COALESCE(p.credits, 0) as credits,
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

-- إضافة بعض البيانات التجريبية إذا كانت الجداول فارغة
DO $$
DECLARE
  test_user_id UUID;
BEGIN
  -- التحقق من وجود مستخدمين
  IF NOT EXISTS (SELECT 1 FROM public.profiles LIMIT 1) THEN
    -- إنشاء مستخدم تجريبي
    test_user_id := gen_random_uuid();
    
    INSERT INTO public.profiles (
      user_id, 
      display_name, 
      phone, 
      city, 
      membership_type, 
      is_premium, 
      points, 
      credits
    ) VALUES 
    (test_user_id, 'مستخدم تجريبي', '0501234567', 'الرياض', 'free', false, 20, 5),
    (gen_random_uuid(), 'مستخدم مميز', '0507654321', 'جدة', 'premium', true, 50, 130);
  END IF;
END $$;

-- السماح للمديرين بعرض جميع الملفات الشخصية
CREATE POLICY IF NOT EXISTS "المديرون يمكنهم عرض جميع الملفات" 
ON public.profiles 
FOR SELECT 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles admin_profile 
    WHERE admin_profile.user_id = auth.uid() 
    AND admin_profile.membership_type = 'admin'
  )
);
