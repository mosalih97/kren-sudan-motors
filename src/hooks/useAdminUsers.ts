
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AdminUser {
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
}

interface RpcResponse {
  success: boolean;
  message: string;
}

export const useAdminUsers = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  const loadUsers = async () => {
    try {
      setLoading(true);
      console.log('Loading users from profiles table...');
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading users:', error);
        toast({
          variant: "destructive",
          title: "خطأ",
          description: "حدث خطأ أثناء تحميل المستخدمين",
        });
        return;
      }

      console.log('Raw profiles data:', data);

      if (!data || data.length === 0) {
        console.log('No users found in profiles table');
        setUsers([]);
        setFilteredUsers([]);
        toast({
          title: "لا توجد بيانات",
          description: "لا يوجد مستخدمون مسجلون بعد",
        });
        return;
      }

      const processedUsers = data.map(profile => ({
        user_id: profile.user_id || '',
        display_name: profile.display_name || 'غير محدد',
        phone: profile.phone || 'غير محدد',
        city: profile.city || 'غير محدد',
        membership_type: profile.membership_type || 'free',
        is_premium: profile.is_premium || false,
        points: profile.points || 0,
        credits: profile.credits || 0,
        created_at: profile.created_at || '',
        upgraded_at: profile.upgraded_at || '',
        premium_expires_at: profile.premium_expires_at || '',
        days_remaining: profile.premium_expires_at 
          ? Math.max(0, Math.ceil((new Date(profile.premium_expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
          : 0,
        ads_count: 0
      }));

      console.log('Processed users:', processedUsers);
      setUsers(processedUsers as AdminUser[]);
      setFilteredUsers(processedUsers as AdminUser[]);
      
      toast({
        title: "تم التحميل",
        description: `تم تحميل ${processedUsers.length} مستخدم بنجاح`,
      });

    } catch (error) {
      console.error('Unexpected error loading users:', error);
      toast({
        variant: "destructive",
        title: "خطأ",
        description: "حدث خطأ غير متوقع أثناء تحميل المستخدمين",
      });
    } finally {
      setLoading(false);
    }
  };

  const searchUsers = (term: string) => {
    setSearchTerm(term);
    if (!term.trim()) {
      setFilteredUsers(users);
      return;
    }

    const filtered = users.filter(user => 
      user.display_name?.toLowerCase().includes(term.toLowerCase()) ||
      user.phone?.includes(term) ||
      user.city?.toLowerCase().includes(term.toLowerCase()) ||
      user.user_id?.includes(term)
    );
    setFilteredUsers(filtered);
  };

  const upgradeUserToPremium = async (userId: string, adminUserId: string) => {
    try {
      console.log('Upgrading user to premium:', userId);
      const { data, error } = await supabase.rpc('upgrade_user_to_premium', {
        target_user_id: userId,
        admin_user_id: adminUserId
      });

      if (error) {
        console.error('RPC error:', error);
        toast({
          variant: "destructive",
          title: "خطأ",
          description: "فشل في ترقية المستخدم",
        });
        return false;
      }

      const response = data as unknown as RpcResponse;
      if (!response?.success) {
        toast({
          variant: "destructive",
          title: "خطأ",
          description: response?.message || "فشل في ترقية المستخدم",
        });
        return false;
      }

      toast({
        title: "نجح",
        description: "تم ترقية المستخدم إلى العضوية المميزة",
      });

      await loadUsers();
      return true;
    } catch (error) {
      console.error('Error upgrading user:', error);
      toast({
        variant: "destructive",
        title: "خطأ",
        description: "حدث خطأ أثناء ترقية المستخدم",
      });
      return false;
    }
  };

  const downgradeUserToFree = async (userId: string, adminUserId: string) => {
    try {
      console.log('Downgrading user to free:', userId);
      const { data, error } = await supabase.rpc('downgrade_user_to_free', {
        target_user_id: userId,
        admin_user_id: adminUserId
      });

      if (error) {
        console.error('RPC error:', error);
        toast({
          variant: "destructive",
          title: "خطأ",
          description: "فشل في إرجاع المستخدم للعضوية العادية",
        });
        return false;
      }

      const response = data as unknown as RpcResponse;
      if (!response?.success) {
        toast({
          variant: "destructive",
          title: "خطأ",
          description: response?.message || "فشل في إرجاع المستخدم للعضوية العادية",
        });
        return false;
      }

      toast({
        title: "نجح",
        description: "تم إرجاع المستخدم للعضوية العادية",
      });

      await loadUsers();
      return true;
    } catch (error) {
      console.error('Error downgrading user:', error);
      toast({
        variant: "destructive",
        title: "خطأ",
        description: "حدث خطأ أثناء إرجاع المستخدم",
      });
      return false;
    }
  };

  useEffect(() => {
    console.log('useAdminUsers: Component mounted, loading users...');
    loadUsers();
  }, []);

  return {
    users: filteredUsers,
    loading,
    searchTerm,
    searchUsers,
    upgradeUserToPremium,
    downgradeUserToFree,
    refetch: loadUsers
  };
};
