-- تحديث دالة handle_new_user لتشمل رقم الواتساب
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, phone, whatsapp, city, points, membership_type)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data ->> 'display_name', NEW.email),
    NEW.raw_user_meta_data ->> 'phone',
    NEW.raw_user_meta_data ->> 'whatsapp',
    NEW.raw_user_meta_data ->> 'city',
    20,
    'free'
  );
  RETURN NEW;
END;
$function$;