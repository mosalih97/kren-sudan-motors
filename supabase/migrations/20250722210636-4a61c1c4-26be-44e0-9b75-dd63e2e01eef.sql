-- Remove ad review feature - make ads active by default
ALTER TABLE public.ads 
ALTER COLUMN status SET DEFAULT 'active';

-- Update any pending ads to be active
UPDATE public.ads 
SET status = 'active' 
WHERE status = 'pending';