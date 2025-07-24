
-- إنشاء جدول أنواع التعزيز
CREATE TABLE public.boost_types (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  label TEXT NOT NULL,
  duration_hours INTEGER NOT NULL,
  points_cost INTEGER NOT NULL,
  features JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- إدراج أنواع التعزيز المختلفة
INSERT INTO public.boost_types (label, duration_hours, points_cost, features) VALUES
('سريع', 1, 5, '{"description": "ظهور في أعلى النتائج لمدة ساعة واحدة", "view_increase": 200, "priority": 10}'),
('مميز', 72, 60, '{"description": "شارة مميز على الإعلان وتثبيت في المقدمة", "view_increase": 500, "priority": 50, "badge": "مميز"}'),
('احترافي', 168, 100, '{"description": "ظهور شامل في كافة أقسام النتائج", "view_increase": 800, "priority": 100, "badge": "احترافي"}');

-- إنشاء جدول سجل التعزيزات
CREATE TABLE public.ad_boost_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ad_id UUID NOT NULL REFERENCES public.ads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  boost_type_id UUID NOT NULL REFERENCES public.boost_types(id),
  start_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- إضافة عمود priority_score لجدول الإعلانات
ALTER TABLE public.ads ADD COLUMN IF NOT EXISTS priority_score INTEGER DEFAULT 1;

-- إنشاء فهرس للبحث السريع
CREATE INDEX IF NOT EXISTS idx_ads_priority_score ON public.ads(priority_score DESC, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ad_boost_logs_status ON public.ad_boost_logs(status, end_time);

-- تمكين Row Level Security للجداول الجديدة
ALTER TABLE public.boost_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_boost_logs ENABLE ROW LEVEL SECURITY;

-- سياسات الأمان لجدول أنواع التعزيز (قراءة للجميع)
CREATE POLICY "الجميع يمكنهم عرض أنواع التعزيز" ON public.boost_types
  FOR SELECT USING (true);

-- سياسات الأمان لجدول سجل التعزيزات
CREATE POLICY "المستخدمون يمكنهم عرض تعزيزاتهم" ON public.ad_boost_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "المستخدمون يمكنهم إضافة تعزيزات" ON public.ad_boost_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- دالة لتنظيف التعزيزات المنتهية
CREATE OR REPLACE FUNCTION public.cleanup_expired_boosts()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  -- تحديث التعزيزات المنتهية
  UPDATE public.ad_boost_logs 
  SET status = 'expired'
  WHERE status = 'active' AND end_time <= now();
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  
  -- إعادة تعيين أولوية الإعلانات المنتهية التعزيز
  UPDATE public.ads 
  SET priority_score = 1
  WHERE id IN (
    SELECT ad_id FROM public.ad_boost_logs 
    WHERE status = 'expired' AND end_time <= now()
  );
  
  RETURN updated_count;
END;
$$;

-- دالة لتعزيز الإعلان
CREATE OR REPLACE FUNCTION public.boost_ad(
  ad_id_param UUID,
  user_id_param UUID,
  boost_type_id_param UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  boost_type RECORD;
  user_points INTEGER;
  ad_owner UUID;
  end_time TIMESTAMP WITH TIME ZONE;
  result JSONB := '{"success": false, "message": ""}'::jsonb;
BEGIN
  -- التحقق من ملكية الإعلان
  SELECT user_id INTO ad_owner 
  FROM public.ads 
  WHERE id = ad_id_param AND status = 'active';
  
  IF ad_owner IS NULL THEN
    result := jsonb_set(result, '{message}', '"الإعلان غير موجود أو غير نشط"');
    RETURN result;
  END IF;
  
  IF ad_owner != user_id_param THEN
    result := jsonb_set(result, '{message}', '"لا يمكنك تعزيز إعلان لا تملكه"');
    RETURN result;
  END IF;
  
  -- جلب نوع التعزيز
  SELECT * INTO boost_type
  FROM public.boost_types
  WHERE id = boost_type_id_param;
  
  IF NOT FOUND THEN
    result := jsonb_set(result, '{message}', '"نوع التعزيز غير موجود"');
    RETURN result;
  END IF;
  
  -- جلب نقاط المستخدم
  SELECT points INTO user_points
  FROM public.profiles
  WHERE user_id = user_id_param;
  
  IF user_points < boost_type.points_cost THEN
    result := jsonb_set(result, '{message}', '"لا توجد نقاط كافية للتعزيز"');
    RETURN result;
  END IF;
  
  -- التحقق من عدم وجود تعزيز نشط للإعلان
  IF EXISTS (
    SELECT 1 FROM public.ad_boost_logs 
    WHERE ad_id = ad_id_param AND status = 'active' AND end_time > now()
  ) THEN
    result := jsonb_set(result, '{message}', '"الإعلان معزز بالفعل"');
    RETURN result;
  END IF;
  
  -- حساب وقت الانتهاء
  end_time := now() + interval '1 hour' * boost_type.duration_hours;
  
  -- خصم النقاط
  UPDATE public.profiles 
  SET points = points - boost_type.points_cost
  WHERE user_id = user_id_param;
  
  -- تسجيل التعزيز
  INSERT INTO public.ad_boost_logs (
    ad_id, user_id, boost_type_id, end_time
  ) VALUES (
    ad_id_param, user_id_param, boost_type_id_param, end_time
  );
  
  -- تحديث أولوية الإعلان
  UPDATE public.ads 
  SET priority_score = (boost_type.features->>'priority')::INTEGER
  WHERE id = ad_id_param;
  
  result := jsonb_set(result, '{success}', 'true');
  result := jsonb_set(result, '{message}', '"تم تعزيز الإعلان بنجاح"');
  result := jsonb_set(result, '{end_time}', to_jsonb(end_time));
  result := jsonb_set(result, '{cost}', to_jsonb(boost_type.points_cost));
  
  RETURN result;
END;
$$;
