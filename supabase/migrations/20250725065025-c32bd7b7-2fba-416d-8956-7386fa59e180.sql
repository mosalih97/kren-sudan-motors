
-- إضافة عمود role إلى جدول profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';

-- إنشاء جدول سجل الترقيات
CREATE TABLE IF NOT EXISTS public.upgrade_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  upgraded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL CHECK (action IN ('upgrade', 'downgrade')),
  from_membership TEXT NOT NULL,
  to_membership TEXT NOT NULL,
  upgraded_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ,
  notes TEXT
);

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

-- دالة لترقية المستخدم
CREATE OR REPLACE FUNCTION public.upgrade_user_to_premium(
  target_user_id UUID,
  admin_user_id UUID
) RETURNS JSONB
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
    WHERE user_id = admin_user_id AND role = 'admin'
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
    premium_expires_at = new_expires_at,
    credits = COALESCE(credits, 0) + 130
  WHERE user_id = target_user_id;
  
  -- تسجيل العملية
  INSERT INTO public.upgrade_logs (
    user_id, upgraded_by, action, from_membership, to_membership, expires_at
  ) VALUES (
    target_user_id, admin_user_id, 'upgrade', current_membership, 'premium', new_expires_at
  );
  
  -- إرسال إشعار للمستخدم
  INSERT INTO public.notifications (
    user_id, title, message, type, data
  ) VALUES (
    target_user_id, 
    'تم تفعيل العضوية المميزة', 
    'تم تفعيل عضويتك المميزة لمدة 30 يوماً. استمتع بالمزايا الجديدة!',
    'membership',
    jsonb_build_object('expires_at', new_expires_at)
  );
  
  result := jsonb_set(result, '{success}', 'true');
  result := jsonb_set(result, '{message}', '"تم ترقية المستخدم بنجاح"');
  
  RETURN result;
END;
$$;

-- دالة لإلغاء ترقية المستخدم
CREATE OR REPLACE FUNCTION public.downgrade_user_to_free(
  target_user_id UUID,
  admin_user_id UUID
) RETURNS JSONB
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
    WHERE user_id = admin_user_id AND role = 'admin'
  ) THEN
    result := jsonb_set(result, '{message}', '"ليس لديك صلاحيات إدارية"');
    RETURN result;
  END IF;
  
  -- جلب نوع العضوية الحالي
  SELECT membership_type INTO current_membership
  FROM public.profiles 
  WHERE user_id = target_user_id;
  
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
  
  -- تسجيل العملية
  INSERT INTO public.upgrade_logs (
    user_id, upgraded_by, action, from_membership, to_membership
  ) VALUES (
    target_user_id, admin_user_id, 'downgrade', current_membership, 'free'
  );
  
  -- إرسال إشعار للمستخدم
  INSERT INTO public.notifications (
    user_id, title, message, type
  ) VALUES (
    target_user_id, 
    'تم إلغاء العضوية المميزة', 
    'تم إلغاء عضويتك المميزة وإرجاعك إلى العضوية العادية.',
    'membership'
  );
  
  result := jsonb_set(result, '{success}', 'true');
  result := jsonb_set(result, '{message}', '"تم إلغاء ترقية المستخدم بنجاح"');
  
  RETURN result;
END;
$$;

-- دالة لتحديث بيانات المدير
CREATE OR REPLACE FUNCTION public.update_admin_credentials(
  admin_user_id UUID,
  new_username TEXT,
  new_password_hash TEXT
) RETURNS JSONB
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
    WHERE user_id = admin_user_id AND role = 'admin'
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
ALTER TABLE public.upgrade_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_credentials ENABLE ROW LEVEL SECURITY;

-- سياسات الأمان للإداريين فقط
CREATE POLICY "admin_can_view_upgrade_logs" ON public.upgrade_logs
FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin')
);

CREATE POLICY "admin_can_insert_upgrade_logs" ON public.upgrade_logs
FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin')
);

CREATE POLICY "admin_can_view_credentials" ON public.admin_credentials
FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin')
);

CREATE POLICY "admin_can_update_credentials" ON public.admin_credentials
FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin')
);

-- إنشاء فهارس لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_upgrade_logs_user_id ON public.upgrade_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_upgrade_logs_upgraded_by ON public.upgrade_logs(upgraded_by);
