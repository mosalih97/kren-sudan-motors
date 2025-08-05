
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UserProfile {
  user_id: string;
  display_name: string;
  phone: string;
  city: string;
  membership_type: string;
  is_premium: boolean;
  points: number;
  credits: number;
  created_at: string;
  premium_expires_at: string;
  days_remaining: number;
  ads_count: number;
  user_id_display: string;
}

interface DashboardStats {
  total_users: number;
  premium_users: number;
  active_ads: number;
  total_points: number;
  total_credits: number;
}

export const useAdminDashboard = () => {
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const { toast } = useToast();

  const searchUsers = async (searchTerm: string, membershipFilter: string, limit: number = 50): Promise<UserProfile[]> => {
    try {
      const { data, error } = await supabase.rpc('admin_search_users', {
        search_term: searchTerm,
        membership_filter: membershipFilter,
        limit_count: limit
      });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error searching users:', error);
      toast({
        title: "خطأ في البحث",
        description: "حدث خطأ أثناء البحث عن المستخدمين",
        variant: "destructive"
      });
      return [];
    }
  };

  const upgradeUser = async (
    userId: string, 
    targetMembership: string, 
    currentMembership: string,
    notes?: string
  ): Promise<boolean> => {
    setLoading(true);
    try {
      // Calculate expiration date (30 days from now)
      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + 30);

      // Get current user data
      const { data: currentUser, error: fetchError } = await supabase
        .from('profiles')
        .select('credits')
        .eq('user_id', userId)
        .single();

      if (fetchError) throw fetchError;

      // Update user profile
      const updateData: any = {
        membership_type: targetMembership,
        is_premium: targetMembership === 'premium',
        premium_expires_at: targetMembership === 'premium' ? expirationDate.toISOString() : null,
        upgraded_at: new Date().toISOString(),
      };

      // Add premium credits if upgrading to premium
      if (targetMembership === 'premium') {
        updateData.credits = (currentUser.credits || 0) + 100;
      }

      const { error: profileError } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('user_id', userId);

      if (profileError) throw profileError;

      // Log the upgrade
      const { error: logError } = await supabase
        .from('upgrade_logs')
        .insert({
          user_id: userId,
          admin_id: 'admin', // Replace with actual admin ID when available
          action: 'upgrade',
          from_membership: currentMembership,
          to_membership: targetMembership,
          expires_at: targetMembership === 'premium' ? expirationDate.toISOString() : null,
          notes: notes || ''
        });

      if (logError) throw logError;

      toast({
        title: "تم الترقية بنجاح",
        description: `تم ${targetMembership === 'premium' ? 'ترقية المستخدم إلى مميز' : 'تحويل المستخدم إلى مجاني'} لمدة 30 يوم`,
      });

      return true;
    } catch (error) {
      console.error('Error upgrading user:', error);
      toast({
        title: "خطأ في الترقية",
        description: "حدث خطأ أثناء ترقية المستخدم",
        variant: "destructive"
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const getDashboardStats = async (): Promise<void> => {
    try {
      // Get user stats
      const { data: userStats, error: userError } = await supabase
        .from('profiles')
        .select('membership_type, points, credits');

      if (userError) throw userError;

      // Get ads stats
      const { data: adsStats, error: adsError } = await supabase
        .from('ads')
        .select('id')
        .eq('status', 'active');

      if (adsError) throw adsError;

      const totalUsers = userStats.length;
      const premiumUsers = userStats.filter(u => u.membership_type === 'premium').length;
      const totalPoints = userStats.reduce((sum, u) => sum + (u.points || 0), 0);
      const totalCredits = userStats.reduce((sum, u) => sum + (u.credits || 0), 0);

      setStats({
        total_users: totalUsers,
        premium_users: premiumUsers,
        active_ads: adsStats.length,
        total_points: totalPoints,
        total_credits: totalCredits
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    }
  };

  const getUpgradeLogs = async (userId?: string) => {
    try {
      let query = supabase
        .from('upgrade_logs')
        .select('*')
        .order('created_at', { ascending: false });

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query.limit(100);
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching upgrade logs:', error);
      return [];
    }
  };

  return {
    loading,
    stats,
    searchUsers,
    upgradeUser,
    getDashboardStats,
    getUpgradeLogs
  };
};
