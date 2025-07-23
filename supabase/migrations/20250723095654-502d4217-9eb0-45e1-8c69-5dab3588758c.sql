-- إضافة عمود رقم الواتساب في جدول profiles
ALTER TABLE public.profiles 
ADD COLUMN whatsapp text;