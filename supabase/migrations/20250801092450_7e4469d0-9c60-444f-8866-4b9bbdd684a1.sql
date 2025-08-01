
-- إنشاء بيانات دخول المدير الأولية
INSERT INTO public.admin_credentials (username, password_hash)
VALUES ('admin', crypt('admin123', gen_salt('bf')))
ON CONFLICT DO NOTHING;

-- تحديث المستخدم الحالي ليصبح مدير (إذا كان هناك مستخدم مسجل دخول)
-- يمكنك تغيير البريد الإلكتروني أدناه إلى بريدك الإلكتروني الفعلي
DO $$
DECLARE
    target_user_id uuid;
BEGIN
    -- البحث عن أول مستخدم مسجل في النظام وجعله مدير
    SELECT id INTO target_user_id 
    FROM auth.users 
    ORDER BY created_at 
    LIMIT 1;
    
    IF target_user_id IS NOT NULL THEN
        -- تحديث الملف الشخصي ليصبح مدير
        INSERT INTO public.profiles (
            user_id, 
            display_name, 
            membership_type,
            points,
            credits,
            user_id_display
        ) VALUES (
            target_user_id,
            'المدير العام',
            'admin',
            1000,
            1000,
            '00000001'
        )
        ON CONFLICT (user_id) DO UPDATE SET
            membership_type = 'admin',
            display_name = 'المدير العام',
            points = 1000,
            credits = 1000;
    END IF;
END $$;
