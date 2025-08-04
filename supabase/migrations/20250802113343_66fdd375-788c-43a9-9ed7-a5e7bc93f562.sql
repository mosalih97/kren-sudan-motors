
-- منح صلاحية إدارية للمستخدم
DO $$
BEGIN
  -- إضافة البريد الإلكتروني إلى قائمة المدراء
  INSERT INTO public.admin_users (email, created_at) 
  VALUES ('mo5188d@gmail.com', now())
  ON CONFLICT (email) DO NOTHING;
  
  -- تحديث بيانات المستخدم لمنحه صلاحيات إدارية
  UPDATE public.profiles 
  SET 
    membership_type = 'admin',
    is_premium = true,
    credits = 1000,
    points = 1000
  WHERE user_id = (
    SELECT id FROM auth.users WHERE email = 'mo5188d@gmail.com'
  );
END $$;
