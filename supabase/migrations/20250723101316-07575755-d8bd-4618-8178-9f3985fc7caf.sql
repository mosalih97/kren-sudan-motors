-- إضافة عمود user_id_display في جدول profiles
ALTER TABLE public.profiles 
ADD COLUMN user_id_display text UNIQUE;

-- دالة لتوليد رقم ID مميز عشوائي مكون من 8 أرقام
CREATE OR REPLACE FUNCTION public.generate_unique_user_id()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  new_id text;
  id_exists boolean;
BEGIN
  LOOP
    -- توليد رقم عشوائي مكون من 8 أرقام
    new_id := LPAD((random() * 99999999)::int::text, 8, '0');
    
    -- التحقق من عدم وجود هذا الرقم مسبقاً
    SELECT EXISTS(SELECT 1 FROM public.profiles WHERE user_id_display = new_id) INTO id_exists;
    
    -- إذا لم يكن موجود، اخرج من الحلقة
    IF NOT id_exists THEN
      EXIT;
    END IF;
  END LOOP;
  
  RETURN new_id;
END;
$function$;

-- تحديث جميع المستخدمين الحاليين بإعطائهم ID مميز
UPDATE public.profiles 
SET user_id_display = public.generate_unique_user_id()
WHERE user_id_display IS NULL;

-- تحديث دالة handle_new_user لتشمل توليد ID مميز
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, phone, whatsapp, city, points, membership_type, user_id_display)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data ->> 'display_name', NEW.email),
    NEW.raw_user_meta_data ->> 'phone',
    NEW.raw_user_meta_data ->> 'whatsapp',
    NEW.raw_user_meta_data ->> 'city',
    20,
    'free',
    public.generate_unique_user_id()
  );
  RETURN NEW;
END;
$function$;