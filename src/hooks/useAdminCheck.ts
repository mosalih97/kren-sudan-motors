
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
      if (!user?.email) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase.rpc('is_admin', {
          user_email: user.email
        });

        if (error) {
          console.error('Admin check error:', error);
          throw error;
        }
        
        setIsAdmin(data || false);
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
