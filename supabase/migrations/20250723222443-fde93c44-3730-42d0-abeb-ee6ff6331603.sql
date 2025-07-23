
-- تحسين جدول ad_boosts لدعم أنواع التعزيز المختلفة
ALTER TABLE public.ad_boosts 
ADD COLUMN IF NOT EXISTS boost_plan text DEFAULT 'basic',
ADD COLUMN IF NOT EXISTS original_expires_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS views_gained integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS tier_priority integer DEFAULT 1;

-- فهرسة إضافية للأداء
CREATE INDEX IF NOT EXISTS idx_ad_boosts_plan ON public.ad_boosts(boost_plan);
CREATE INDEX IF NOT EXISTS idx_ad_boosts_expires ON public.ad_boosts(expires_at);

-- دالة لحساب إجمالي النقاط المتاحة للمستخدم
CREATE OR REPLACE FUNCTION public.get_user_total_points(user_id_param uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  user_profile record;
  base_points integer := 0;
  premium_credits integer := 0;
  total_points integer := 0;
  result jsonb;
BEGIN
  -- جلب بيانات المستخدم
  SELECT * INTO user_profile
  FROM public.profiles 
  WHERE user_id = user_id_param;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'total_points', 0,
      'base_points', 0,
      'premium_credits', 0,
      'membership_type', 'free'
    );
  END IF;
  
  -- النقاط الأساسية من التسجيل
  base_points := COALESCE(user_profile.points, 0);
  
  -- نقاط العضوية المميزة
  premium_credits := COALESCE(user_profile.credits, 0);
  
  -- إجمالي النقاط المتاحة للاستخدام
  IF user_profile.membership_type = 'premium' THEN
    total_points := base_points + premium_credits;
  ELSE
    total_points := base_points;
  END IF;
  
  result := jsonb_build_object(
    'total_points', total_points,
    'base_points', base_points,
    'premium_credits', premium_credits,
    'membership_type', user_profile.membership_type,
    'monthly_ads_count', COALESCE(user_profile.monthly_ads_count, 0),
    'monthly_ads_limit', CASE WHEN user_profile.membership_type = 'premium' THEN 40 ELSE 5 END
  );
  
  RETURN result;
END;
$function$;

-- دالة محسّنة لفحص إمكانية تعزيز الإعلان مع خطط التعزيز المختلفة
CREATE OR REPLACE FUNCTION public.can_boost_ad_enhanced(
  ad_id_param uuid,
  user_id_param uuid,
  boost_plan text DEFAULT 'basic'
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  ad_owner uuid;
  existing_boost_count integer;
  user_points_data jsonb;
  plan_cost integer;
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
  
  -- حساب تكلفة الخطة
  CASE boost_plan
    WHEN 'basic' THEN plan_cost := 5;
    WHEN 'premium' THEN plan_cost := 60;
    WHEN 'ultimate' THEN plan_cost := 100;
    ELSE plan_cost := 5;
  END CASE;
  
  -- جلب بيانات النقاط
  SELECT public.get_user_total_points(user_id_param) INTO user_points_data;
  
  -- التحقق من النقاط الكافية
  IF (user_points_data->>'total_points')::integer < plan_cost THEN
    result := jsonb_set(result, '{reason}', 
      '"لا توجد نقاط كافية للتعزيز. تحتاج ' || plan_cost || ' نقطة وتملك ' || 
      (user_points_data->>'total_points') || ' نقطة"');
    RETURN result;
  END IF;
  
  -- التحقق من حد الإعلانات الشهرية
  IF (user_points_data->>'membership_type')::text = 'premium' AND 
     (user_points_data->>'monthly_ads_count')::integer >= 40 THEN
    result := jsonb_set(result, '{reason}', '"تم الوصول للحد الأقصى من الإعلانات الشهرية (40 إعلان)"');
    RETURN result;
  END IF;
  
  -- كل شيء على ما يرام
  result := jsonb_set(result, '{can_boost}', 'true');
  result := jsonb_set(result, '{cost}', to_jsonb(plan_cost));
  result := jsonb_set(result, '{user_points}', user_points_data);
  
  RETURN result;
END;
$function$;

-- دالة محسّنة لتعزيز الإعلان مع دعم خطط التعزيز المختلفة
CREATE OR REPLACE FUNCTION public.boost_ad_enhanced(
  ad_id_param uuid,
  user_id_param uuid,
  boost_plan text DEFAULT 'basic'
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  can_boost_result jsonb;
  cost_amount integer;
  hours_duration integer;
  tier_priority integer;
  user_profile record;
  expires_time timestamp with time zone;
  result jsonb := '{"success": false, "message": ""}'::jsonb;
BEGIN
  -- فحص إمكانية الترقية
  SELECT public.can_boost_ad_enhanced(ad_id_param, user_id_param, boost_plan) INTO can_boost_result;
  
  IF NOT (can_boost_result->>'can_boost')::boolean THEN
    result := jsonb_set(result, '{message}', can_boost_result->'reason');
    RETURN result;
  END IF;
  
  -- تحديد معاملات الخطة
  CASE boost_plan
    WHEN 'basic' THEN 
      cost_amount := 5;
      hours_duration := 1;
      tier_priority := 1;
    WHEN 'premium' THEN 
      cost_amount := 60;
      hours_duration := 72;
      tier_priority := 2;
    WHEN 'ultimate' THEN 
      cost_amount := 100;
      hours_duration := 168;
      tier_priority := 3;
    ELSE 
      cost_amount := 5;
      hours_duration := 1;
      tier_priority := 1;
  END CASE;
  
  expires_time := now() + interval '1 hour' * hours_duration;
  
  -- جلب بيانات المستخدم
  SELECT * INTO user_profile
  FROM public.profiles 
  WHERE user_id = user_id_param;
  
  -- خصم النقاط حسب الأولوية (أولاً من نقاط العضوية المميزة، ثم من النقاط الأساسية)
  IF user_profile.membership_type = 'premium' THEN
    IF user_profile.credits >= cost_amount THEN
      -- خصم من نقاط العضوية المميزة
      UPDATE public.profiles 
      SET credits = credits - cost_amount
      WHERE user_id = user_id_param;
    ELSE
      -- خصم جزئي من نقاط العضوية المميزة والباقي من النقاط الأساسية
      DECLARE
        remaining_cost integer := cost_amount - user_profile.credits;
      BEGIN
        UPDATE public.profiles 
        SET 
          credits = 0,
          points = points - remaining_cost
        WHERE user_id = user_id_param;
      END;
    END IF;
  ELSE
    -- خصم من النقاط الأساسية للمستخدمين العاديين
    UPDATE public.profiles 
    SET points = points - cost_amount
    WHERE user_id = user_id_param;
  END IF;
  
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
    original_expires_at,
    cost,
    boost_plan,
    tier_priority,
    payment_method
  ) VALUES (
    ad_id_param, 
    user_id_param, 
    expires_time,
    expires_time,
    cost_amount,
    boost_plan,
    tier_priority,
    'points'
  );
  
  result := jsonb_set(result, '{success}', 'true');
  result := jsonb_set(result, '{message}', '"تم تعزيز الإعلان بنجاح"');
  result := jsonb_set(result, '{expires_at}', to_jsonb(expires_time));
  result := jsonb_set(result, '{cost}', to_jsonb(cost_amount));
  result := jsonb_set(result, '{plan}', to_jsonb(boost_plan));
  
  RETURN result;
END;
$function$;

-- دالة لحساب إحصائيات التعزيز
CREATE OR REPLACE FUNCTION public.get_boost_stats(user_id_param uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  total_boosts integer;
  active_boosts integer;
  total_spent integer;
  result jsonb;
BEGIN
  -- عدد الترقيات الإجمالية
  SELECT COUNT(*) INTO total_boosts
  FROM public.ad_boosts
  WHERE user_id = user_id_param;
  
  -- عدد الترقيات النشطة
  SELECT COUNT(*) INTO active_boosts
  FROM public.ad_boosts
  WHERE user_id = user_id_param 
    AND status = 'active'
    AND expires_at > now();
  
  -- إجمالي النقاط المنفقة
  SELECT COALESCE(SUM(cost), 0) INTO total_spent
  FROM public.ad_boosts
  WHERE user_id = user_id_param;
  
  result := jsonb_build_object(
    'total_boosts', total_boosts,
    'active_boosts', active_boosts,
    'total_spent', total_spent
  );
  
  RETURN result;
END;
$function$;
