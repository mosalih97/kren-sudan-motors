
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
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  const loadUsers = async () => {
    setLoading(true);
    try {
      console.log('Loading users from get_admin_users_list...');
      
      // Try the RPC function first
      const { data: rpcData, error: rpcError } = await supabase.rpc('get_admin_users_list');
      
      if (rpcError) {
        console.log('RPC function failed, trying direct query:', rpcError);
        
        // Fallback to direct query if RPC fails
        const { data: directData, error: directError } = await supabase
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
            upgraded_at,
            premium_expires_at
          `)
          .order('created_at', { ascending: false });

        if (directError) {
          console.error('Direct query also failed:', directError);
          toast({
            variant: "destructive",
            title: "خطأ",
            description: "فشل في تحميل قائمة المستخدمين",
          });
          return;
        }

        if (directData && Array.isArray(directData)) {
          // Transform data to match expected format
          const transformedData = directData.map(user => ({
            ...user,
            days_remaining: user.premium_expires_at 
              ? Math.max(0, Math.ceil((new Date(user.premium_expires_at).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))
              : 0,
            ads_count: 0 // Will be updated if we can fetch ads data
          }));

          console.log('Direct query successful:', transformedData.length, 'users');
          setUsers(transformedData);
          setFilteredUsers(transformedData);
        }
      } else {
        // RPC function succeeded
        if (rpcData && Array.isArray(rpcData)) {
          console.log('RPC function successful:', rpcData.length, 'users');
          setUsers(rpcData as AdminUser[]);
          setFilteredUsers(rpcData as AdminUser[]);
        } else {
          console.log('No data received from RPC function');
          setUsers([]);
          setFilteredUsers([]);
        }
      }

      // Set up real-time subscription for profile changes
      const profilesChannel = supabase
        .channel('admin-profiles-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'profiles'
          },
          (payload) => {
            console.log('Real-time profile change:', payload);
            // Reload data when changes occur
            loadUsers();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(profilesChannel);
      };

    } catch (error) {
      console.error('Error loading users:', error);
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
      console.log('Upgrading user to premium:', userId);
      const { data, error } = await supabase.rpc('upgrade_user_to_premium', {
        target_user_id: userId,
        admin_user_id: adminUserId
      });

      console.log('Upgrade response:', data, error);

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
      console.log('Downgrading user to free:', userId);
      const { data, error } = await supabase.rpc('downgrade_user_to_free', {
        target_user_id: userId,
        admin_user_id: adminUserId
      });

      console.log('Downgrade response:', data, error);

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
    console.log('useAdminUsers: Starting to load users...');
    const cleanup = loadUsers();
    
    return () => {
      if (cleanup && typeof cleanup === 'function') {
        cleanup();
      }
    };
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
