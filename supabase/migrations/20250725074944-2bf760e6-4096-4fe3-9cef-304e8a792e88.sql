
-- إنشاء جدول لرموز استعادة كلمة المرور
CREATE TABLE IF NOT EXISTS public.password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- إنشاء فهرس للبحث السريع
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON public.password_reset_tokens(token);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires ON public.password_reset_tokens(expires_at);

-- تفعيل Row Level Security
ALTER TABLE public.password_reset_tokens ENABLE ROW LEVEL SECURITY;

-- سياسة الأمان - المستخدمون يمكنهم عرض رموزهم فقط
CREATE POLICY "Users can view their own reset tokens" 
ON public.password_reset_tokens 
FOR SELECT 
USING (auth.uid() = user_id);

-- سياسة الأمان - المستخدمون يمكنهم تحديث رموزهم فقط
CREATE POLICY "Users can update their own reset tokens" 
ON public.password_reset_tokens 
FOR UPDATE 
USING (auth.uid() = user_id);

-- دالة لإنشاء رمز استعادة كلمة المرور
CREATE OR REPLACE FUNCTION public.create_password_reset_token(user_email TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  target_user_id UUID;
  reset_token TEXT;
  expires_time TIMESTAMPTZ;
  result JSONB := '{"success": false, "message": ""}'::jsonb;
BEGIN
  -- البحث عن المستخدم بالبريد الإلكتروني
  SELECT id INTO target_user_id
  FROM auth.users
  WHERE email = user_email;
  
  IF target_user_id IS NULL THEN
    result := jsonb_set(result, '{message}', '"البريد الإلكتروني غير مسجل"');
    RETURN result;
  END IF;
  
  -- إنشاء رمز عشوائي
  reset_token := encode(gen_random_bytes(32), 'hex');
  
  -- تحديد وقت انتهاء الرمز (ساعة واحدة)
  expires_time := now() + interval '1 hour';
  
  -- حذف الرموز القديمة للمستخدم
  DELETE FROM public.password_reset_tokens 
  WHERE user_id = target_user_id;
  
  -- إدراج الرمز الجديد
  INSERT INTO public.password_reset_tokens (user_id, token, expires_at)
  VALUES (target_user_id, reset_token, expires_time);
  
  result := jsonb_set(result, '{success}', 'true');
  result := jsonb_set(result, '{token}', to_jsonb(reset_token));
  result := jsonb_set(result, '{user_id}', to_jsonb(target_user_id));
  result := jsonb_set(result, '{expires_at}', to_jsonb(expires_time));
  
  RETURN result;
END;
$$;

-- دالة للتحقق من صحة رمز الاستعادة
CREATE OR REPLACE FUNCTION public.verify_password_reset_token(reset_token TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  token_record RECORD;
  user_email TEXT;
  result JSONB := '{"success": false, "message": ""}'::jsonb;
BEGIN
  -- البحث عن الرمز
  SELECT * INTO token_record
  FROM public.password_reset_tokens
  WHERE token = reset_token
  AND expires_at > now()
  AND used = false;
  
  IF token_record IS NULL THEN
    result := jsonb_set(result, '{message}', '"الرمز غير صحيح أو منتهي الصلاحية"');
    RETURN result;
  END IF;
  
  -- الحصول على بريد المستخدم
  SELECT email INTO user_email
  FROM auth.users
  WHERE id = token_record.user_id;
  
  result := jsonb_set(result, '{success}', 'true');
  result := jsonb_set(result, '{user_id}', to_jsonb(token_record.user_id));
  result := jsonb_set(result, '{email}', to_jsonb(user_email));
  
  RETURN result;
END;
$$;

-- دالة لتحديث كلمة المرور باستخدام الرمز
CREATE OR REPLACE FUNCTION public.reset_password_with_token(
  reset_token TEXT,
  new_password TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  token_record RECORD;
  result JSONB := '{"success": false, "message": ""}'::jsonb;
BEGIN
  -- البحث عن الرمز والتحقق من صحته
  SELECT * INTO token_record
  FROM public.password_reset_tokens
  WHERE token = reset_token
  AND expires_at > now()
  AND used = false;
  
  IF token_record IS NULL THEN
    result := jsonb_set(result, '{message}', '"الرمز غير صحيح أو منتهي الصلاحية"');
    RETURN result;
  END IF;
  
  -- تحديث كلمة المرور في جدول المصادقة
  UPDATE auth.users
  SET encrypted_password = crypt(new_password, gen_salt('bf'))
  WHERE id = token_record.user_id;
  
  -- تمييز الرمز كمستخدم
  UPDATE public.password_reset_tokens
  SET used = true
  WHERE token = reset_token;
  
  result := jsonb_set(result, '{success}', 'true');
  result := jsonb_set(result, '{message}', '"تم تحديث كلمة المرور بنجاح"');
  
  RETURN result;
END;
$$;

-- دالة لتنظيف الرموز المنتهية الصلاحية
CREATE OR REPLACE FUNCTION public.cleanup_expired_reset_tokens()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.password_reset_tokens
  WHERE expires_at < now() OR used = true;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RETURN deleted_count;
END;
$$;
