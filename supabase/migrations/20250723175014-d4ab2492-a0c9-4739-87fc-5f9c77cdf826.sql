
-- إنشاء جدول لتتبع محاولات التحقق من الإيصالات البنكية
CREATE TABLE public.receipt_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  image_urls TEXT[] NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'success', 'failed')),
  reason TEXT,
  extracted_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- إضافة RLS للجدول
ALTER TABLE public.receipt_logs ENABLE ROW LEVEL SECURITY;

-- سياسة للمستخدمين لعرض سجلاتهم فقط
CREATE POLICY "Users can view their own receipt logs"
  ON public.receipt_logs
  FOR SELECT
  USING (auth.uid() = user_id);

-- سياسة للمستخدمين لإنشاء سجلات جديدة
CREATE POLICY "Users can create their own receipt logs"
  ON public.receipt_logs
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- إنشاء bucket للإيصالات البنكية
INSERT INTO storage.buckets (id, name, public) 
VALUES ('bank-receipts', 'bank-receipts', false);

-- سياسة للمستخدمين لرفع إيصالاتهم
CREATE POLICY "Users can upload their bank receipts"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'bank-receipts' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- سياسة للمستخدمين لعرض إيصالاتهم
CREATE POLICY "Users can view their bank receipts"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'bank-receipts' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- إضافة trigger للتحديث التلقائي لـ updated_at
CREATE TRIGGER update_receipt_logs_updated_at
  BEFORE UPDATE ON public.receipt_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
