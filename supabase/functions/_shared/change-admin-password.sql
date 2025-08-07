
-- دالة تغيير كلمة مرور المدير
CREATE OR REPLACE FUNCTION public.change_admin_password(
  admin_id uuid,
  new_password text
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
  admin_exists boolean;
  result JSONB := '{"success": false, "message": ""}'::jsonb;
BEGIN
  -- التحقق من وجود المدير
  SELECT EXISTS(
    SELECT 1 FROM public.admin_credentials 
    WHERE id = admin_id
  ) INTO admin_exists;
  
  IF NOT admin_exists THEN
    result := jsonb_set(result, '{message}', '"المدير غير موجود"');
    RETURN result;
  END IF;
  
  -- التحقق من قوة كلمة المرور
  IF length(new_password) < 8 THEN
    result := jsonb_set(result, '{message}', '"كلمة المرور يجب أن تكون 8 أحرف على الأقل"');
    RETURN result;
  END IF;
  
  -- تحديث كلمة المرور
  UPDATE public.admin_credentials 
  SET 
    password_hash = crypt(new_password, gen_salt('bf')),
    updated_at = now()
  WHERE id = admin_id;
  
  -- إلغاء جميع الجلسات النشطة للأمان
  UPDATE public.admin_sessions 
  SET is_active = false 
  WHERE admin_user_id = admin_id;
  
  result := jsonb_set(result, '{success}', 'true');
  result := jsonb_set(result, '{message}', '"تم تغيير كلمة المرور بنجاح"');
  
  RETURN result;
END;
$function$;
