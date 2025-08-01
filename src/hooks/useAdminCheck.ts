
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
          console.error('Admin RPC error:', error);
          // إذا فشل RPC، نحاول التحقق مباشرة من الجدول
          console.log('RPC failed, checking admin_users table directly...');
          
          const { data: adminData, error: adminError } = await supabase
            .from('admin_users')
            .select('email')
            .eq('email', user.email);
            
          console.log('Direct admin_users check:', { adminData, adminError });
          
          if (adminError) {
            console.error('Direct admin check error:', adminError);
            setIsAdmin(false);
          } else {
            const isAdminUser = adminData && adminData.length > 0;
            console.log('Admin status from direct check:', isAdminUser);
            setIsAdmin(isAdminUser);
          }
        } else {
          const adminResult = Boolean(data);
          console.log('Admin check result from RPC:', adminResult);
          setIsAdmin(adminResult);
        }
        
      } catch (error) {
        console.error('خطأ في التحقق من صلاحية المدير:', error);
        
        // محاولة أخيرة للتحقق مباشرة من الجدول
        try {
          console.log('Final attempt: checking admin_users table directly...');
          const { data: adminData, error: adminError } = await supabase
            .from('admin_users')
            .select('email')
            .eq('email', user.email);
            
          if (!adminError && adminData && adminData.length > 0) {
            console.log('Admin found in direct table check');
            setIsAdmin(true);
          } else {
            console.log('Admin not found in direct table check');
            setIsAdmin(false);
          }
        } catch (finalError) {
          console.error('Final admin check failed:', finalError);
          setIsAdmin(false);
          toast({
            title: "خطأ في التحقق",
            description: "فشل في التحقق من صلاحيات الإدارة. يرجى المحاولة مرة أخرى.",
            variant: "destructive"
          });
        }
      } finally {
        setLoading(false);
      }
    };

    checkAdminAccess();
  }, [user?.email, toast]);

  return { isAdmin, loading };
};
