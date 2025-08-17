-- Check if license_status column exists and only add if it doesn't
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'ads' 
        AND column_name = 'license_status' 
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.ads ADD COLUMN license_status TEXT;
    END IF;
END $$;