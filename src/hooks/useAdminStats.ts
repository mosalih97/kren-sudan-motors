
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

      // Type casting للتأكد من أن البيانات تتطابق مع AdminStats
      const stats = data as unknown as AdminStats;
      
      // التأكد من أن جميع القيم أرقام صحيحة
      return {
        total_users: Number(stats.total_users) || 0,
        total_ads: Number(stats.total_ads) || 0,
        active_ads: Number(stats.active_ads) || 0,
        premium_users: Number(stats.premium_users) || 0,
        total_boosts: Number(stats.total_boosts) || 0,
        new_users_today: Number(stats.new_users_today) || 0,
        revenue_today: Number(stats.revenue_today) || 0,
      };
    },
    refetchInterval: 30000, // تحديث كل 30 ثانية
  });
};
