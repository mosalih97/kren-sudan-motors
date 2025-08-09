-- Add new fields to store car papers, seller role, and broker commission
ALTER TABLE public.ads
  ADD COLUMN IF NOT EXISTS papers_type text,
  ADD COLUMN IF NOT EXISTS seller_role text,
  ADD COLUMN IF NOT EXISTS broker_commission_requested boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS broker_commission_amount integer NOT NULL DEFAULT 0;

-- Ensure seller_role is one of the allowed values when present
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'seller_role_valid'
  ) THEN
    ALTER TABLE public.ads 
      ADD CONSTRAINT seller_role_valid 
      CHECK (seller_role IN ('مالك','وكيل','وسيط') OR seller_role IS NULL);
  END IF;
END $$;

-- Keep broker commission values consistent
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'broker_commission_consistency'
  ) THEN
    ALTER TABLE public.ads 
      ADD CONSTRAINT broker_commission_consistency 
      CHECK (
        (NOT broker_commission_requested AND broker_commission_amount = 0)
        OR (broker_commission_requested AND broker_commission_amount >= 0)
      );
  END IF;
END $$;