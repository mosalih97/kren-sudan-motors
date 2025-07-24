
-- إصلاح مشاكل نظام التعزيز

-- تحديث دالة cleanup_expired_top_spots لتعمل بشكل صحيح
CREATE OR REPLACE FUNCTION public.cleanup_expired_top_spots()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- تنظيف الإعلانات المعززة المنتهية
    UPDATE public.ads 
    SET 
        top_spot = false,
        top_spot_until = null,
        updated_at = now()
    WHERE top_spot = true 
        AND (top_spot_until IS NULL OR top_spot_until < now());
    
    -- تحديث حالة التعزيز المنتهي
    UPDATE public.ad_boosts 
    SET 
        status = 'expired',
        updated_at = now()
    WHERE status = 'active' 
        AND expires_at < now();
        
    -- تسجيل عدد الإعلانات التي تم تنظيفها
    RAISE NOTICE 'تم تنظيف الإعلانات المنتهية الصلاحية';
END;
$$;

-- تحسين دالة can_boost_ad_enhanced
CREATE OR REPLACE FUNCTION public.can_boost_ad_enhanced(
    ad_id_param uuid,
    user_id_param uuid,
    boost_plan text DEFAULT 'basic'
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    ad_owner uuid;
    ad_status text;
    existing_boost_count integer;
    user_points_data jsonb;
    plan_cost integer;
    result jsonb := '{"can_boost": false, "reason": ""}'::jsonb;
BEGIN
    -- التحقق من وجود الإعلان وملكيته
    SELECT user_id, status INTO ad_owner, ad_status
    FROM public.ads 
    WHERE id = ad_id_param;
    
    IF ad_owner IS NULL THEN
        result := jsonb_set(result, '{reason}', '"الإعلان غير موجود"');
        RETURN result;
    END IF;
    
    IF ad_status != 'active' THEN
        result := jsonb_set(result, '{reason}', '"الإعلان غير نشط"');
        RETURN result;
    END IF;
    
    IF ad_owner != user_id_param THEN
        result := jsonb_set(result, '{reason}', '"لا يمكنك تعزيز إعلان لا تملكه"');
        RETURN result;
    END IF;
    
    -- التحقق من وجود تعزيز نشط لنفس الإعلان
    SELECT COUNT(*) INTO existing_boost_count
    FROM public.ad_boosts
    WHERE ad_id = ad_id_param 
        AND user_id = user_id_param
        AND status = 'active'
        AND expires_at > now();
    
    IF existing_boost_count > 0 THEN
        result := jsonb_set(result, '{reason}', '"الإعلان معزز بالفعل"');
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
    
    -- كل شيء على ما يرام
    result := jsonb_set(result, '{can_boost}', 'true');
    result := jsonb_set(result, '{cost}', to_jsonb(plan_cost));
    result := jsonb_set(result, '{user_points}', user_points_data);
    
    RETURN result;
END;
$$;

-- إعادة كتابة دالة boost_ad_enhanced لحل مشاكل التحديث المتزامن
CREATE OR REPLACE FUNCTION public.boost_ad_enhanced(
    ad_id_param uuid,
    user_id_param uuid,
    boost_plan text DEFAULT 'basic'
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    can_boost_result jsonb;
    cost_amount integer;
    hours_duration integer;
    tier_priority integer;
    user_profile record;
    expires_time timestamp with time zone;
    result jsonb := '{"success": false, "message": ""}'::jsonb;
    remaining_cost integer;
BEGIN
    -- تنظيف الإعلانات المنتهية أولاً
    PERFORM public.cleanup_expired_top_spots();
    
    -- فحص إمكانية التعزيز
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
    
    IF NOT FOUND THEN
        result := jsonb_set(result, '{message}', '"بيانات المستخدم غير موجودة"');
        RETURN result;
    END IF;
    
    -- خصم النقاط حسب الأولوية وفي عملية واحدة
    IF user_profile.membership_type = 'premium' THEN
        IF user_profile.credits >= cost_amount THEN
            -- خصم من نقاط العضوية المميزة فقط
            UPDATE public.profiles 
            SET credits = credits - cost_amount,
                updated_at = now()
            WHERE user_id = user_id_param;
        ELSE
            -- خصم جزئي من نقاط العضوية المميزة والباقي من النقاط الأساسية
            remaining_cost := cost_amount - user_profile.credits;
            UPDATE public.profiles 
            SET 
                credits = 0,
                points = points - remaining_cost,
                updated_at = now()
            WHERE user_id = user_id_param;
        END IF;
    ELSE
        -- خصم من النقاط الأساسية للمستخدمين العاديين
        UPDATE public.profiles 
        SET points = points - cost_amount,
            updated_at = now()
        WHERE user_id = user_id_param;
    END IF;
    
    -- تعزيز الإعلان في عملية منفصلة
    UPDATE public.ads 
    SET 
        top_spot = true,
        top_spot_until = expires_time,
        times_shown_top = 0,
        updated_at = now()
    WHERE id = ad_id_param;
    
    -- التأكد من نجاح التحديث
    IF NOT FOUND THEN
        result := jsonb_set(result, '{message}', '"فشل في تعزيز الإعلان"');
        RETURN result;
    END IF;
    
    -- تسجيل التعزيز
    INSERT INTO public.ad_boosts (
        ad_id, 
        user_id, 
        boost_plan,
        cost,
        expires_at,
        original_expires_at,
        tier_priority,
        payment_method,
        status
    ) VALUES (
        ad_id_param, 
        user_id_param, 
        boost_plan,
        cost_amount,
        expires_time,
        expires_time,
        tier_priority,
        'points',
        'active'
    );
    
    result := jsonb_set(result, '{success}', 'true');
    result := jsonb_set(result, '{message}', '"تم تعزيز الإعلان بنجاح"');
    result := jsonb_set(result, '{expires_at}', to_jsonb(expires_time));
    result := jsonb_set(result, '{cost}', to_jsonb(cost_amount));
    result := jsonb_set(result, '{plan}', to_jsonb(boost_plan));
    result := jsonb_set(result, '{hours_duration}', to_jsonb(hours_duration));
    
    RETURN result;
END;
$$;

-- إنشاء دالة لحساب أولوية الإعلانات المعززة
CREATE OR REPLACE FUNCTION public.calculate_boosted_ad_priority(ad_id_param uuid)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    boost_multiplier numeric := 1;
    base_priority numeric := 1000;
    boost_info record;
BEGIN
    -- جلب معلومات التعزيز النشط
    SELECT 
        boost_plan,
        tier_priority,
        expires_at
    INTO boost_info
    FROM public.ad_boosts
    WHERE ad_id = ad_id_param 
        AND status = 'active'
        AND expires_at > now()
    ORDER BY tier_priority DESC, expires_at DESC
    LIMIT 1;
    
    IF FOUND THEN
        -- حساب المضاعف حسب نوع الباقة
        CASE boost_info.boost_plan
            WHEN 'basic' THEN boost_multiplier := 5;
            WHEN 'premium' THEN boost_multiplier := 10;
            WHEN 'ultimate' THEN boost_multiplier := 20;
        END CASE;
        
        base_priority := base_priority * boost_multiplier;
    END IF;
    
    -- تحديث أولوية الإعلان
    UPDATE public.ads 
    SET priority_score = base_priority
    WHERE id = ad_id_param;
    
    RETURN base_priority;
END;
$$;

-- إنشاء trigger للتنظيف التلقائي للإعلانات المنتهية
DROP TRIGGER IF EXISTS cleanup_expired_ads_trigger ON public.ads;
CREATE OR REPLACE FUNCTION public.cleanup_expired_ads_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- تنظيف الإعلانات المنتهية عند كل استعلام
    PERFORM public.cleanup_expired_top_spots();
    RETURN NEW;
END;
$$;

-- إنشاء view محسن للإعلانات المرتبة
CREATE OR REPLACE VIEW public.ads_with_boost_info AS
SELECT 
    a.*,
    p.display_name as seller_name,
    p.avatar_url as seller_avatar,
    p.membership_type as seller_membership,
    p.phone as seller_phone,
    p.whatsapp as seller_whatsapp,
    ab.boost_plan,
    ab.expires_at as boost_expires_at,
    ab.tier_priority,
    CASE 
        WHEN a.top_spot AND a.top_spot_until > now() THEN 'boosted'
        WHEN a.is_premium THEN 'premium' 
        WHEN a.is_featured THEN 'featured'
        ELSE 'regular'
    END as display_tier,
    -- حساب الأولوية
    CASE 
        WHEN a.top_spot AND a.top_spot_until > now() THEN
            1000000 + COALESCE(ab.tier_priority, 1) * 100000 - COALESCE(a.times_shown_top, 0)
        WHEN a.is_premium THEN
            100000 + EXTRACT(EPOCH FROM (now() - a.created_at)) / 3600
        WHEN a.is_featured THEN
            10000 + EXTRACT(EPOCH FROM (now() - a.created_at)) / 3600
        ELSE
            1000 - EXTRACT(EPOCH FROM (now() - a.created_at)) / 3600
    END as calculated_priority
FROM public.ads a
LEFT JOIN public.profiles p ON a.user_id = p.user_id
LEFT JOIN public.ad_boosts ab ON a.id = ab.ad_id 
    AND ab.status = 'active' 
    AND ab.expires_at > now()
WHERE a.status = 'active'
ORDER BY calculated_priority DESC, a.created_at DESC;

-- إنشاء فهارس إضافية للأداء
CREATE INDEX IF NOT EXISTS idx_ads_boost_priority 
ON public.ads(top_spot, top_spot_until, priority_score) 
WHERE top_spot = true;

CREATE INDEX IF NOT EXISTS idx_ad_boosts_active 
ON public.ad_boosts(ad_id, status, expires_at) 
WHERE status = 'active';

-- تفعيل التنظيف التلقائي
SELECT cron.schedule('cleanup-expired-ads', '*/5 * * * *', 'SELECT public.cleanup_expired_top_spots();');
