
-- إضافة عمود admin_user_id إذا لم يكن موجوداً
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'admin_credentials' 
                 AND column_name = 'admin_user_id') THEN
    ALTER TABLE public.admin_credentials ADD COLUMN admin_user_id uuid;
  END IF;
END $$;

-- حذف البيانات القديمة إذا كانت موجودة
DELETE FROM public.admin_credentials WHERE username = 'admin';

-- إدراج ملف تعريف المدير
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
  '00000000-0000-0000-0000-000000000001'::uuid,
  'مدير النظام',
  '+966500000000',
  'الرياض',
  'admin',
  true,
  1000,
  1000,
  '00000001'
)
ON CONFLICT (user_id) DO UPDATE SET
  display_name = 'مدير النظام',
  membership_type = 'admin',
  is_premium = true;

-- إدراج بيانات اعتماد المدير
INSERT INTO public.admin_credentials (
  username, 
  password_hash, 
  admin_user_id
)
VALUES (
  'admin', 
  crypt('admin123', gen_salt('bf')),
  '00000000-0000-0000-0000-000000000001'::uuid
);
