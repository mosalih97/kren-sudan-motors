
-- إنشاء جدول بيانات دخول المديرين
CREATE TABLE public.admin_credentials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- إنشاء جدول جلسات المديرين
CREATE TABLE public.admin_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_user_id UUID NOT NULL REFERENCES public.admin_credentials(id) ON DELETE CASCADE,
  session_token TEXT NOT NULL UNIQUE,
  ip_address TEXT,
  user_agent TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- تفعيل Row Level Security
ALTER TABLE public.admin_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_sessions ENABLE ROW LEVEL SECURITY;

-- سياسات الأمان للمديرين فقط
CREATE POLICY "Only admins can access admin_credentials" 
  ON public.admin_credentials 
  FOR ALL
  USING (false);

CREATE POLICY "Only admins can access admin_sessions" 
  ON public.admin_sessions 
  FOR ALL
  USING (false);

-- إدراج مدير افتراضي (admin/admin123)
INSERT INTO public.admin_credentials (username, password_hash) 
VALUES ('admin', crypt('admin123', gen_salt('bf')));

-- إنشاء فهارس لتحسين الأداء
CREATE INDEX idx_admin_sessions_token ON public.admin_sessions(session_token);
CREATE INDEX idx_admin_sessions_active ON public.admin_sessions(is_active, expires_at);
