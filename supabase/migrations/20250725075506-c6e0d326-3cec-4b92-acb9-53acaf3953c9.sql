
-- إضافة امتداد pgcrypto إذا لم يكن موجود
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- تحديث دالة إنشاء رمز استعادة كلمة المرور لاستخدام دالة أخرى
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
  
  -- إنشاء رمز عشوائي باستخدام دالة بديلة
  reset_token := encode(digest(random()::text || clock_timestamp()::text || user_email, 'sha256'), 'hex');
  
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
  result := jsonb_set(result, '{message}', '"تم إنشاء رمز الاستعادة بنجاح"');
  
  RETURN result;
END;
$$;
