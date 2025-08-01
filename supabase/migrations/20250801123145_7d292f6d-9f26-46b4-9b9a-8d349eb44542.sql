
-- التأكد من وجود جدول admin_credentials وإنشاؤه إذا لم يكن موجوداً
CREATE TABLE IF NOT EXISTS public.admin_credentials (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- التأكد من وجود جدول admin_sessions وإنشاؤه إذا لم يكن موجوداً
CREATE TABLE IF NOT EXISTS public.admin_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id INTEGER REFERENCES public.admin_credentials(id),
  session_token TEXT UNIQUE NOT NULL,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '24 hours',
  is_active BOOLEAN DEFAULT TRUE
);

-- إنشاء أو استبدال دالة إنشاء جلسة المدير
CREATE OR REPLACE FUNCTION public.create_admin_session(
  username_input TEXT,
  password_input TEXT,
  ip_addr INET DEFAULT NULL,
  user_agent_input TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  admin_record RECORD;
  session_token_val TEXT;
BEGIN
  -- البحث عن المدير والتحقق من كلمة المرور
  SELECT id, username, password_hash INTO admin_record
  FROM public.admin_credentials
  WHERE username = username_input;
  
  -- التحقق من وجود المدير
  IF admin_record.id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'message', 'بيانات الدخول غير صحيحة'
    );
  END IF;
  
  -- التحقق من كلمة المرور
  IF NOT (admin_record.password_hash = crypt(password_input, admin_record.password_hash)) THEN
    RETURN json_build_object(
      'success', false,
      'message', 'بيانات الدخول غير صحيحة'
    );
  END IF;
  
  -- إنشاء رمز الجلسة
  session_token_val := gen_random_uuid()::text;
  
  -- إنشاء الجلسة
  INSERT INTO public.admin_sessions (
    admin_id,
    session_token,
    ip_address,
    user_agent
  ) VALUES (
    admin_record.id,
    session_token_val,
    ip_addr,
    user_agent_input
  );
  
  -- إرجاع النتيجة
  RETURN json_build_object(
    'success', true,
    'message', 'تم تسجيل الدخول بنجاح',
    'session_token', session_token_val
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'message', 'خطأ في الخادم'
    );
END;
$$;

-- إنشاء أو استبدال دالة التحقق من الجلسة
CREATE OR REPLACE FUNCTION public.verify_admin_session(token TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  session_record RECORD;
BEGIN
  SELECT s.*, c.username INTO session_record
  FROM public.admin_sessions s
  JOIN public.admin_credentials c ON s.admin_id = c.id
  WHERE s.session_token = token
    AND s.is_active = true
    AND s.expires_at > NOW();
    
  IF session_record.id IS NULL THEN
    RETURN json_build_object('valid', false);
  END IF;
  
  -- تحديث وقت آخر نشاط
  UPDATE public.admin_sessions 
  SET expires_at = NOW() + INTERVAL '24 hours'
  WHERE session_token = token;
  
  RETURN json_build_object(
    'valid', true,
    'admin_id', session_record.admin_id,
    'username', session_record.username
  );
END;
$$;

-- إنشاء أو استبدال دالة تسجيل الخروج
CREATE OR REPLACE FUNCTION public.logout_admin_session(token TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.admin_sessions
  SET is_active = false
  WHERE session_token = token;
  
  RETURN json_build_object('success', true);
END;
$$;

-- حذف البيانات القديمة وإعادة إدراج بيانات المدير
DELETE FROM public.admin_credentials WHERE username = 'admin';

-- إدراج بيانات المدير الجديدة
INSERT INTO public.admin_credentials (username, password_hash)
VALUES ('admin', crypt('admin123', gen_salt('bf')));

-- تنظيف الجلسات القديمة
DELETE FROM public.admin_sessions WHERE expires_at < NOW();
