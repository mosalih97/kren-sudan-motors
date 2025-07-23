
-- إنشاء جدول طلبات الإيصالات
CREATE TABLE public.receipt_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  membership_id TEXT NOT NULL,
  receipt_url TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  verified_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  extracted_text TEXT
);

-- تمكين RLS
ALTER TABLE public.receipt_submissions ENABLE ROW LEVEL SECURITY;

-- سياسة للمستخدمين لعرض طلباتهم فقط
CREATE POLICY "Users can view their own receipt submissions" 
ON public.receipt_submissions FOR SELECT 
USING (auth.uid() = user_id);

-- سياسة للمستخدمين لإنشاء طلبات جديدة
CREATE POLICY "Users can create receipt submissions" 
ON public.receipt_submissions FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- فهرسة للأداء
CREATE INDEX idx_receipt_submissions_user_id ON public.receipt_submissions(user_id);
CREATE INDEX idx_receipt_submissions_status ON public.receipt_submissions(status);
CREATE INDEX idx_receipt_submissions_membership_id ON public.receipt_submissions(membership_id);
