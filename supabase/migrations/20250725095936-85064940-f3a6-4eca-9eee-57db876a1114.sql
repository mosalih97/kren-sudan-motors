
-- إنشاء جدول لتوكنات استعادة كلمة المرور
CREATE TABLE IF NOT EXISTS public.password_reset_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- إنشاء فهرس للتوكن
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON public.password_reset_tokens(token);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires_at ON public.password_reset_tokens(expires_at);

-- تفعيل RLS
ALTER TABLE public.password_reset_tokens ENABLE ROW LEVEL SECURITY;

-- إنشاء دالة لإنشاء توكن استعادة كلمة المرور
CREATE OR REPLACE FUNCTION public.create_password_reset_token(user_email TEXT)
RETURNS JSON AS $$
DECLARE
  user_record RECORD;
  reset_token TEXT;
  expires_at TIMESTAMP WITH TIME ZONE;
BEGIN
  -- البحث عن المستخدم
  SELECT id INTO user_record FROM auth.users WHERE email = user_email;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'message', 'البريد الإلكتروني غير موجود');
  END IF;
  
  -- إنشاء توكن عشوائي
  reset_token := encode(gen_random_bytes(32), 'hex');
  expires_at := now() + interval '1 hour';
  
  -- حذف التوكنات القديمة للمستخدم
  DELETE FROM public.password_reset_tokens 
  WHERE user_id = user_record.id;
  
  -- إدراج التوكن الجديد
  INSERT INTO public.password_reset_tokens (user_id, token, expires_at)
  VALUES (user_record.id, reset_token, expires_at);
  
  -- تسجيل الحدث الأمني
  INSERT INTO public.security_logs (event_type, event_data, created_at)
  VALUES ('password_reset_token_created', json_build_object('user_id', user_record.id, 'email', user_email), now());
  
  RETURN json_build_object('success', true, 'message', 'تم إنشاء توكن استعادة كلمة المرور بنجاح', 'token', reset_token);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- إنشاء دالة لاستعادة كلمة المرور باستخدام التوكن
CREATE OR REPLACE FUNCTION public.reset_password_with_token(reset_token TEXT, new_password TEXT)
RETURNS JSON AS $$
DECLARE
  token_record RECORD;
  user_id UUID;
BEGIN
  -- البحث عن التوكن
  SELECT * INTO token_record FROM public.password_reset_tokens 
  WHERE token = reset_token AND expires_at > now() AND used = false;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'message', 'التوكن غير صحيح أو منتهي الصلاحية');
  END IF;
  
  user_id := token_record.user_id;
  
  -- تحديث كلمة المرور
  UPDATE auth.users 
  SET 
    encrypted_password = crypt(new_password, gen_salt('bf')),
    updated_at = now()
  WHERE id = user_id;
  
  -- تمييز التوكن كمستخدم
  UPDATE public.password_reset_tokens 
  SET used = true 
  WHERE token = reset_token;
  
  -- تسجيل الحدث الأمني
  INSERT INTO public.security_logs (event_type, event_data, created_at)
  VALUES ('password_reset_successful', json_build_object('user_id', user_id), now());
  
  RETURN json_build_object('success', true, 'message', 'تم تغيير كلمة المرور بنجاح');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- إنشاء دالة لتسجيل الأحداث الأمنية
CREATE OR REPLACE FUNCTION public.log_security_event(event_type TEXT, event_data JSON)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.security_logs (event_type, event_data, created_at)
  VALUES (event_type, event_data, now());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- تنظيف التوكنات المنتهية الصلاحية
CREATE OR REPLACE FUNCTION public.cleanup_expired_tokens()
RETURNS VOID AS $$
BEGIN
  DELETE FROM public.password_reset_tokens 
  WHERE expires_at < now() OR used = true;
END;
$$ LANGUAGE plpgsql;
