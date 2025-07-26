
-- Create the missing admin dashboard stats view
CREATE OR REPLACE VIEW admin_dashboard_stats AS
SELECT 
  (SELECT COUNT(*) FROM profiles) as total_users,
  (SELECT COUNT(*) FROM profiles WHERE membership_type = 'premium') as premium_users,
  (SELECT COUNT(*) FROM profiles WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE)) as new_users_this_month,
  (SELECT COUNT(*) FROM ads WHERE status = 'active') as active_ads,
  (SELECT COUNT(*) FROM ads WHERE status = 'deleted') as deleted_ads,
  (SELECT COUNT(*) FROM ads WHERE is_premium = true AND status = 'active') as premium_ads,
  (SELECT COUNT(*) FROM ad_boosts WHERE status = 'active' AND expires_at > now()) as active_boosts,
  (SELECT COUNT(*) FROM ad_boosts WHERE boost_plan = 'basic') as basic_boosts,
  (SELECT COUNT(*) FROM ad_boosts WHERE boost_plan = 'premium') as premium_boosts,
  (SELECT COUNT(*) FROM ad_boosts WHERE boost_plan = 'ultimate') as ultimate_boosts,
  (SELECT COALESCE(SUM(points), 0) FROM profiles) as total_points,
  (SELECT COALESCE(SUM(credits), 0) FROM profiles) as total_credits;

-- Add missing column to admin_credentials table
ALTER TABLE public.admin_credentials ADD COLUMN IF NOT EXISTS admin_user_id UUID REFERENCES public.profiles(user_id);

-- Update existing admin credential record to link with admin profile
UPDATE public.admin_credentials 
SET admin_user_id = (
  SELECT user_id FROM public.profiles WHERE membership_type = 'admin' LIMIT 1
)
WHERE admin_user_id IS NULL;

-- Ensure we have admin credentials and profile
DO $$
DECLARE
    admin_profile_exists BOOLEAN;
    admin_creds_exists BOOLEAN;
BEGIN
    -- Check if admin profile exists
    SELECT EXISTS(
        SELECT 1 FROM public.profiles 
        WHERE user_id = '00000000-0000-0000-0000-000000000001'::uuid
        AND membership_type = 'admin'
    ) INTO admin_profile_exists;
    
    -- Check if admin credentials exist
    SELECT EXISTS(
        SELECT 1 FROM public.admin_credentials 
        WHERE username = 'admin'
    ) INTO admin_creds_exists;
    
    -- Create admin profile if it doesn't exist
    IF NOT admin_profile_exists THEN
        INSERT INTO public.profiles (
            user_id,
            display_name,
            phone,
            city,
            membership_type,
            is_premium,
            points,
            credits,
            user_id_display
        )
        VALUES (
            '00000000-0000-0000-0000-000000000001'::uuid,
            'مدير النظام',
            '+966500000000',
            'الرياض',
            'admin',
            true,
            1000,
            1000,
            '00000001'
        );
    END IF;
    
    -- Create admin credentials if they don't exist
    IF NOT admin_creds_exists THEN
        INSERT INTO public.admin_credentials (
            username, 
            password_hash,
            admin_user_id
        )
        VALUES (
            'admin', 
            crypt('admin123', gen_salt('bf')),
            '00000000-0000-0000-0000-000000000001'::uuid
        );
    END IF;
END $$;
