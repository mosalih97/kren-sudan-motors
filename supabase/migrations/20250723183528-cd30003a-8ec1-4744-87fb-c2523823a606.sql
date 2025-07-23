
-- إعادة إنشاء عمود credits في جدول profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS credits integer DEFAULT 5;

-- تحديث دالة handle_new_user لتشمل الكريديت
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, phone, whatsapp, city, points, membership_type, user_id_display, credits)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data ->> 'display_name', NEW.email),
    NEW.raw_user_meta_data ->> 'phone',
    NEW.raw_user_meta_data ->> 'whatsapp',
    NEW.raw_user_meta_data ->> 'city',
    20,
    'free',
    public.generate_unique_user_id(),
    CASE 
      WHEN NEW.raw_user_meta_data ->> 'membership_type' = 'premium' THEN 130
      ELSE 5
    END
  );
  RETURN NEW;
END;
$$;

-- تحديث دالة can_boost_ad لتعمل مع النظام الجديد
CREATE OR REPLACE FUNCTION public.can_boost_ad(
  ad_id_param uuid,
  user_id_param uuid
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  ad_owner uuid;
  existing_boost_count integer;
  user_credits integer;
  user_membership text;
  user_monthly_ads integer;
  result jsonb := '{"can_boost": false, "reason": ""}'::jsonb;
BEGIN
  -- التحقق من ملكية الإعلان
  SELECT user_id INTO ad_owner 
  FROM public.ads 
  WHERE id = ad_id_param AND status = 'active';
  
  IF ad_owner IS NULL THEN
    result := jsonb_set(result, '{reason}', '"الإعلان غير موجود أو غير نشط"');
    RETURN result;
  END IF;
  
  IF ad_owner != user_id_param THEN
    result := jsonb_set(result, '{reason}', '"لا يمكنك ترقية إعلان لا تملكه"');
    RETURN result;
  END IF;
  
  -- التحقق من وجود ترقية نشطة لنفس الإعلان اليوم
  SELECT COUNT(*) INTO existing_boost_count
  FROM public.ad_boosts
  WHERE ad_id = ad_id_param 
    AND user_id = user_id_param
    AND DATE(boosted_at) = CURRENT_DATE
    AND status = 'active';
  
  IF existing_boost_count > 0 THEN
    result := jsonb_set(result, '{reason}', '"لا يمكن ترقية نفس الإعلان أكثر من مرة في اليوم"');
    RETURN result;
  END IF;
  
  -- التحقق من الكريديت والعضوية
  SELECT credits, membership_type, monthly_ads_count INTO user_credits, user_membership, user_monthly_ads
  FROM public.profiles 
  WHERE user_id = user_id_param;
  
  -- التحقق من حد الإعلانات الشهرية للمستخدمين المميزين
  IF user_membership = 'premium' AND user_monthly_ads >= 40 THEN
    result := jsonb_set(result, '{reason}', '"تم الوصول للحد الأقصى من الإعلانات الشهرية (40 إعلان)"');
    RETURN result;
  END IF;
  
  -- فقط المستخدمون المميزون يمكنهم استخدام النقاط للتعزيز
  IF user_membership != 'premium' THEN
    result := jsonb_set(result, '{reason}', '"تحتاج لتفعيل العضوية المميزة لتتمكن من تعزيز الإعلانات"');
    RETURN result;
  END IF;
  
  -- التحقق من وجود نقاط كافية للمستخدم المميز
  IF user_credits < 5 THEN
    result := jsonb_set(result, '{reason}', '"لا توجد نقاط كافية للتعزيز. تحتاج لتجديد العضوية المميزة"');
    RETURN result;
  END IF;
  
  -- كل شيء على ما يرام
  result := jsonb_set(result, '{can_boost}', 'true');
  result := jsonb_set(result, '{user_membership}', to_jsonb(user_membership));
  result := jsonb_set(result, '{user_credits}', to_jsonb(user_credits));
  
  RETURN result;
END;
$$;

-- تحديث دالة boost_ad_to_top_spot
CREATE OR REPLACE FUNCTION public.boost_ad_to_top_spot(
  ad_id_param uuid,
  user_id_param uuid,
  hours_duration integer DEFAULT 1
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  can_boost_result jsonb;
  cost_amount integer;
  user_membership text;
  user_credits integer;
  expires_time timestamp with time zone;
  result jsonb := '{"success": false, "message": ""}'::jsonb;
BEGIN
  -- فحص إمكانية الترقية
  SELECT public.can_boost_ad(ad_id_param, user_id_param) INTO can_boost_result;
  
  IF NOT (can_boost_result->>'can_boost')::boolean THEN
    result := jsonb_set(result, '{message}', can_boost_result->'reason');
    RETURN result;
  END IF;
  
  -- حساب التكلفة حسب المدة
  CASE 
    WHEN hours_duration = 1 THEN cost_amount := 5;
    WHEN hours_duration = 72 THEN cost_amount := 60; -- 3 أيام
    WHEN hours_duration = 168 THEN cost_amount := 100; -- أسبوع
    ELSE cost_amount := 5; -- افتراضي
  END CASE;
  
  expires_time := now() + interval '1 hour' * hours_duration;
  
  -- الحصول على معلومات المستخدم
  SELECT membership_type, credits INTO user_membership, user_credits
  FROM public.profiles 
  WHERE user_id = user_id_param;
  
  -- التحقق من وجود نقاط كافية
  IF user_credits < cost_amount THEN
    result := jsonb_set(result, '{message}', '"لا توجد نقاط كافية للتعزيز"');
    RETURN result;
  END IF;
  
  -- خصم النقاط من المستخدم المميز
  UPDATE public.profiles 
  SET credits = credits - cost_amount
  WHERE user_id = user_id_param;
  
  -- ترقية الإعلان
  UPDATE public.ads 
  SET 
    top_spot = true,
    top_spot_until = expires_time,
    times_shown_top = 0,
    priority_score = public.calculate_ad_priority_score(ad_id_param)
  WHERE id = ad_id_param;
  
  -- تسجيل الترقية
  INSERT INTO public.ad_boosts (
    ad_id, 
    user_id, 
    expires_at, 
    cost,
    payment_method
  ) VALUES (
    ad_id_param, 
    user_id_param, 
    expires_time, 
    cost_amount,
    'credits'
  );
  
  result := jsonb_set(result, '{success}', 'true');
  result := jsonb_set(result, '{message}', '"تم تعزيز الإعلان بنجاح"');
  result := jsonb_set(result, '{expires_at}', to_jsonb(expires_time));
  result := jsonb_set(result, '{cost}', to_jsonb(cost_amount));
  
  RETURN result;
END;
$$;

-- تحديث دالة deduct_points للعمل مع النظام الجديد
CREATE OR REPLACE FUNCTION public.deduct_points(user_id_param uuid, points_to_deduct integer)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  current_points integer;
  user_membership text;
BEGIN
  -- الحصول على النقاط الحالية ونوع العضوية
  SELECT points, membership_type INTO current_points, user_membership
  FROM public.profiles
  WHERE user_id = user_id_param;

  -- المستخدمون المميزون لا يحتاجون لخصم النقاط لعرض معلومات الاتصال
  IF user_membership = 'premium' THEN
    RETURN true;
  END IF;

  -- التحقق من توفر النقاط الكافية للمستخدمين العاديين
  IF current_points >= points_to_deduct THEN
    UPDATE public.profiles
    SET points = points - points_to_deduct
    WHERE user_id = user_id_param;
    RETURN true;
  ELSE
    RETURN false;
  END IF;
END;
$$;

-- إنشاء جدول receipt_logs إذا لم يكن موجوداً
CREATE TABLE IF NOT EXISTS public.receipt_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  image_urls text[] NOT NULL,
  extracted_data jsonb,
  status text NOT NULL,
  reason text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- تفعيل RLS على جدول receipt_logs
ALTER TABLE public.receipt_logs ENABLE ROW LEVEL SECURITY;

-- سياسات RLS لجدول receipt_logs
CREATE POLICY "Users can view their own receipt logs" 
ON public.receipt_logs 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own receipt logs" 
ON public.receipt_logs 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- تحديث المستخدمين الحاليين بالكريديت الافتراضي
UPDATE public.profiles 
SET credits = CASE 
  WHEN membership_type = 'premium' THEN 130
  ELSE 5
END
WHERE credits IS NULL;
