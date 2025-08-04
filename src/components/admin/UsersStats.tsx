
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, UserCheck, Calendar, TrendingUp } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const UsersStats = () => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      console.log('Fetching admin stats...');
      
      // Get basic counts from profiles table
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, membership_type, is_premium, created_at, premium_expires_at');

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        return {
          total_users: 0,
          premium_users: 0,
          new_users_this_month: 0,
          total_ads: 0,
          active_ads: 0,
          total_boosts: 0
        };
      }

      console.log('Profiles data:', profiles);

      const total_users = profiles?.length || 0;
      const premium_users = profiles?.filter(p => p.membership_type === 'premium' || p.is_premium).length || 0;
      const new_users_this_month = profiles?.filter(p => {
        const createdDate = new Date(p.created_at);
        const now = new Date();
        return createdDate.getMonth() === now.getMonth() && createdDate.getFullYear() === now.getFullYear();
      }).length || 0;

      // Get ads count
      const { count: ads_count } = await supabase
        .from('ads')
        .select('*', { count: 'exact', head: true });

      const { count: active_ads_count } = await supabase
        .from('ads')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      const { count: boosts_count } = await supabase
        .from('ad_boosts')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      const stats = {
        total_users,
        premium_users,
        new_users_this_month,
        total_ads: ads_count || 0,
        active_ads: active_ads_count || 0,
        total_boosts: boosts_count || 0
      };

      console.log('Calculated stats:', stats);
      return stats;
    },
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  const statsCards = [
    {
      title: 'إجمالي المستخدمين',
      value: stats?.total_users || 0,
      icon: Users,
      color: 'text-blue-600'
    },
    {
      title: 'مستخدمين مميزين',
      value: stats?.premium_users || 0,
      icon: UserCheck,
      color: 'text-green-600'
    },
    {
      title: 'مستخدمين جدد هذا الشهر',
      value: stats?.new_users_this_month || 0,
      icon: Calendar,
      color: 'text-purple-600'
    },
    {
      title: 'إجمالي الإعلانات',
      value: stats?.total_ads || 0,
      icon: TrendingUp,
      color: 'text-orange-600'
    },
    {
      title: 'إعلانات نشطة',
      value: stats?.active_ads || 0,
      icon: TrendingUp,
      color: 'text-red-600'
    },
    {
      title: 'تعزيزات نشطة',
      value: stats?.total_boosts || 0,
      icon: TrendingUp,
      color: 'text-yellow-600'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {statsCards.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card key={index} className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {stat.title}
              </CardTitle>
              <Icon className={`h-5 w-5 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoading ? '...' : stat.value.toLocaleString()}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
