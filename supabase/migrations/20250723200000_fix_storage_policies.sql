
-- إنشاء سياسات التخزين للإيصالات البنكية
CREATE POLICY "Users can upload bank receipts" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'bank-receipts' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own bank receipts" ON storage.objects
FOR SELECT USING (
  bucket_id = 'bank-receipts' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own bank receipts" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'bank-receipts' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own bank receipts" ON storage.objects
FOR DELETE USING (
  bucket_id = 'bank-receipts' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
