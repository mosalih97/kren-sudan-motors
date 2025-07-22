-- إصلاح مشاكل الأمان المكتشفة
-- تحديث الدوال لتعيين search_path بشكل آمن

-- تحديث دالة reset_monthly_ads_if_needed
CREATE OR REPLACE FUNCTION public.reset_monthly_ads_if_needed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- التحقق إذا كان الشهر الحالي مختلف عن آخر إعادة تعيين
  IF date_trunc('month', now()) > date_trunc('month', OLD.last_monthly_reset) THEN
    NEW.monthly_ads_count = 0;
    NEW.last_monthly_reset = now();
  END IF;
  
  RETURN NEW;
END;
$$;

-- تحديث دالة update_ad_badges
CREATE OR REPLACE FUNCTION public.update_ad_badges()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  user_membership text;
  recent_premium_ads_count integer;
BEGIN
  -- الحصول على نوع عضوية المستخدم
  SELECT membership_type INTO user_membership
  FROM public.profiles
  WHERE user_id = NEW.user_id;

  -- إذا كان المستخدم مميز
  IF user_membership = 'premium' THEN
    NEW.is_premium = true;
    NEW.is_featured = true;
    
    -- التحقق إذا كان من آخر 10 إعلانات مميزة لإضافة شارة جديد
    SELECT COUNT(*) INTO recent_premium_ads_count
    FROM public.ads a
    JOIN public.profiles p ON a.user_id = p.user_id
    WHERE p.membership_type = 'premium'
    AND a.created_at > NEW.created_at
    AND a.id != NEW.id;
    
    IF recent_premium_ads_count < 10 THEN
      NEW.is_new = true;
    END IF;
    
  ELSE
    -- للمستخدمين العاديين
    NEW.is_premium = false;
    NEW.is_featured = false;
    
    -- شارة جديد لآخر 10 إعلانات عامة
    SELECT COUNT(*) INTO recent_premium_ads_count
    FROM public.ads
    WHERE created_at > NEW.created_at
    AND id != NEW.id;
    
    IF recent_premium_ads_count < 10 THEN
      NEW.is_new = true;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- تحديث دالة deduct_points
CREATE OR REPLACE FUNCTION public.deduct_points(user_id_param uuid, points_to_deduct integer)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  current_points integer;
  user_membership text;
BEGIN
  -- الحصول على النقاط الحالية ونوع العضوية
  SELECT points, membership_type INTO current_points, user_membership
  FROM public.profiles
  WHERE user_id = user_id_param;

  -- إذا كان مستخدم مميز، لا يتم خصم النقاط
  IF user_membership = 'premium' THEN
    RETURN true;
  END IF;

  -- التحقق من توفر النقاط الكافية
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

-- تحديث دالة update_updated_at_column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- تحديث دالة handle_new_user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, points, membership_type)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data ->> 'display_name', NEW.email),
    20,
    'free'
  );
  RETURN NEW;
END;
$$;