
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

export const useAdminUsers = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  const loadUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_admin_users_list');
      
      if (error) {
        console.error('Error loading users:', error);
        toast({
          variant: "destructive",
          title: "خطأ",
          description: "فشل في تحميل قائمة المستخدمين",
        });
        return;
      }

      setUsers((data as AdminUser[]) || []);
      setFilteredUsers((data as AdminUser[]) || []);
    } catch (error) {
      console.error('Error:', error);
      toast({
        variant: "destructive",
        title: "خطأ",
        description: "حدث خطأ أثناء تحميل المستخدمين",
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
      const { data, error } = await supabase.rpc('upgrade_user_to_premium', {
        target_user_id: userId,
        admin_user_id: adminUserId
      });

      if (error || !data || typeof data !== 'object' || !('success' in data) || !data.success) {
        toast({
          variant: "destructive",
          title: "خطأ",
          description: (data && typeof data === 'object' && 'message' in data) 
            ? String(data.message) 
            : "فشل في ترقية المستخدم",
        });
        return false;
      }

      toast({
        title: "نجح",
        description: "تم ترقية المستخدم إلى العضوية المميزة لمدة 30 يوم",
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
      const { data, error } = await supabase.rpc('downgrade_user_to_free', {
        target_user_id: userId,
        admin_user_id: adminUserId
      });

      if (error || !data || typeof data !== 'object' || !('success' in data) || !data.success) {
        toast({
          variant: "destructive",
          title: "خطأ",
          description: (data && typeof data === 'object' && 'message' in data) 
            ? String(data.message) 
            : "فشل في إرجاع المستخدم للعضوية العادية",
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
