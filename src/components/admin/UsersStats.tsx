
import { Card, CardContent } from '@/components/ui/card';
import { Users, Crown, Calendar, CreditCard } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface StatsData {
  total_users: number;
  premium_users: number;
  free_users: number;
  total_ads: number;
  active_ads: number;
  total_boosts: number;
  new_users_this_month: number;
  premium_expiring_soon: number;
}

interface StatsProps {
  totalUsers?: number;
  premiumUsers?: number;
  totalAds?: number;
  activeAds?: number;
  totalBoosts?: number;
  newUsersThisMonth?: number;
}

export const UsersStats = ({ 
  totalUsers = 0, 
  premiumUsers = 0, 
  totalAds = 0, 
  activeAds = 0, 
  totalBoosts = 0, 
  newUsersThisMonth = 0 
}: StatsProps) => {
  const [stats, setStats] = useState<StatsData>({
    total_users: totalUsers,
    premium_users: premiumUsers,
    free_users: 0,
    total_ads: totalAds,
    active_ads: activeAds,
    total_boosts: totalBoosts,
    new_users_this_month: newUsersThisMonth,
    premium_expiring_soon: 0
  });

  const loadStats = async () => {
    try {
      const { data, error } = await supabase.rpc('get_users_statistics');
      
      if (error) {
        console.error('Error loading statistics:', error);
        return;
      }

      if (data && Array.isArray(data) && data.length > 0) {
        console.log('Statistics loaded:', data[0]);
        setStats(data[0] as StatsData);
      }
    } catch (error) {
      console.error('Error loading statistics:', error);
    }
  };

  useEffect(() => {
    loadStats();

    // Set up real-time updates for statistics
    const statsChannel = supabase
      .channel('admin-stats-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles'
        },
        () => {
          loadStats();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ads'
        },
        () => {
          loadStats();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ad_boosts'
        },
        () => {
          loadStats();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(statsChannel);
    };
  }, []);

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      <Card>
        <CardContent className="p-4 text-center">
          <Users className="h-8 w-8 mx-auto mb-2 text-blue-600" />
          <p className="text-2xl font-bold">{stats.total_users}</p>
          <p className="text-sm text-gray-600">إجمالي المستخدمين</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 text-center">
          <Crown className="h-8 w-8 mx-auto mb-2 text-yellow-600" />
          <p className="text-2xl font-bold">{stats.premium_users}</p>
          <p className="text-sm text-gray-600">مستخدمين مميزين</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 text-center">
          <Calendar className="h-8 w-8 mx-auto mb-2 text-green-600" />
          <p className="text-2xl font-bold">{stats.total_ads}</p>
          <p className="text-sm text-gray-600">إجمالي الإعلانات</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 text-center">
          <CreditCard className="h-8 w-8 mx-auto mb-2 text-purple-600" />
          <p className="text-2xl font-bold">{stats.active_ads}</p>
          <p className="text-sm text-gray-600">إعلانات نشطة</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 text-center">
          <div className="h-8 w-8 mx-auto mb-2 bg-orange-600 rounded-full flex items-center justify-center text-white font-bold">
            ↗️
          </div>
          <p className="text-2xl font-bold">{stats.total_boosts}</p>
          <p className="text-sm text-gray-600">تعزيزات نشطة</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 text-center">
          <div className="h-8 w-8 mx-auto mb-2 bg-red-600 rounded-full flex items-center justify-center text-white font-bold">
            📊
          </div>
          <p className="text-2xl font-bold">{stats.new_users_this_month}</p>
          <p className="text-sm text-gray-600">مستخدمين جدد هذا الشهر</p>
        </CardContent>
      </Card>
    </div>
  );
};
