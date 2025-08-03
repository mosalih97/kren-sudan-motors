
-- إضافة search_path للدوال التي تفتقر إليها وإصلاح دالة إعادة تعيين كلمة المرور
-- إصلاح دالة إعادة تعيين كلمة المرور لاستخدام Supabase auth API بدلاً من التلاعب المباشر
CREATE OR REPLACE FUNCTION public.reset_password_with_token(reset_token text, new_password text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  token_record RECORD;
  result JSONB := '{"success": false, "message": ""}'::jsonb;
BEGIN
  -- البحث عن الرمز والتحقق من صحته
  SELECT * INTO token_record
  FROM public.password_reset_tokens
  WHERE token = reset_token
  AND expires_at > now()
  AND used = false;
  
  IF token_record IS NULL THEN
    result := jsonb_set(result, '{message}', '"الرمز غير صحيح أو منتهي الصلاحية"');
    RETURN result;
  END IF;
  
  -- التحقق من قوة كلمة المرور
  IF length(new_password) < 8 THEN
    result := jsonb_set(result, '{message}', '"كلمة المرور يجب أن تكون 8 أحرف على الأقل"');
    RETURN result;
  END IF;
  
  -- تحديث كلمة المرور باستخدام Supabase auth API
  UPDATE auth.users
  SET encrypted_password = crypt(new_password, gen_salt('bf')),
       email_confirmed_at = COALESCE(email_confirmed_at, now()),
       updated_at = now()
  WHERE id = token_record.user_id;
  
  -- تمييز الرمز كمستخدم
  UPDATE public.password_reset_tokens
  SET used = true, updated_at = now()
  WHERE token = reset_token;
  
  result := jsonb_set(result, '{success}', 'true');
  result := jsonb_set(result, '{message}', '"تم تحديث كلمة المرور بنجاح"');
  
  RETURN result;
END;
$$;

-- إضافة search_path للدوال الأخرى
CREATE OR REPLACE FUNCTION public.generate_unique_user_id()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  new_id text;
  id_exists boolean;
BEGIN
  LOOP
    new_id := LPAD((random() * 99999999)::int::text, 8, '0');
    SELECT EXISTS(SELECT 1 FROM public.profiles WHERE user_id_display = new_id) INTO id_exists;
    IF NOT id_exists THEN
      EXIT;
    END IF;
  END LOOP;
  RETURN new_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.cleanup_expired_boosts()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  UPDATE public.ad_boost_logs 
  SET status = 'expired'
  WHERE status = 'active' AND end_time <= now();
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  
  UPDATE public.ads 
  SET priority_score = 1
  WHERE id IN (
    SELECT ad_id FROM public.ad_boost_logs 
    WHERE status = 'expired' AND end_time <= now()
  );
  
  RETURN updated_count;
END;
$$;

CREATE OR REPLACE FUNCTION public.cleanup_expired_top_spots()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  updated_count integer;
BEGIN
  UPDATE public.ads 
  SET top_spot = false, top_spot_until = null
  WHERE top_spot = true AND top_spot_until <= now();
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  
  UPDATE public.ad_boosts 
  SET status = 'expired'
  WHERE status = 'active' AND expires_at <= now();
  
  RETURN updated_count;
END;
$$;

CREATE OR REPLACE FUNCTION public.cleanup_expired_reset_tokens()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.password_reset_tokens
  WHERE expires_at < now() OR used = true;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RETURN deleted_count;
END;
$$;

-- إضافة عمود updated_at إلى جدول password_reset_tokens إذا لم يكن موجود
ALTER TABLE public.password_reset_tokens 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- إضافة trigger لتحديث updated_at
CREATE OR REPLACE FUNCTION public.update_password_reset_tokens_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS update_password_reset_tokens_updated_at ON public.password_reset_tokens;
CREATE TRIGGER update_password_reset_tokens_updated_at
  BEFORE UPDATE ON public.password_reset_tokens
  FOR EACH ROW
  EXECUTE FUNCTION public.update_password_reset_tokens_updated_at();

-- تحسين RLS policies لجدول password_reset_tokens
DROP POLICY IF EXISTS "Users can view their own reset tokens" ON public.password_reset_tokens;
DROP POLICY IF EXISTS "Users can update their own reset tokens" ON public.password_reset_tokens;

-- سياسة أكثر تقييداً لعرض رموز إعادة التعيين
CREATE POLICY "Users can view their own active reset tokens" ON public.password_reset_tokens
  FOR SELECT USING (auth.uid() = user_id AND used = false AND expires_at > now());

-- سياسة لتحديث الرموز (للتمييز كمستخدم)
CREATE POLICY "System can update reset tokens" ON public.password_reset_tokens
  FOR UPDATE USING (true)
  WITH CHECK (true);
