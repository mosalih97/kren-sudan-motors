
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface UserPointsData {
  total_points: number;
  base_points: number;
  premium_credits: number;
  membership_type: string;
  monthly_ads_count: number;
  monthly_ads_limit: number;
}

export function useUserPoints() {
  return useQuery({
    queryKey: ['user-points'],
    queryFn: async (): Promise<UserPointsData | null> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase.rpc('get_user_total_points', {
        user_id_param: user.id
      });

      if (error) {
        console.error('Error fetching user points:', error);
        throw error;
      }

      return data as UserPointsData;
    },
    enabled: true,
    refetchInterval: 30000,
  });
}
