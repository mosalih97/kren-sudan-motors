
-- إنشاء دالة للحصول على إحصائيات لوحة التحكم
CREATE OR REPLACE FUNCTION get_admin_stats()
RETURNS TABLE(
  total_users BIGINT,
  total_ads BIGINT,
  active_ads BIGINT,
  total_messages BIGINT,
  premium_users BIGINT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*) FROM profiles) as total_users,
    (SELECT COUNT(*) FROM ads) as total_ads,
    (SELECT COUNT(*) FROM ads WHERE status = 'active') as active_ads,
    (SELECT COUNT(*) FROM messages) as total_messages,
    (SELECT COUNT(*) FROM profiles WHERE is_premium = true) as premium_users;
END;
$$;

-- منح الصلاحيات للمستخدمين المصادق عليهم
GRANT EXECUTE ON FUNCTION get_admin_stats() TO authenticated;

-- إنشاء دالة للتحقق من صلاحيات الإدارة
CREATE OR REPLACE FUNCTION is_admin(user_email TEXT DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  check_email TEXT;
BEGIN
  -- استخدم الإيميل المرسل أو احصل على إيميل المستخدم الحالي
  IF user_email IS NULL THEN
    SELECT email INTO check_email FROM auth.users WHERE id = auth.uid();
  ELSE
    check_email := user_email;
  END IF;
  
  -- تحقق من أن الإيميل هو إيميل المطور
  RETURN check_email = 'm.el3min3@gmail.com';
END;
$$;

-- منح الصلاحيات
GRANT EXECUTE ON FUNCTION is_admin(TEXT) TO authenticated;
