
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AdminStats {
  total_users: number;
  total_ads: number;
  active_ads: number;
  premium_users: number;
  total_boosts: number;
}

export const useAdminStats = (isAdmin: boolean | null) => {
  const { toast } = useToast();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(false);

  const loadStats = async () => {
    if (!isAdmin) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_admin_dashboard_stats');
      
      if (error) {
        console.error('Stats loading error:', error);
        throw error;
      }
      
      setStats(data);
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
