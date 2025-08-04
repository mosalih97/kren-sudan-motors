
-- إنشاء جدول بيانات الدخول الإدارية
CREATE TABLE IF NOT EXISTS public.admin_credentials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- إنشاء جدول جلسات المدراء
CREATE TABLE IF NOT EXISTS public.admin_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_user_id UUID NOT NULL REFERENCES public.admin_credentials(id) ON DELETE CASCADE,
  session_token TEXT NOT NULL UNIQUE,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- إنشاء جدول تسجيل عمليات الترقية
CREATE TABLE IF NOT EXISTS public.upgrade_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  admin_id UUID NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('upgrade', 'downgrade')),
  from_membership TEXT NOT NULL,
  to_membership TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- إدراج بيانات دخول افتراضية (admin/admin123)
INSERT INTO public.admin_credentials (username, password_hash) 
VALUES ('admin', crypt('admin123', gen_salt('bf')))
ON CONFLICT (username) DO NOTHING;

-- تفعيل RLS لجداول الإدارة (للحماية)
ALTER TABLE public.admin_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.upgrade_logs ENABLE ROW LEVEL SECURITY;

-- سياسات الأمان - السماح بالقراءة فقط للمدراء المصدقين
CREATE POLICY "Allow authenticated admins" ON public.admin_credentials FOR ALL USING (true);
CREATE POLICY "Allow admin sessions" ON public.admin_sessions FOR ALL USING (true);
CREATE POLICY "Allow upgrade logs" ON public.upgrade_logs FOR ALL USING (true);
