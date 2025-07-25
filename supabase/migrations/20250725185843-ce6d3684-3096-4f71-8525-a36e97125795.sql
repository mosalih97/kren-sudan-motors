
-- إدراج مستخدم إداري افتراضي
INSERT INTO public.admin_credentials (username, password_hash)
VALUES ('admin', crypt('admin123', gen_salt('bf')))
ON CONFLICT (username) DO UPDATE SET
password_hash = crypt('admin123', gen_salt('bf'));

-- إدراج ملف تعريف المدير إذا لم يكن موجوداً
INSERT INTO public.profiles (
  user_id,
  display_name,
  phone,
  city,
  membership_type,
  is_premium,
  points,
  credits,
  user_id_display
)
VALUES (
  gen_random_uuid(),
  'مدير النظام',
  '+966500000000',
  'الرياض',
  'admin',
  true,
  1000,
  1000,
  '00000001'
)
ON CONFLICT (user_id_display) DO NOTHING;

-- تحديث معرف المدير في جدول بيانات الاعتماد
UPDATE public.admin_credentials 
SET admin_user_id = (
  SELECT user_id 
  FROM public.profiles 
  WHERE membership_type = 'admin' 
  LIMIT 1
)
WHERE username = 'admin';
