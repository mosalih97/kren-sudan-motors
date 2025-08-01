
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const useAdminAuth = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['admin-auth', user?.email],
    queryFn: async () => {
      if (!user?.email) {
        return { isAdmin: false };
      }

      console.log('Checking admin status for:', user.email);

      const { data, error } = await supabase.rpc('is_admin_user', {
        user_email: user.email
      });

      if (error) {
        console.error('Admin check error:', error);
        throw error;
      }

      console.log('Admin check result:', data);
      return { isAdmin: Boolean(data) };
    },
    enabled: !!user?.email,
    staleTime: 5 * 60 * 1000, // البيانات صالحة لمدة 5 دقائق
    retry: 2,
  });
};
