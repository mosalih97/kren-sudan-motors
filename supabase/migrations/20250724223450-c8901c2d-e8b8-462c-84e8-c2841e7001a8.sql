
-- إنشاء جدول لتخزين أرقام العمليات المستخدمة
CREATE TABLE public.used_transaction_ids (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  transaction_id text NOT NULL UNIQUE,
  user_id text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- إنشاء جدول لتخزين إيصالات الدفع
CREATE TABLE public.payment_receipts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id text NOT NULL,
  transaction_id text NOT NULL,
  white_image_url text NOT NULL,
  green_image_url text NOT NULL,
  date_of_payment timestamp with time zone NOT NULL,
  verified boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- تفعيل Row Level Security
ALTER TABLE public.used_transaction_ids ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_receipts ENABLE ROW LEVEL SECURITY;

-- إنشاء سياسات الأمان
CREATE POLICY "Users can view their own used transaction IDs" 
  ON public.used_transaction_ids 
  FOR SELECT 
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert their own used transaction IDs" 
  ON public.used_transaction_ids 
  FOR INSERT 
  WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can view their own payment receipts" 
  ON public.payment_receipts 
  FOR SELECT 
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert their own payment receipts" 
  ON public.payment_receipts 
  FOR INSERT 
  WITH CHECK (auth.uid()::text = user_id);

-- إنشاء فهارس للبحث السريع
CREATE INDEX idx_used_transaction_ids_transaction_id ON public.used_transaction_ids(transaction_id);
CREATE INDEX idx_payment_receipts_user_id ON public.payment_receipts(user_id);
CREATE INDEX idx_payment_receipts_transaction_id ON public.payment_receipts(transaction_id);
