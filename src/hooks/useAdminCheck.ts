
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export const useAdminCheck = () => {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAdminAccess = async () => {
      console.log('فحص صلاحية المدير للبريد:', user?.email);
      
      if (!user?.email) {
        console.log('لا يوجد مستخدم مسجل دخول');
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      try {
        console.log('استخدام دالة check_admin_access...');
        
        const { data, error } = await supabase.rpc('check_admin_access', {
          user_email: user.email
        });
        
        console.log('نتيجة الفحص:', { data, error });
        
        if (error) {
          console.error('خطأ في الفحص:', error);
          setIsAdmin(false);
        } else {
          console.log('هل المستخدم مدير؟', data);
          setIsAdmin(data === true);
        }
        
      } catch (error) {
        console.error('خطأ عام:', error);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    checkAdminAccess();
  }, [user?.email]);

  return { isAdmin, loading };
};
