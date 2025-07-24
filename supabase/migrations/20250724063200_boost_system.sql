
-- إنشاء جدول ad_boosts إذا لم يكن موجوداً
CREATE TABLE IF NOT EXISTS public.ad_boosts (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    ad_id uuid NOT NULL REFERENCES public.ads(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
    boost_plan text NOT NULL DEFAULT 'basic',
    cost integer NOT NULL DEFAULT 5,
    expires_at timestamp with time zone NOT NULL,
    original_expires_at timestamp with time zone,
    views_gained integer DEFAULT 0,
    tier_priority integer DEFAULT 1,
    status text DEFAULT 'active',
    payment_method text DEFAULT 'points',
    boosted_at timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- إضافة فهارس للأداء
CREATE INDEX IF NOT EXISTS idx_ad_boosts_ad_id ON public.ad_boosts(ad_id);
CREATE INDEX IF NOT EXISTS idx_ad_boosts_user_id ON public.ad_boosts(user_id);
CREATE INDEX IF NOT EXISTS idx_ad_boosts_expires_at ON public.ad_boosts(expires_at);
CREATE INDEX IF NOT EXISTS idx_ad_boosts_plan ON public.ad_boosts(boost_plan);

-- تفعيل Row Level Security
ALTER TABLE public.ad_boosts ENABLE ROW LEVEL SECURITY;

-- إنشاء سياسات الأمان
CREATE POLICY "Users can view their own boosts" ON public.ad_boosts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own boosts" ON public.ad_boosts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own boosts" ON public.ad_boosts
    FOR UPDATE USING (auth.uid() = user_id);

-- دالة لحساب إجمالي النقاط للمستخدم
CREATE OR REPLACE FUNCTION public.get_user_total_points(user_id_param uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    user_profile record;
    base_points integer := 0;
    premium_credits integer := 0;
    total_points integer := 0;
    monthly_ads_count integer := 0;
    monthly_ads_limit integer := 5;
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
            'membership_type', 'free',
            'monthly_ads_count', 0,
            'monthly_ads_limit', 5
        );
    END IF;
    
    -- النقاط الأساسية
    base_points := COALESCE(user_profile.points, 0);
    
    -- نقاط العضوية المميزة
    premium_credits := COALESCE(user_profile.credits, 0);
    
    -- عدد الإعلانات الشهرية
    monthly_ads_count := COALESCE(user_profile.monthly_ads_count, 0);
    
    -- حد الإعلانات حسب نوع العضوية
    IF user_profile.membership_type = 'premium' THEN
        monthly_ads_limit := 40;
        total_points := base_points + premium_credits;
    ELSE
        monthly_ads_limit := 5;
        total_points := base_points;
    END IF;
    
    result := jsonb_build_object(
        'total_points', total_points,
        'base_points', base_points,
        'premium_credits', premium_credits,
        'membership_type', COALESCE(user_profile.membership_type, 'free'),
        'monthly_ads_count', monthly_ads_count,
        'monthly_ads_limit', monthly_ads_limit
    );
    
    RETURN result;
END;
$$;

-- دالة لفحص إمكانية تعزيز الإعلان
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
        result := jsonb_set(result, '{reason}', '"لا يمكنك تعزيز إعلان لا تملكه"');
        RETURN result;
    END IF;
    
    -- التحقق من وجود تعزيز نشط لنفس الإعلان اليوم
    SELECT COUNT(*) INTO existing_boost_count
    FROM public.ad_boosts
    WHERE ad_id = ad_id_param 
        AND user_id = user_id_param
        AND DATE(boosted_at) = CURRENT_DATE
        AND status = 'active';
    
    IF existing_boost_count > 0 THEN
        result := jsonb_set(result, '{reason}', '"لا يمكن تعزيز نفس الإعلان أكثر من مرة في اليوم"');
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

-- دالة لتعزيز الإعلان
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
    
    -- خصم النقاط حسب الأولوية
    IF user_profile.membership_type = 'premium' THEN
        IF user_profile.credits >= cost_amount THEN
            UPDATE public.profiles 
            SET credits = credits - cost_amount,
                updated_at = now()
            WHERE user_id = user_id_param;
        ELSE
            DECLARE
                remaining_cost integer := cost_amount - user_profile.credits;
            BEGIN
                UPDATE public.profiles 
                SET 
                    credits = 0,
                    points = points - remaining_cost,
                    updated_at = now()
                WHERE user_id = user_id_param;
            END;
        END IF;
    ELSE
        UPDATE public.profiles 
        SET points = points - cost_amount,
            updated_at = now()
        WHERE user_id = user_id_param;
    END IF;
    
    -- تعزيز الإعلان
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
        payment_method
    ) VALUES (
        ad_id_param, 
        user_id_param, 
        boost_plan,
        cost_amount,
        expires_time,
        expires_time,
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
$$;

-- تحديث دالة cleanup_expired_top_spots لتنظيف الإعلانات المنتهية
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

-- تحديث trigger لحساب عدد الإعلانات الشهرية
CREATE OR REPLACE FUNCTION public.update_monthly_ads_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- زيادة عدد الإعلانات الشهرية
        UPDATE public.profiles
        SET monthly_ads_count = monthly_ads_count + 1,
            updated_at = now()
        WHERE user_id = NEW.user_id;
        
        RETURN NEW;
    END IF;
    
    RETURN NULL;
END;
$$;

-- إنشاء trigger لتحديث عدد الإعلانات
DROP TRIGGER IF EXISTS update_monthly_ads_count_trigger ON public.ads;
CREATE TRIGGER update_monthly_ads_count_trigger
    AFTER INSERT ON public.ads
    FOR EACH ROW
    EXECUTE FUNCTION public.update_monthly_ads_count();
