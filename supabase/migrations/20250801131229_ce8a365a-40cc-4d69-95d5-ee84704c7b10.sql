
-- إدراج البريد الإلكتروني للمدير في جدول admin_users
INSERT INTO public.admin_users (email) 
VALUES ('m.el3min3@gmail.com')
ON CONFLICT (email) DO NOTHING;
