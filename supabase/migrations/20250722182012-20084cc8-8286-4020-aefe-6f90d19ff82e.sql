-- إنشاء جدول الملفات الشخصية للمستخدمين
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  display_name TEXT,
  phone TEXT,
  city TEXT,
  avatar_url TEXT,
  credits INTEGER DEFAULT 5,
  is_premium BOOLEAN DEFAULT false,
  premium_expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- إنشاء جدول الإعلانات
CREATE TABLE public.ads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(user_id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  price BIGINT NOT NULL,
  year INTEGER,
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  mileage TEXT,
  fuel_type TEXT DEFAULT 'بنزين',
  transmission TEXT DEFAULT 'أوتوماتيك',
  condition TEXT DEFAULT 'مستعملة',
  city TEXT NOT NULL,
  phone TEXT,
  whatsapp TEXT,
  images TEXT[] DEFAULT '{}',
  is_featured BOOLEAN DEFAULT false,
  is_premium BOOLEAN DEFAULT false,
  view_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'sold', 'pending')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- إنشاء جدول الرسائل
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID REFERENCES public.profiles(user_id) ON DELETE CASCADE NOT NULL,
  receiver_id UUID REFERENCES public.profiles(user_id) ON DELETE CASCADE NOT NULL,
  ad_id UUID REFERENCES public.ads(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- إنشاء جدول الإشعارات
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(user_id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'general' CHECK (type IN ('general', 'message', 'ad', 'credit')),
  is_read BOOLEAN DEFAULT false,
  data JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- إنشاء جدول المفضلة
CREATE TABLE public.favorites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(user_id) ON DELETE CASCADE NOT NULL,
  ad_id UUID REFERENCES public.ads(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, ad_id)
);

-- تمكين RLS لجميع الجداول
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

-- سياسات الملفات الشخصية
CREATE POLICY "المستخدمون يمكنهم عرض جميع الملفات الشخصية" 
ON public.profiles FOR SELECT USING (true);

CREATE POLICY "المستخدمون يمكنهم تحديث ملفهم الشخصي" 
ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "المستخدمون يمكنهم إنشاء ملفهم الشخصي" 
ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- سياسات الإعلانات
CREATE POLICY "الجميع يمكنهم عرض الإعلانات النشطة" 
ON public.ads FOR SELECT USING (status = 'active');

CREATE POLICY "المستخدمون يمكنهم إنشاء إعلاناتهم" 
ON public.ads FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "المستخدمون يمكنهم تحديث إعلاناتهم" 
ON public.ads FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "المستخدمون يمكنهم حذف إعلاناتهم" 
ON public.ads FOR DELETE USING (auth.uid() = user_id);

-- سياسات الرسائل
CREATE POLICY "المستخدمون يمكنهم عرض رسائلهم" 
ON public.messages FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "المستخدمون يمكنهم إرسال رسائل" 
ON public.messages FOR INSERT WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "المستخدمون يمكنهم تحديث رسائلهم" 
ON public.messages FOR UPDATE USING (auth.uid() = receiver_id);

-- سياسات الإشعارات
CREATE POLICY "المستخدمون يمكنهم عرض إشعاراتهم" 
ON public.notifications FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "المستخدمون يمكنهم تحديث إشعاراتهم" 
ON public.notifications FOR UPDATE USING (auth.uid() = user_id);

-- سياسات المفضلة
CREATE POLICY "المستخدمون يمكنهم عرض مفضلاتهم" 
ON public.favorites FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "المستخدمون يمكنهم إضافة مفضلات" 
ON public.favorites FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "المستخدمون يمكنهم حذف مفضلات" 
ON public.favorites FOR DELETE USING (auth.uid() = user_id);

-- دالة تحديث الوقت
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- تريقرز تحديث الوقت
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ads_updated_at
  BEFORE UPDATE ON public.ads
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- دالة إنشاء ملف شخصي عند التسجيل
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data ->> 'display_name', NEW.email));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- تريقر إنشاء ملف شخصي
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- إنشاء فهارس للأداء
CREATE INDEX idx_ads_user_id ON public.ads(user_id);
CREATE INDEX idx_ads_city ON public.ads(city);
CREATE INDEX idx_ads_brand ON public.ads(brand);
CREATE INDEX idx_ads_created_at ON public.ads(created_at DESC);
CREATE INDEX idx_messages_conversation ON public.messages(sender_id, receiver_id);
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_favorites_user_id ON public.favorites(user_id);