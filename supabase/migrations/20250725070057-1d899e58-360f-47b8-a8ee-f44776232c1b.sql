
-- إضافة عمود role إلى جدول profiles إذا لم يكن موجوداً
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';

-- إنشاء جدول بيانات تسجيل الدخول للوحة التحكم
CREATE TABLE IF NOT EXISTS public.admin_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- إدراج بيانات المدير الافتراضي (username: admin, password: admin123)
INSERT INTO public.admin_credentials (username, password_hash) 
VALUES ('admin', '$2b$10$rOUkbOMHVEauaaqVQlMXZOMhtvaBSqQyJWrLGOsJNGC3zJQ9yXPMG')
ON CONFLICT (username) DO NOTHING;

-- دالة للحصول على قائمة المستخدمين للإدارة
CREATE OR REPLACE FUNCTION public.get_admin_users_list()
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
  upgraded_at TIMESTAMPTZ,
  premium_expires_at TIMESTAMPTZ,
  days_remaining INTEGER,
  ads_count BIGINT
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
      ELSE EXTRACT(DAY FROM (p.premium_expires_at - now()))::INTEGER
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

-- دالة لترقية المستخدم
CREATE OR REPLACE FUNCTION public.upgrade_user_to_premium(
  target_user_id UUID,
  admin_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  current_membership TEXT;
  new_expires_at TIMESTAMPTZ;
  result JSONB := '{"success": false, "message": ""}'::jsonb;
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

-- دالة لإلغاء ترقية المستخدم
CREATE OR REPLACE FUNCTION public.downgrade_user_to_free(
  target_user_id UUID,
  admin_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  current_membership TEXT;
  result JSONB := '{"success": false, "message": ""}'::jsonb;
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

-- دالة لتحديث بيانات المدير
CREATE OR REPLACE FUNCTION public.update_admin_credentials(
  admin_user_id UUID,
  new_username TEXT,
  new_password_hash TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  result JSONB := '{"success": false, "message": ""}'::jsonb;
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
  
  -- تحديث بيانات الدخول
  UPDATE public.admin_credentials 
  SET 
    username = new_username,
    password_hash = new_password_hash,
    updated_at = now()
  WHERE id = (SELECT id FROM public.admin_credentials LIMIT 1);
  
  result := jsonb_set(result, '{success}', 'true');
  result := jsonb_set(result, '{message}', '"تم تحديث بيانات الدخول بنجاح"');
  
  RETURN result;
END;
$$;

-- تفعيل Row Level Security
ALTER TABLE public.admin_credentials ENABLE ROW LEVEL SECURITY;

-- سياسات الأمان للإداريين فقط
CREATE POLICY "admin_can_view_credentials" ON public.admin_credentials
FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND membership_type = 'admin')
);

CREATE POLICY "admin_can_update_credentials" ON public.admin_credentials
FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND membership_type = 'admin')
);

-- إنشاء فهارس لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_profiles_membership_type ON public.profiles(membership_type);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_upgrade_logs_user_id ON public.upgrade_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_upgrade_logs_admin_id ON public.upgrade_logs(admin_id);
