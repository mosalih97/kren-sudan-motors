
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
  return useQuery<UserPointsData | null>({
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

      // تحويل البيانات من Json إلى النوع المطلوب مع type assertion آمن
      const result = data as any;
      return {
        total_points: result?.total_points || 0,
        base_points: result?.base_points || 0,
        premium_credits: result?.premium_credits || 0,
        membership_type: result?.membership_type || 'free',
        monthly_ads_count: result?.monthly_ads_count || 0,
        monthly_ads_limit: result?.monthly_ads_limit || 5
      } as UserPointsData;
    },
    enabled: true,
    refetchInterval: 30000,
  });
}
