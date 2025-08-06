
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
      // استخدام استعلام مباشر بدلاً من دالة RPC
      let query = supabase
        .from('profiles')
        .select(`
          user_id,
          display_name,
          phone,
          city,
          membership_type,
          is_premium,
          points,
          credits,
          created_at,
          premium_expires_at,
          user_id_display
        `)
        .limit(limit)
        .order('created_at', { ascending: false });

      // إضافة فلترة العضوية
      if (membershipFilter !== 'all') {
        query = query.eq('membership_type', membershipFilter);
      }

      // إضافة فلترة البحث
      if (searchTerm.trim()) {
        query = query.or(`
          display_name.ilike.%${searchTerm}%,
          phone.ilike.%${searchTerm}%,
          city.ilike.%${searchTerm}%,
          user_id_display.ilike.%${searchTerm}%
        `);
      }

      const { data: users, error } = await query;

      if (error) throw error;

      // جلب عدد الإعلانات لكل مستخدم
      const usersWithAds = await Promise.all((users || []).map(async (user) => {
        const { data: ads, error: adsError } = await supabase
          .from('ads')
          .select('id')
          .eq('user_id', user.user_id)
          .eq('status', 'active');

        if (adsError) console.error('Error fetching ads count:', adsError);

        const adsCount = ads?.length || 0;
        
        // حساب الأيام المتبقية
        let daysRemaining = 0;
        if (user.premium_expires_at) {
          const expiryDate = new Date(user.premium_expires_at);
          const today = new Date();
          const diffTime = expiryDate.getTime() - today.getTime();
          daysRemaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
        }

        return {
          ...user,
          ads_count: adsCount,
          days_remaining: daysRemaining,
          points: user.points || 0,
          credits: user.credits || 0
        };
      }));

      return usersWithAds;
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
    notes?: string
  ): Promise<boolean> => {
    setLoading(true);
    try {
      console.log('Starting upgrade process:', { userId, targetMembership, notes });

      // Get current user data first
      const { data: currentUser, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (fetchError) {
        console.error('Error fetching current user:', fetchError);
        throw fetchError;
      }

      console.log('Current user data:', currentUser);

      // تحضير البيانات للتحديث
      const updateData: any = {
        membership_type: targetMembership,
        is_premium: targetMembership === 'premium',
        upgraded_at: new Date().toISOString()
      };

      // إضافة تاريخ انتهاء الصلاحية إذا كانت ترقية إلى مميز
      if (targetMembership === 'premium') {
        const expirationDate = new Date();
        expirationDate.setDate(expirationDate.getDate() + 30);
        updateData.premium_expires_at = expirationDate.toISOString();
        // إضافة 100 رصيد إضافي للعضوية المميزة
        updateData.credits = (currentUser.credits || 0) + 100;
      } else {
        // إذا كان تحويل إلى مجاني، إزالة تاريخ انتهاء الصلاحية
        updateData.premium_expires_at = null;
        updateData.credits = 5; // رصيد أساسي للمستخدمين العاديين
      }

      console.log('Update data:', updateData);

      // تحديث بيانات المستخدم
      const { error: profileError } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('user_id', userId);

      if (profileError) {
        console.error('Error updating profile:', profileError);
        throw profileError;
      }

      console.log('Profile updated successfully');

      // تسجيل العملية في upgrade_logs
      const { error: logError } = await supabase
        .from('upgrade_logs')
        .insert({
          user_id: userId,
          admin_id: userId, // استخدام نفس المستخدم كمدير مؤقتاً
          action: targetMembership === 'premium' ? 'upgrade' : 'downgrade',
          from_membership: currentUser.membership_type,
          to_membership: targetMembership,
          expires_at: targetMembership === 'premium' ? updateData.premium_expires_at : null,
          notes: notes || ''
        });

      if (logError) {
        console.error('Error logging upgrade:', logError);
        // لا نرفع خطأ هنا لأن الترقية تمت بنجاح
      }

      toast({
        title: "تم بنجاح",
        description: `تم ${targetMembership === 'premium' ? 'ترقية المستخدم إلى مميز' : 'تحويل المستخدم إلى مجاني'} بنجاح`,
      });

      return true;
    } catch (error) {
      console.error('Error upgrading user:', error);
      toast({
        title: "خطأ في العملية",
        description: "حدث خطأ أثناء تنفيذ العملية",
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
