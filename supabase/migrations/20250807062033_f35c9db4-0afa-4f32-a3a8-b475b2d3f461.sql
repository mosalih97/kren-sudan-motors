
-- دالة لإعادة تعيين كلمة مرور المدير في حالات الطوارئ
CREATE OR REPLACE FUNCTION public.reset_admin_password(
  admin_username text,
  new_password text
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
  admin_record RECORD;
  result JSONB := '{"success": false, "message": ""}'::jsonb;
BEGIN
  -- البحث عن المدير بالاسم
  SELECT * INTO admin_record
  FROM public.admin_credentials
  WHERE username = admin_username;
  
  IF admin_record IS NULL THEN
    result := jsonb_set(result, '{message}', '"اسم المستخدم غير موجود"');
    RETURN result;
  END IF;
  
  -- التحقق من قوة كلمة المرور
  IF length(new_password) < 8 THEN
    result := jsonb_set(result, '{message}', '"كلمة المرور يجب أن تكون 8 أحرف على الأقل"');
    RETURN result;
  END IF;
  
  -- تحديث كلمة المرور مع التشفير الصحيح
  UPDATE public.admin_credentials 
  SET 
    password_hash = crypt(new_password, gen_salt('bf')),
    updated_at = now()
  WHERE username = admin_username;
  
  -- إلغاء جميع الجلسات النشطة للأمان
  UPDATE public.admin_sessions 
  SET is_active = false 
  WHERE admin_user_id = admin_record.id;
  
  result := jsonb_set(result, '{success}', 'true');
  result := jsonb_set(result, '{message}', '"تم إعادة تعيين كلمة المرور بنجاح"');
  
  RETURN result;
END;
$function$;

-- أيضاً إنشاء دالة لتعيين كلمة مرور افتراضية في حالة الطوارئ
CREATE OR REPLACE FUNCTION public.set_default_admin_password()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
  result JSONB := '{"success": false, "message": ""}'::jsonb;
BEGIN
  -- تعيين كلمة مرور افتراضية: admin123
  UPDATE public.admin_credentials 
  SET 
    password_hash = crypt('admin123', gen_salt('bf')),
    updated_at = now()
  WHERE username = 'admin';
  
  -- إلغاء جميع الجلسات النشطة
  UPDATE public.admin_sessions 
  SET is_active = false;
  
  result := jsonb_set(result, '{success}', 'true');
  result := jsonb_set(result, '{message}', '"تم تعيين كلمة المرور الافتراضية: admin123"');
  
  RETURN result;
END;
$function$;
