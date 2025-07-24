
-- إصلاح دالة تعزيز الإعلان لتجنب مشكلة التحديث المتزامن
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

-- إصلاح دالة تنظيف الإعلانات المنتهية
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
        AND top_spot_until < now();
    
    -- تحديث حالة التعزيز المنتهي
    UPDATE public.ad_boosts 
    SET 
        status = 'expired',
        updated_at = now()
    WHERE status = 'active' 
        AND expires_at < now();
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
