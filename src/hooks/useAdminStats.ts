
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AdminStats {
  total_users: number;
  total_ads: number;
  active_ads: number;
  premium_users: number;
  total_boosts: number;
  new_users_this_month: number;
}

export const useAdminStats = (isAdmin: boolean | null) => {
  const { toast } = useToast();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(false);

  const loadStats = async () => {
    if (!isAdmin) return;
    
    setLoading(true);
    try {
      console.log('تحميل إحصائيات المدير...');
      
      const { data, error } = await supabase.rpc('get_admin_stats');
      
      if (error) {
        console.error('خطأ في تحميل الإحصائيات:', error);
        throw error;
      }
      
      console.log('تم تحميل الإحصائيات:', data);
      
      // التأكد من أن البيانات من النوع الصحيح
      if (data && typeof data === 'object') {
        setStats({
          total_users: data.total_users || 0,
          total_ads: data.total_ads || 0,
          active_ads: data.active_ads || 0,
          premium_users: data.premium_users || 0,
          total_boosts: data.total_boosts || 0,
          new_users_this_month: data.new_users_this_month || 0
        });
      } else {
        throw new Error('صيغة البيانات غير صحيحة');
      }
    } catch (error) {
      console.error('خطأ في تحميل الإحصائيات:', error);
      toast({
        title: "خطأ في الإحصائيات",
        description: "فشل في تحميل إحصائيات لوحة التحكم",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin === true) {
      loadStats();
    }
  }, [isAdmin]);

  return { stats, loading, refetch: loadStats };
};
