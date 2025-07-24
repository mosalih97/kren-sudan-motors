
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface UserPointsData {
  totalPoints: number;
  basePoints: number;
  premiumCredits: number;
  membershipType: string;
  monthlyAdsCount: number;
  monthlyAdsLimit: number;
}

export const useUserPoints = () => {
  const [pointsData, setPointsData] = useState<UserPointsData | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchUserPointsData = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('points, credits, membership_type, monthly_ads_count')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;

      const basePoints = data.points || 0;
      const premiumCredits = data.credits || 0;
      const membershipType = data.membership_type || 'free';
      const monthlyAdsCount = data.monthly_ads_count || 0;
      
      // Calculate total points - premium users get both base points and premium credits
      const totalPoints = membershipType === 'premium' 
        ? basePoints + premiumCredits 
        : basePoints;

      // Premium users get 40 ads per month, free users get 5
      const monthlyAdsLimit = membershipType === 'premium' ? 40 : 5;

      setPointsData({
        totalPoints,
        basePoints,
        premiumCredits,
        membershipType,
        monthlyAdsCount,
        monthlyAdsLimit
      });
    } catch (error) {
      console.error('Error fetching user points:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserPointsData();
  }, [user]);

  const deductPoints = async (amount: number) => {
    if (!user || !pointsData) return false;

    try {
      // Premium users: deduct from premium credits first, then from base points
      if (pointsData.membershipType === 'premium') {
        if (pointsData.premiumCredits >= amount) {
          // Deduct from premium credits only
          const { error } = await supabase
            .from('profiles')
            .update({ credits: pointsData.premiumCredits - amount })
            .eq('user_id', user.id);
          
          if (error) throw error;
        } else {
          // Deduct partial from premium credits and remaining from base points
          const remainingAmount = amount - pointsData.premiumCredits;
          const { error } = await supabase
            .from('profiles')
            .update({ 
              credits: 0,
              points: pointsData.basePoints - remainingAmount
            })
            .eq('user_id', user.id);
          
          if (error) throw error;
        }
      } else {
        // Free users: deduct from base points only
        const { error } = await supabase
          .from('profiles')
          .update({ points: pointsData.basePoints - amount })
          .eq('user_id', user.id);
        
        if (error) throw error;
      }

      // Refresh points data
      await fetchUserPointsData();
      return true;
    } catch (error) {
      console.error('Error deducting points:', error);
      return false;
    }
  };

  return {
    pointsData,
    loading,
    deductPoints,
    refetch: fetchUserPointsData
  };
};
