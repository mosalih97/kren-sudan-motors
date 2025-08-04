
-- حذف الدوال المتعلقة بلوحة التحكم الإدارية
DROP FUNCTION IF EXISTS public.get_users_statistics();
DROP FUNCTION IF EXISTS public.get_admin_dashboard_stats();
DROP FUNCTION IF EXISTS public.search_users(text);
DROP FUNCTION IF EXISTS public.get_dashboard_stats();
DROP FUNCTION IF EXISTS public.get_admin_stats();
DROP FUNCTION IF EXISTS public.get_admin_users_list();
DROP FUNCTION IF EXISTS public.upgrade_user_to_premium(uuid, uuid);
DROP FUNCTION IF EXISTS public.downgrade_user_to_free(uuid, uuid);
DROP FUNCTION IF EXISTS public.update_admin_credentials(uuid, text, text);
DROP FUNCTION IF EXISTS public.create_admin_session(text, text, text, text);
DROP FUNCTION IF EXISTS public.verify_admin_session(text);
DROP FUNCTION IF EXISTS public.logout_all_admin_sessions(uuid);
DROP FUNCTION IF EXISTS public.delete_ad_permanently(uuid, uuid);
DROP FUNCTION IF EXISTS public.is_admin(text);
DROP FUNCTION IF EXISTS public.check_admin_access(text);
DROP FUNCTION IF EXISTS public.is_admin_user(text);

-- حذف الجداول المتعلقة بلوحة التحكم الإدارية
DROP TABLE IF EXISTS public.admin_dashboard_stats CASCADE;
DROP TABLE IF EXISTS public.admin_sessions CASCADE;
DROP TABLE IF EXISTS public.admin_credentials CASCADE;
DROP TABLE IF EXISTS public.admin_users CASCADE;
DROP TABLE IF EXISTS public.upgrade_logs CASCADE;
DROP TABLE IF EXISTS public.security_logs CASCADE;

-- حذف أي سياسات RLS متبقية متعلقة بالجداول المحذوفة
-- (هذه الأوامر ستفشل إذا كانت الجداول محذوفة بالفعل، لكن هذا طبيعي)
