
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
      console.log('بدء فحص صلاحية المدير للبريد:', user?.email);
      
      if (!user?.email) {
        console.log('لا يوجد بريد إلكتروني للمستخدم');
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      try {
        // فحص مباشر من جدول admin_users بدلاً من RPC
        console.log('فحص مباشر من جدول admin_users...');
        
        const { data: adminData, error: adminError } = await supabase
          .from('admin_users')
          .select('email')
          .eq('email', user.email)
          .single();
          
        console.log('نتيجة فحص admin_users:', { adminData, adminError });
        
        if (adminError) {
          if (adminError.code === 'PGRST116') {
            // لا يوجد سجل - المستخدم ليس مديراً
            console.log('المستخدم ليس مديراً');
            setIsAdmin(false);
          } else {
            console.error('خطأ في فحص admin_users:', adminError);
            setIsAdmin(false);
            toast({
              title: "خطأ في التحقق",
              description: "فشل في التحقق من صلاحيات الإدارة",
              variant: "destructive"
            });
          }
        } else if (adminData?.email === user.email) {
          console.log('تم العثور على المدير في الجدول');
          setIsAdmin(true);
        } else {
          console.log('المستخدم ليس مديراً');
          setIsAdmin(false);
        }
        
      } catch (error) {
        console.error('خطأ عام في التحقق من صلاحية المدير:', error);
        setIsAdmin(false);
        toast({
          title: "خطأ في التحقق",
          description: "فشل في التحقق من صلاحيات الإدارة. يرجى المحاولة مرة أخرى.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    if (user?.email) {
      checkAdminAccess();
    } else {
      setLoading(false);
      setIsAdmin(false);
    }
  }, [user?.email, toast]);

  return { isAdmin, loading };
};
