-- إضافة أعمدة نظام Top Spot لجدول الإعلانات
ALTER TABLE public.ads 
ADD COLUMN top_spot boolean DEFAULT false,
ADD COLUMN top_spot_until timestamp with time zone,
ADD COLUMN times_shown_top integer DEFAULT 0,
ADD COLUMN last_top_spot_viewed timestamp with time zone,
ADD COLUMN priority_score numeric DEFAULT 0;

-- إنشاء جدول سجل ترقيات الإعلانات
CREATE TABLE public.ad_boosts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_id uuid NOT NULL REFERENCES public.ads(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  boost_type text NOT NULL DEFAULT 'top_spot',
  boosted_at timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone NOT NULL,
  cost integer NOT NULL DEFAULT 0,
  payment_method text NOT NULL DEFAULT 'credits',
  status text NOT NULL DEFAULT 'active',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- فهرسة لتحسين الأداء
CREATE INDEX idx_ads_top_spot ON public.ads(top_spot, top_spot_until) WHERE top_spot = true;
CREATE INDEX idx_ads_priority_score ON public.ads(priority_score DESC, created_at DESC);
CREATE INDEX idx_ad_boosts_ad_id ON public.ad_boosts(ad_id);
CREATE INDEX idx_ad_boosts_user_date ON public.ad_boosts(user_id, boosted_at);

-- تفعيل RLS لجدول ad_boosts
ALTER TABLE public.ad_boosts ENABLE ROW LEVEL SECURITY;

-- سياسات أمان لجدول ad_boosts
CREATE POLICY "المستخدمون يمكنهم عرض ترقياتهم" 
ON public.ad_boosts 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "المستخدمون يمكنهم إضافة ترقيات" 
ON public.ad_boosts 
FOR INSERT 
WITH CHECK (user_id = auth.uid());

-- دالة حساب نقاط الأولوية للإعلان
CREATE OR REPLACE FUNCTION public.calculate_ad_priority_score(
  ad_id_param uuid
) RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  ad_record record;
  user_membership text;
  score numeric := 0;
  hours_since_created numeric;
  boost_multiplier numeric := 1;
BEGIN
  -- جلب بيانات الإعلان
  SELECT a.*, p.membership_type 
  INTO ad_record, user_membership
  FROM public.ads a
  JOIN public.profiles p ON a.user_id = p.user_id
  WHERE a.id = ad_id_param;
  
  IF NOT FOUND THEN
    RETURN 0;
  END IF;
  
  -- حساب عدد الساعات منذ النشر
  hours_since_created := EXTRACT(EPOCH FROM (now() - ad_record.created_at)) / 3600;
  
  -- النقاط الأساسية (تقل مع الوقت)
  score := GREATEST(1000 - (hours_since_created * 2), 100);
  
  -- مضاعف للمستخدمين المميزين
  IF user_membership = 'premium' THEN
    score := score * 1.5;
  END IF;
  
  -- مضاعف للإعلانات المميزة
  IF ad_record.is_premium THEN
    score := score * 1.3;
  END IF;
  
  -- مضاعف كبير للإعلانات في Top Spot النشطة
  IF ad_record.top_spot AND ad_record.top_spot_until > now() THEN
    -- تقليل النقاط بناءً على عدد مرات العرض للتدوير العادل
    boost_multiplier := GREATEST(10 - (ad_record.times_shown_top * 0.5), 5);
    score := score * boost_multiplier;
  END IF;
  
  -- تحديث النقاط في قاعدة البيانات
  UPDATE public.ads 
  SET priority_score = score 
  WHERE id = ad_id_param;
  
  RETURN score;
END;
$function$;

-- دالة تنظيف الإعلانات المنتهية الصلاحية
CREATE OR REPLACE FUNCTION public.cleanup_expired_top_spots()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  updated_count integer;
BEGIN
  -- إزالة حالة Top Spot من الإعلانات المنتهية الصلاحية
  UPDATE public.ads 
  SET 
    top_spot = false,
    top_spot_until = null
  WHERE top_spot = true 
    AND top_spot_until <= now();
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  
  -- تحديث حالة الترقيات المنتهية
  UPDATE public.ad_boosts 
  SET status = 'expired'
  WHERE status = 'active' 
    AND expires_at <= now();
  
  RETURN updated_count;
END;
$function$;

-- دالة فحص إمكانية ترقية الإعلان
CREATE OR REPLACE FUNCTION public.can_boost_ad(
  ad_id_param uuid,
  user_id_param uuid
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  ad_owner uuid;
  existing_boost_count integer;
  user_credits integer;
  user_membership text;
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
  SELECT credits, membership_type INTO user_credits, user_membership
  FROM public.profiles 
  WHERE user_id = user_id_param;
  
  IF user_membership != 'premium' AND user_credits < 5 THEN
    result := jsonb_set(result, '{reason}', '"تحتاج إلى 5 كريديت على الأقل لترقية الإعلان"');
    RETURN result;
  END IF;
  
  -- كل شيء على ما يرام
  result := jsonb_set(result, '{can_boost}', 'true');
  result := jsonb_set(result, '{cost}', CASE WHEN user_membership = 'premium' THEN '0' ELSE '5' END);
  
  RETURN result;
END;
$function$;

-- دالة ترقية الإعلان
CREATE OR REPLACE FUNCTION public.boost_ad_to_top_spot(
  ad_id_param uuid,
  user_id_param uuid,
  hours_duration integer DEFAULT 24
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  can_boost_result jsonb;
  cost_amount integer;
  user_membership text;
  expires_time timestamp with time zone;
  result jsonb := '{"success": false, "message": ""}'::jsonb;
BEGIN
  -- فحص إمكانية الترقية
  SELECT public.can_boost_ad(ad_id_param, user_id_param) INTO can_boost_result;
  
  IF NOT (can_boost_result->>'can_boost')::boolean THEN
    result := jsonb_set(result, '{message}', can_boost_result->'reason');
    RETURN result;
  END IF;
  
  cost_amount := (can_boost_result->>'cost')::integer;
  expires_time := now() + interval '1 hour' * hours_duration;
  
  -- الحصول على نوع العضوية
  SELECT membership_type INTO user_membership
  FROM public.profiles 
  WHERE user_id = user_id_param;
  
  -- خصم الكريديت إذا لم يكن مستخدم مميز
  IF user_membership != 'premium' AND cost_amount > 0 THEN
    UPDATE public.profiles 
    SET credits = credits - cost_amount
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
    cost,
    payment_method
  ) VALUES (
    ad_id_param, 
    user_id_param, 
    expires_time, 
    cost_amount,
    CASE WHEN user_membership = 'premium' THEN 'premium_membership' ELSE 'credits' END
  );
  
  result := jsonb_set(result, '{success}', 'true');
  result := jsonb_set(result, '{message}', '"تم ترقية الإعلان بنجاح"');
  result := jsonb_set(result, '{expires_at}', to_jsonb(expires_time));
  
  RETURN result;
END;
$function$;

-- دالة تسجيل عرض الإعلان
CREATE OR REPLACE FUNCTION public.record_ad_view(
  ad_id_param uuid,
  viewer_user_id uuid DEFAULT null
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  -- زيادة عداد المشاهدات العام
  UPDATE public.ads 
  SET view_count = view_count + 1
  WHERE id = ad_id_param;
  
  -- إذا كان الإعلان في Top Spot، سجل المشاهدة
  UPDATE public.ads 
  SET 
    times_shown_top = times_shown_top + 1,
    last_top_spot_viewed = now()
  WHERE id = ad_id_param 
    AND top_spot = true 
    AND top_spot_until > now();
END;
$function$;

-- إنشاء view للإعلانات مرتبة حسب الأولوية
CREATE OR REPLACE VIEW public.ads_prioritized AS
SELECT 
  a.*,
  p.display_name as seller_name,
  p.avatar_url as seller_avatar,
  p.membership_type as seller_membership,
  CASE 
    WHEN a.top_spot AND a.top_spot_until > now() THEN 'top_spot'
    WHEN a.is_premium THEN 'premium' 
    WHEN a.is_featured THEN 'featured'
    ELSE 'regular'
  END as display_tier,
  -- حساب الأولوية مع منع التكرار المتتالي
  CASE 
    WHEN a.top_spot AND a.top_spot_until > now() THEN
      -- للإعلانات في Top Spot: ترتيب عكسي حسب آخر مشاهدة ثم حسب عدد المشاهدات
      (EXTRACT(EPOCH FROM (now() - COALESCE(a.last_top_spot_viewed, a.created_at))) * 1000) - a.times_shown_top
    ELSE
      a.priority_score
  END as calculated_priority
FROM public.ads a
JOIN public.profiles p ON a.user_id = p.user_id
WHERE a.status = 'active'
ORDER BY 
  CASE 
    WHEN a.top_spot AND a.top_spot_until > now() THEN 1
    WHEN a.is_premium THEN 2
    WHEN a.is_featured THEN 3
    ELSE 4
  END,
  calculated_priority DESC,
  a.created_at DESC;