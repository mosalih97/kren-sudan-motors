
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface UserPointsData {
  total_points: number;
  base_points: number;
  premium_credits: number;
  membership_type: string;
  monthly_ads_count: number;
  monthly_ads_limit: number;
}

export const useUserPoints = () => {
  const [pointsData, setPointsData] = useState<UserPointsData | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchUserPoints = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase.rpc('get_user_total_points', {
        user_id_param: user.id
      });

      if (error) throw error;
      setPointsData(data);
    } catch (error) {
      console.error('Error fetching user points:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserPoints();
  }, [user]);

  return {
    pointsData,
    loading,
    refreshPoints: fetchUserPoints
  };
};
