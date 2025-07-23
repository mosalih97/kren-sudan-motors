
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useUserPoints() {
  return useQuery({
    queryKey: ['user-points'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase.rpc('get_user_total_points', {
        user_id_param: user.id
      });

      if (error) {
        console.error('Error fetching user points:', error);
        throw error;
      }

      return data;
    },
    enabled: true,
    refetchInterval: 30000, // تحديث كل 30 ثانية
  });
}
