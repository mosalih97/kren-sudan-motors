
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
      console.log('Admin check started for user:', user?.email);
      
      if (!user?.email) {
        console.log('No user email found');
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      try {
        console.log('Calling is_admin RPC with email:', user.email);
        
        const { data, error } = await supabase.rpc('is_admin', {
          user_email: user.email
        });

        console.log('Admin check response:', { data, error });

        if (error) {
          console.error('Admin check error:', error);
          throw error;
        }
        
        const adminResult = data || false;
        console.log('Admin check result:', adminResult);
        setIsAdmin(adminResult);
        
        if (!adminResult) {
          console.log('User is not admin, checking admin_users table directly...');
          
          // التحقق المباشر من جدول admin_users للتشخيص
          const { data: adminData, error: adminError } = await supabase
            .from('admin_users')
            .select('email')
            .eq('email', user.email);
            
          console.log('Direct admin_users check:', { adminData, adminError });
        }
        
      } catch (error) {
        console.error('خطأ في التحقق من صلاحية المدير:', error);
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

    checkAdminAccess();
  }, [user?.email, toast]);

  return { isAdmin, loading };
};
