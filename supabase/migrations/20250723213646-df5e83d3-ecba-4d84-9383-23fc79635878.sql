
-- إنشاء جدول لتخزين أرقام العمليات المستخدمة لمنع التكرار
CREATE TABLE public.used_receipt_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_number TEXT NOT NULL UNIQUE,
  receipt_date DATE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- تمكين RLS
ALTER TABLE public.used_receipt_transactions ENABLE ROW LEVEL SECURITY;

-- سياسة للمستخدمين لعرض معاملاتهم فقط
CREATE POLICY "Users can view their own used transactions" 
ON public.used_receipt_transactions FOR SELECT 
USING (auth.uid() = user_id);

-- سياسة للمستخدمين لإضافة معاملات جديدة
CREATE POLICY "Users can create used transactions" 
ON public.used_receipt_transactions FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- فهرسة للأداء
CREATE INDEX idx_used_receipt_transactions_number ON public.used_receipt_transactions(transaction_number);
CREATE INDEX idx_used_receipt_transactions_date ON public.used_receipt_transactions(receipt_date);
CREATE INDEX idx_used_receipt_transactions_user_id ON public.used_receipt_transactions(user_id);

-- إضافة عمود رقم العملية في جدول receipt_submissions
ALTER TABLE public.receipt_submissions 
ADD COLUMN transaction_number TEXT,
ADD COLUMN receipt_date DATE;

-- إضافة فهرسة لرقم العملية
CREATE INDEX idx_receipt_submissions_transaction_number ON public.receipt_submissions(transaction_number);
