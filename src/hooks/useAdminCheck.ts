
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useAdminCheck = () => {
  const { user } = useAuth();
  const { toast } = useToast();
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

      // فحص سريع مباشر بدون تعقيدات
      try {
        console.log('فحص مباشر وسريع من جدول admin_users...');
        
        const { data, error } = await supabase
          .from('admin_users')
          .select('email')
          .eq('email', user.email)
          .limit(1);
          
        console.log('نتيجة الفحص:', { data, error });
        
        if (error) {
          console.error('خطأ في الفحص:', error);
          setIsAdmin(false);
        } else {
          // إذا وُجدت نتائج، المستخدم مدير
          const adminFound = data && data.length > 0;
          console.log('هل المستخدم مدير؟', adminFound);
          setIsAdmin(adminFound);
        }
        
      } catch (error) {
        console.error('خطأ عام:', error);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      checkAdminAccess();
    } else {
      setLoading(false);
      setIsAdmin(false);
    }
  }, [user?.email, toast]);

  return { isAdmin, loading };
};
