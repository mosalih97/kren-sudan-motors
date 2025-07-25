
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface AdminStats {
  total_users: number;
  premium_users: number;
  new_users_this_month: number;
  active_ads: number;
  deleted_ads: number;
  premium_ads: number;
  active_boosts: number;
  basic_boosts: number;
  premium_boosts: number;
  ultimate_boosts: number;
  total_points: number;
  total_credits: number;
}

interface UserData {
  user_id: string;
  display_name: string;
  phone: string;
  city: string;
  membership_type: string;
  is_premium: boolean;
  points: number;
  credits: number;
  created_at: string;
  upgraded_at: string;
  premium_expires_at: string;
  days_remaining: number;
  ads_count: number;
  user_id_display: string;
}

interface AdData {
  id: string;
  title: string;
  brand: string;
  model: string;
  price: number;
  status: string;
  is_premium: boolean;
  is_featured: boolean;
  top_spot: boolean;
  created_at: string;
  user_id: string;
  display_name: string;
}

interface DatabaseActionResponse {
  success: boolean;
  message?: string;
}

export const useAdminData = () => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<UserData[]>([]);
  const [ads, setAds] = useState<AdData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_dashboard_stats')
        .select('*')
        .single();

      if (error) throw error;
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
      toast({
        title: "خطأ في تحميل الإحصائيات",
        description: "حدث خطأ أثناء تحميل الإحصائيات",
        variant: "destructive"
      });
    }
  };

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase.rpc('get_admin_users_list');
      
      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "خطأ في تحميل المستخدمين",
        description: "حدث خطأ أثناء تحميل بيانات المستخدمين",
        variant: "destructive"
      });
    }
  };

  const fetchAds = async () => {
    try {
      const { data, error } = await supabase
        .from('ads')
        .select(`
          *,
          profiles!ads_user_id_fkey (
            display_name
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const formattedAds = data.map(ad => ({
        ...ad,
        display_name: ad.profiles?.display_name || 'غير معروف'
      }));
      
      setAds(formattedAds);
    } catch (error) {
      console.error('Error fetching ads:', error);
      toast({
        title: "خطأ في تحميل الإعلانات",
        description: "حدث خطأ أثناء تحميل الإعلانات",
        variant: "destructive"
      });
    }
  };

  const upgradeUser = async (userId: string, adminId: string) => {
    try {
      const { data, error } = await supabase.rpc('upgrade_user_to_premium', {
        target_user_id: userId,
        admin_user_id: adminId
      });

      if (error) throw error;

      const response = data as DatabaseActionResponse;

      if (response.success) {
        toast({
          title: "تم ترقية المستخدم",
          description: response.message || "تم ترقية المستخدم بنجاح"
        });
        await fetchUsers();
        await fetchStats();
        return true;
      } else {
        toast({
          title: "خطأ في الترقية",
          description: response.message || "حدث خطأ غير متوقع",
          variant: "destructive"
        });
        return false;
      }
    } catch (error) {
      console.error('Error upgrading user:', error);
      toast({
        title: "خطأ في الترقية",
        description: "حدث خطأ أثناء ترقية المستخدم",
        variant: "destructive"
      });
      return false;
    }
  };

  const downgradeUser = async (userId: string, adminId: string) => {
    try {
      const { data, error } = await supabase.rpc('downgrade_user_to_free', {
        target_user_id: userId,
        admin_user_id: adminId
      });

      if (error) throw error;

      const response = data as DatabaseActionResponse;

      if (response.success) {
        toast({
          title: "تم إرجاع المستخدم",
          description: response.message || "تم إرجاع المستخدم بنجاح"
        });
        await fetchUsers();
        await fetchStats();
        return true;
      } else {
        toast({
          title: "خطأ في الإرجاع",
          description: response.message || "حدث خطأ غير متوقع",
          variant: "destructive"
        });
        return false;
      }
    } catch (error) {
      console.error('Error downgrading user:', error);
      toast({
        title: "خطأ في الإرجاع",
        description: "حدث خطأ أثناء إرجاع المستخدم",
        variant: "destructive"
      });
      return false;
    }
  };

  const deleteAd = async (adId: string, adminId: string) => {
    try {
      const { data, error } = await supabase.rpc('delete_ad_permanently', {
        ad_id_param: adId,
        admin_user_id: adminId
      });

      if (error) throw error;

      const response = data as DatabaseActionResponse;

      if (response.success) {
        toast({
          title: "تم حذف الإعلان",
          description: response.message || "تم حذف الإعلان بنجاح"
        });
        await fetchAds();
        await fetchStats();
        return true;
      } else {
        toast({
          title: "خطأ في الحذف",
          description: response.message || "حدث خطأ غير متوقع",
          variant: "destructive"
        });
        return false;
      }
    } catch (error) {
      console.error('Error deleting ad:', error);
      toast({
        title: "خطأ في الحذف",
        description: "حدث خطأ أثناء حذف الإعلان",
        variant: "destructive"
      });
      return false;
    }
  };

  const updateAdminCredentials = async (username: string, password: string, adminId: string) => {
    try {
      const { data, error } = await supabase.rpc('update_admin_credentials', {
        admin_user_id: adminId,
        new_username: username,
        new_password_hash: password // This will be hashed in the function
      });

      if (error) throw error;

      const response = data as DatabaseActionResponse;

      if (response.success) {
        toast({
          title: "تم تحديث البيانات",
          description: response.message || "تم تحديث البيانات بنجاح"
        });
        return true;
      } else {
        toast({
          title: "خطأ في التحديث",
          description: response.message || "حدث خطأ غير متوقع",
          variant: "destructive"
        });
        return false;
      }
    } catch (error) {
      console.error('Error updating credentials:', error);
      toast({
        title: "خطأ في التحديث",
        description: "حدث خطأ أثناء تحديث البيانات",
        variant: "destructive"
      });
      return false;
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        fetchStats(),
        fetchUsers(),
        fetchAds()
      ]);
      setLoading(false);
    };

    loadData();
  }, []);

  return {
    stats,
    users,
    ads,
    loading,
    fetchStats,
    fetchUsers,
    fetchAds,
    upgradeUser,
    downgradeUser,
    deleteAd,
    updateAdminCredentials
  };
};
