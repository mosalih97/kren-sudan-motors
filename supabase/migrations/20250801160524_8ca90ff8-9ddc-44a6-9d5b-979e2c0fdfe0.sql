
-- إضافة المستخدم الحالي كمدير
INSERT INTO public.admin_users (email) 
VALUES (
  (SELECT email FROM auth.users WHERE id = auth.uid())
)
ON CONFLICT (email) DO NOTHING;

-- تحديث ملف المستخدم ليصبح مديراً
UPDATE public.profiles 
SET membership_type = 'admin', role = 'admin'
WHERE user_id = auth.uid();
