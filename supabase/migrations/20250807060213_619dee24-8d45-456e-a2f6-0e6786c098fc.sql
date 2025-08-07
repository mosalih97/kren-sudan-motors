
-- إنشاء جدول بيانات اعتماد المدير
CREATE TABLE IF NOT EXISTS public.admin_credentials (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- إنشاء جدول جلسات المدير
CREATE TABLE IF NOT EXISTS public.admin_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_user_id UUID REFERENCES public.admin_credentials(id) ON DELETE CASCADE,
  session_token TEXT NOT NULL UNIQUE,
  ip_address TEXT,
  user_agent TEXT,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- إدراج بيانات اعتماد المدير الافتراضية (username: admin, password: admin123)
INSERT INTO public.admin_credentials (username, password_hash)
VALUES ('admin', crypt('admin123', gen_salt('bf')))
ON CONFLICT (username) DO NOTHING;

-- تمكين Row Level Security
ALTER TABLE public.admin_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_sessions ENABLE ROW LEVEL SECURITY;

-- إنشاء سياسات RLS للأمان
CREATE POLICY "Allow admin operations on admin_credentials" ON public.admin_credentials
FOR ALL USING (true);

CREATE POLICY "Allow admin operations on admin_sessions" ON public.admin_sessions
FOR ALL USING (true);

-- تحديث دالة create_admin_session لاستخدام pgcrypto
CREATE OR REPLACE FUNCTION public.create_admin_session(
  username_input text,
  password_input text,
  ip_addr text DEFAULT '',
  user_agent_input text DEFAULT ''
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  admin_record RECORD;
  session_token TEXT;
  expires_time TIMESTAMPTZ;
  result JSONB := '{"success": false, "message": ""}'::jsonb;
BEGIN
  -- التحقق من بيانات المدير
  SELECT * INTO admin_record
  FROM public.admin_credentials
  WHERE username = username_input
  AND password_hash = crypt(password_input, password_hash);
  
  IF admin_record IS NULL THEN
    result := jsonb_set(result, '{message}', '"اسم المستخدم أو كلمة المرور غير صحيحة"');
    RETURN result;
  END IF;
  
  -- إنشاء رمز الجلسة
  session_token := encode(
    digest(
      random()::text || clock_timestamp()::text || admin_record.id::text, 
      'sha256'
    ), 
    'hex'
  );
  
  expires_time := now() + interval '24 hours';
  
  -- إلغاء الجلسات القديمة
  UPDATE public.admin_sessions 
  SET is_active = false 
  WHERE admin_user_id = admin_record.id;
  
  -- إنشاء جلسة جديدة
  INSERT INTO public.admin_sessions (
    admin_user_id, 
    session_token, 
    ip_address, 
    user_agent, 
    expires_at
  ) VALUES (
    admin_record.id, 
    session_token, 
    ip_addr, 
    user_agent_input, 
    expires_time
  );
  
  result := jsonb_set(result, '{success}', 'true');
  result := jsonb_set(result, '{session_token}', to_jsonb(session_token));
  result := jsonb_set(result, '{expires_at}', to_jsonb(expires_time));
  result := jsonb_set(result, '{message}', '"تم تسجيل الدخول بنجاح"');
  
  RETURN result;
END;
$function$;

-- تحديث دالة verify_admin_session
CREATE OR REPLACE FUNCTION public.verify_admin_session(token text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  session_record RECORD;
  result JSONB := '{"valid": false, "message": ""}'::jsonb;
BEGIN
  SELECT s.*, c.username 
  INTO session_record
  FROM public.admin_sessions s
  JOIN public.admin_credentials c ON s.admin_user_id = c.id
  WHERE s.session_token = token
  AND s.is_active = true
  AND s.expires_at > now();
  
  IF session_record IS NULL THEN
    result := jsonb_set(result, '{message}', '"جلسة غير صالحة أو منتهية الصلاحية"');
    RETURN result;
  END IF;
  
  result := jsonb_set(result, '{valid}', 'true');
  result := jsonb_set(result, '{username}', to_jsonb(session_record.username));
  result := jsonb_set(result, '{admin_id}', to_jsonb(session_record.admin_user_id));
  
  RETURN result;
END;
$function$;

-- تمكين امتداد pgcrypto إذا لم يكن مفعلاً
CREATE EXTENSION IF NOT EXISTS pgcrypto;
