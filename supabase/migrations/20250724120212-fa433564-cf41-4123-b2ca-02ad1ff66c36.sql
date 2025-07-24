
-- إنشاء جدول لحفظ بيانات الجوازات المتحققة
CREATE TABLE public.verified_passports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  passport_image_url TEXT NOT NULL,
  passport_number TEXT,
  full_name TEXT,
  receipt_id UUID REFERENCES public.receipt_submissions(id),
  verified BOOLEAN DEFAULT false,
  verification_status TEXT DEFAULT 'pending',
  extracted_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- إضافة Row Level Security
ALTER TABLE public.verified_passports ENABLE ROW LEVEL SECURITY;

-- سياسة للمستخدمين لإنشاء بيانات جوازاتهم
CREATE POLICY "Users can create their own passport verification" 
  ON public.verified_passports 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- سياسة للمستخدمين لعرض بيانات جوازاتهم
CREATE POLICY "Users can view their own passport verification" 
  ON public.verified_passports 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- سياسة للمستخدمين لتحديث بيانات جوازاتهم
CREATE POLICY "Users can update their own passport verification" 
  ON public.verified_passports 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- إنشاء bucket لحفظ صور الجوازات
INSERT INTO storage.buckets (id, name, public) 
VALUES ('user-passports', 'user-passports', false);

-- سياسة للمستخدمين لرفع صور جوازاتهم
CREATE POLICY "Users can upload their passport images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'user-passports' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- سياسة للمستخدمين لعرض صور جوازاتهم
CREATE POLICY "Users can view their passport images"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'user-passports' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- إضافة trigger لتحديث updated_at
CREATE OR REPLACE FUNCTION update_verified_passports_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_verified_passports_updated_at
  BEFORE UPDATE ON public.verified_passports
  FOR EACH ROW
  EXECUTE FUNCTION update_verified_passports_updated_at();
