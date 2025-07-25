
-- إنشاء جدول upgrade_logs لتسجيل عمليات الترقية
CREATE TABLE public.upgrade_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  admin_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action text NOT NULL CHECK (action IN ('upgrade', 'downgrade')),
  from_membership text NOT NULL,
  to_membership text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone,
  notes text
);

-- إضافة حقول الترقية إلى جدول profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS upgraded_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS upgraded_by uuid REFERENCES auth.users(id);

-- إنشاء دالة لترقية المستخدم
CREATE OR REPLACE FUNCTION public.upgrade_user_to_premium(
  target_user_id uuid,
  admin_user_id uuid
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  current_membership text;
  new_expires_at timestamp with time zone;
  result jsonb := '{"success": false, "message": ""}'::jsonb;
BEGIN
  -- التحقق من صلاحية المدير
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = admin_user_id 
    AND membership_type = 'admin'
  ) THEN
    result := jsonb_set(result, '{message}', '"ليس لديك صلاحيات إدارية"');
    RETURN result;
  END IF;
  
  -- جلب نوع العضوية الحالي
  SELECT membership_type INTO current_membership
  FROM public.profiles 
  WHERE user_id = target_user_id;
  
  IF current_membership IS NULL THEN
    result := jsonb_set(result, '{message}', '"المستخدم غير موجود"');
    RETURN result;
  END IF;
  
  IF current_membership = 'premium' THEN
    result := jsonb_set(result, '{message}', '"المستخدم مميز بالفعل"');
    RETURN result;
  END IF;
  
  -- حساب تاريخ انتهاء العضوية (30 يوم)
  new_expires_at := now() + interval '30 days';
  
  -- تحديث بيانات المستخدم
  UPDATE public.profiles 
  SET 
    membership_type = 'premium',
    is_premium = true,
    upgraded_at = now(),
    upgraded_by = admin_user_id,
    premium_expires_at = new_expires_at,
    credits = COALESCE(credits, 0) + 130
  WHERE user_id = target_user_id;
  
  -- تسجيل العملية في upgrade_logs
  INSERT INTO public.upgrade_logs (
    user_id, admin_id, action, from_membership, to_membership, expires_at
  ) VALUES (
    target_user_id, admin_user_id, 'upgrade', current_membership, 'premium', new_expires_at
  );
  
  result := jsonb_set(result, '{success}', 'true');
  result := jsonb_set(result, '{message}', '"تم ترقية المستخدم بنجاح"');
  result := jsonb_set(result, '{expires_at}', to_jsonb(new_expires_at));
  
  RETURN result;
END;
$$;

-- إنشاء دالة لإرجاع المستخدم إلى free
CREATE OR REPLACE FUNCTION public.downgrade_user_to_free(
  target_user_id uuid,
  admin_user_id uuid
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  current_membership text;
  result jsonb := '{"success": false, "message": ""}'::jsonb;
BEGIN
  -- التحقق من صلاحية المدير
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = admin_user_id 
    AND membership_type = 'admin'
  ) THEN
    result := jsonb_set(result, '{message}', '"ليس لديك صلاحيات إدارية"');
    RETURN result;
  END IF;
  
  -- جلب نوع العضوية الحالي
  SELECT membership_type INTO current_membership
  FROM public.profiles 
  WHERE user_id = target_user_id;
  
  IF current_membership IS NULL THEN
    result := jsonb_set(result, '{message}', '"المستخدم غير موجود"');
    RETURN result;
  END IF;
  
  IF current_membership = 'free' THEN
    result := jsonb_set(result, '{message}', '"المستخدم عادي بالفعل"');
    RETURN result;
  END IF;
  
  -- تحديث بيانات المستخدم
  UPDATE public.profiles 
  SET 
    membership_type = 'free',
    is_premium = false,
    premium_expires_at = NULL,
    credits = 5
  WHERE user_id = target_user_id;
  
  -- تسجيل العملية في upgrade_logs
  INSERT INTO public.upgrade_logs (
    user_id, admin_id, action, from_membership, to_membership
  ) VALUES (
    target_user_id, admin_user_id, 'downgrade', current_membership, 'free'
  );
  
  result := jsonb_set(result, '{success}', 'true');
  result := jsonb_set(result, '{message}', '"تم إرجاع المستخدم إلى العضوية العادية"');
  
  RETURN result;
END;
$$;

-- إنشاء دالة لجلب بيانات المستخدمين للوحة الإدارية
CREATE OR REPLACE FUNCTION public.get_admin_users_list()
RETURNS TABLE (
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
    p.points,
    p.credits,
    p.created_at,
    p.upgraded_at,
    p.premium_expires_at,
    CASE 
      WHEN p.premium_expires_at IS NULL THEN NULL
      ELSE EXTRACT(DAY FROM (p.premium_expires_at - now()))::integer
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

-- تفعيل Row Level Security لجدول upgrade_logs
ALTER TABLE public.upgrade_logs ENABLE ROW LEVEL SECURITY;

-- إنشاء سياسة أمان للإداريين فقط
CREATE POLICY "إداري يمكنه عرض سجلات الترقية"
ON public.upgrade_logs
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND membership_type = 'admin'
  )
);

-- إنشاء سياسة أمان للإداريين للإدراج
CREATE POLICY "إداري يمكنه إضافة سجلات الترقية"
ON public.upgrade_logs
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND membership_type = 'admin'
  )
);

-- إنشاء فهرس لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_upgrade_logs_user_id ON public.upgrade_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_upgrade_logs_admin_id ON public.upgrade_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_profiles_membership_type ON public.profiles(membership_type);
