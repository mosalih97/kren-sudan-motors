
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

      const { data, error } = await supabase.rpc('is_admin_user', {
        user_email: user.email
      });

      if (error) {
        console.error('Admin check error:', error);
        return { isAdmin: false };
      }

      return { isAdmin: data };
    },
    enabled: !!user?.email,
  });
};
