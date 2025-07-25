
-- التحقق من وجود البيانات وإصلاحها
DO $$
DECLARE
    admin_profile_exists BOOLEAN;
    admin_creds_exists BOOLEAN;
BEGIN
    -- التحقق من وجود ملف تعريف المدير
    SELECT EXISTS(
        SELECT 1 FROM public.profiles 
        WHERE user_id = '00000000-0000-0000-0000-000000000001'::uuid
        AND membership_type = 'admin'
    ) INTO admin_profile_exists;
    
    -- التحقق من وجود بيانات اعتماد المدير
    SELECT EXISTS(
        SELECT 1 FROM public.admin_credentials 
        WHERE username = 'admin'
    ) INTO admin_creds_exists;
    
    -- إذا لم يكن ملف التعريف موجود، قم بإنشاءه
    IF NOT admin_profile_exists THEN
        INSERT INTO public.profiles (
            user_id,
            display_name,
            phone,
            city,
            membership_type,
            is_premium,
            points,
            credits,
            user_id_display
        )
        VALUES (
            '00000000-0000-0000-0000-000000000001'::uuid,
            'مدير النظام',
            '+966500000000',
            'الرياض',
            'admin',
            true,
            1000,
            1000,
            '00000001'
        );
    END IF;
    
    -- إذا لم تكن بيانات الاعتماد موجودة، قم بإنشائها
    IF NOT admin_creds_exists THEN
        INSERT INTO public.admin_credentials (
            username, 
            password_hash,
            admin_user_id
        )
        VALUES (
            'admin', 
            crypt('admin123', gen_salt('bf')),
            '00000000-0000-0000-0000-000000000001'::uuid
        );
    END IF;
END $$;

-- إعادة إنشاء دالة create_admin_session مع إصلاح الخطأ
CREATE OR REPLACE FUNCTION public.create_admin_session(
    username_input text, 
    password_input text, 
    ip_addr text DEFAULT NULL::text, 
    user_agent_input text DEFAULT NULL::text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    admin_creds RECORD;
    admin_profile RECORD;
    session_token text;
    result jsonb;
BEGIN
    -- Get admin credentials
    SELECT * INTO admin_creds FROM public.admin_credentials WHERE username = username_input LIMIT 1;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'message', 'بيانات المدير غير موجودة');
    END IF;
    
    -- Verify credentials using crypt function
    IF admin_creds.password_hash != crypt(password_input, admin_creds.password_hash) THEN
        RETURN jsonb_build_object('success', false, 'message', 'اسم المستخدم أو كلمة المرور خاطئة');
    END IF;
    
    -- Get admin profile using admin_user_id from credentials
    SELECT * INTO admin_profile FROM public.profiles WHERE user_id = admin_creds.admin_user_id AND membership_type = 'admin';
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'message', 'لا يوجد مدير مسجل');
    END IF;
    
    -- Generate session token
    session_token := encode(gen_random_bytes(32), 'hex');
    
    -- Create session
    INSERT INTO public.admin_sessions (admin_user_id, session_token, ip_address, user_agent)
    VALUES (admin_profile.user_id, session_token, ip_addr, user_agent_input);
    
    RETURN jsonb_build_object(
        'success', true,
        'session_token', session_token,
        'admin_id', admin_profile.user_id,
        'expires_at', (now() + interval '24 hours')
    );
END;
$function$;
