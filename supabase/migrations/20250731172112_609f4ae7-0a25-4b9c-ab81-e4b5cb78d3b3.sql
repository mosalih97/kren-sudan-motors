
-- Add user_id_display column if it doesn't exist
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS user_id_display TEXT UNIQUE;

-- Create function to generate unique 8-digit ID
CREATE OR REPLACE FUNCTION public.generate_unique_user_id()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_id TEXT;
  id_exists BOOLEAN;
BEGIN
  LOOP
    -- Generate random 8-digit number
    new_id := LPAD((random() * 99999999)::int::text, 8, '0');
    
    -- Check if this ID already exists
    SELECT EXISTS(
      SELECT 1 FROM public.profiles WHERE user_id_display = new_id
    ) INTO id_exists;
    
    -- If ID doesn't exist, we can use it
    IF NOT id_exists THEN
      EXIT;
    END IF;
  END LOOP;
  
  RETURN new_id;
END;
$$;

-- Update existing users who don't have user_id_display
UPDATE public.profiles 
SET user_id_display = public.generate_unique_user_id()
WHERE user_id_display IS NULL;

-- Update the handle_new_user trigger function to include user_id_display
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (
    user_id, 
    display_name, 
    phone, 
    whatsapp, 
    city, 
    points, 
    membership_type, 
    user_id_display,
    credits
  )
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data ->> 'display_name', NEW.email),
    NEW.raw_user_meta_data ->> 'phone',
    NEW.raw_user_meta_data ->> 'whatsapp',
    NEW.raw_user_meta_data ->> 'city',
    20,
    'free',
    public.generate_unique_user_id(),
    CASE 
      WHEN NEW.raw_user_meta_data ->> 'membership_type' = 'premium' THEN 130
      ELSE 5
    END
  );
  RETURN NEW;
END;
$$;
