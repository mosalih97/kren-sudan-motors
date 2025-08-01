
-- التأكد من وجود بيانات المدير في الجداول المطلوبة
INSERT INTO public.admin_users (email) 
VALUES ('m.el3min3@gmail.com')
ON CONFLICT (email) DO NOTHING;

-- تحديث ملف المستخدم ليصبح مديراً
UPDATE public.profiles 
SET membership_type = 'admin', role = 'admin'
WHERE user_id IN (
  SELECT id FROM auth.users WHERE email = 'm.el3min3@gmail.com'
);

-- إنشاء فانكشن للتحقق من صلاحيات المدير
CREATE OR REPLACE FUNCTION public.is_admin_user_by_id(user_id_param uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    JOIN auth.users u ON p.user_id = u.id
    WHERE p.user_id = user_id_param 
    AND p.membership_type = 'admin'
    AND u.email IN (SELECT email FROM public.admin_users)
  );
$$;
