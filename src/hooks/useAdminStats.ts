
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface AdminStats {
  total_users: number;
  total_ads: number;
  active_ads: number;
  premium_users: number;
  total_boosts: number;
  new_users_today: number;
  revenue_today: number;
}

export const useAdminStats = () => {
  return useQuery({
    queryKey: ['admin-stats'],
    queryFn: async (): Promise<AdminStats> => {
      const { data, error } = await supabase.rpc('get_dashboard_stats');

      if (error) {
        console.error('Stats fetch error:', error);
        throw error;
      }

      return data as AdminStats;
    },
    refetchInterval: 30000, // تحديث كل 30 ثانية
  });
};
