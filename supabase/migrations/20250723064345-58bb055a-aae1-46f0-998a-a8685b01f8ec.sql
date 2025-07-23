-- إضافة حقل is_new إلى جدول ads
ALTER TABLE public.ads ADD COLUMN IF NOT EXISTS is_new boolean DEFAULT false;

-- تحديث الfunction لتعمل بشكل صحيح
CREATE OR REPLACE FUNCTION public.update_ad_badges()
RETURNS TRIGGER
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
    ELSE
      NEW.is_new = false;
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
    ELSE
      NEW.is_new = false;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- إنشاء الtrigger إذا لم يكن موجوداً
DROP TRIGGER IF EXISTS update_ad_badges_trigger ON public.ads;
CREATE TRIGGER update_ad_badges_trigger
  BEFORE INSERT OR UPDATE ON public.ads
  FOR EACH ROW
  EXECUTE FUNCTION public.update_ad_badges();