-- إضافة حقول جديدة لجدول profiles لدعم نظام العضوية والنقاط
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS membership_type text DEFAULT 'free' CHECK (membership_type IN ('free', 'premium')),
ADD COLUMN IF NOT EXISTS points integer DEFAULT 20,
ADD COLUMN IF NOT EXISTS frozen_points integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS monthly_ads_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_monthly_reset timestamp with time zone DEFAULT date_trunc('month', now());

-- إضافة حقل لتتبع استخدام النقاط لكل إعلان
CREATE TABLE IF NOT EXISTS public.ad_interactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  ad_id uuid NOT NULL,
  interaction_type text NOT NULL CHECK (interaction_type IN ('phone_view', 'whatsapp_view')),
  points_spent integer DEFAULT 1,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, ad_id, interaction_type)
);

-- تمكين RLS على جدول ad_interactions
ALTER TABLE public.ad_interactions ENABLE ROW LEVEL SECURITY;

-- سياسات RLS لجدول ad_interactions
CREATE POLICY "المستخدمون يمكنهم عرض تفاعلاتهم" 
ON public.ad_interactions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "المستخدمون يمكنهم إضافة تفاعلاتهم" 
ON public.ad_interactions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- دالة لإعادة تعيين عدد الإعلانات الشهرية
CREATE OR REPLACE FUNCTION public.reset_monthly_ads_if_needed()
RETURNS trigger
LANGUAGE plpgsql
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

-- إنشاء trigger لإعادة تعيين عدد الإعلانات الشهرية
DROP TRIGGER IF EXISTS reset_monthly_ads_trigger ON public.profiles;
CREATE TRIGGER reset_monthly_ads_trigger
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.reset_monthly_ads_if_needed();

-- دالة لتحديث شارات الإعلانات حسب نوع العضوية
CREATE OR REPLACE FUNCTION public.update_ad_badges()
RETURNS trigger
LANGUAGE plpgsql
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

-- إنشاء trigger لتحديث شارات الإعلانات
DROP TRIGGER IF EXISTS update_ad_badges_trigger ON public.ads;
CREATE TRIGGER update_ad_badges_trigger
  BEFORE INSERT ON public.ads
  FOR EACH ROW
  EXECUTE FUNCTION public.update_ad_badges();

-- دالة لخصم النقاط
CREATE OR REPLACE FUNCTION public.deduct_points(user_id_param uuid, points_to_deduct integer)
RETURNS boolean
LANGUAGE plpgsql
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

-- تحديث المستخدمين الحاليين بالنقاط الافتراضية
UPDATE public.profiles 
SET points = 20, membership_type = 'free' 
WHERE points IS NULL OR membership_type IS NULL;