
import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Car, TrendingUp, CreditCard, Star, Trash2 } from 'lucide-react';

interface DashboardStats {
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

const DashboardStats: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // Since the view might not be available in types, use raw SQL approach
      const { data, error } = await supabase.rpc('get_admin_dashboard_stats');

      if (error) {
        console.error('Stats error:', error);
        // Fallback: manually calculate stats
        const [
          { count: totalUsers },
          { count: premiumUsers },
          { count: activeAds },
          { count: deletedAds }
        ] = await Promise.all([
          supabase.from('profiles').select('*', { count: 'exact', head: true }),
          supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('membership_type', 'premium'),
          supabase.from('ads').select('*', { count: 'exact', head: true }).eq('status', 'active'),
          supabase.from('ads').select('*', { count: 'exact', head: true }).eq('status', 'deleted')
        ]);

        setStats({
          total_users: totalUsers || 0,
          premium_users: premiumUsers || 0,
          new_users_this_month: 0,
          active_ads: activeAds || 0,
          deleted_ads: deletedAds || 0,
          premium_ads: 0,
          active_boosts: 0,
          basic_boosts: 0,
          premium_boosts: 0,
          ultimate_boosts: 0,
          total_points: 0,
          total_credits: 0
        });
      } else {
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
      // Set default empty stats
      setStats({
        total_users: 0,
        premium_users: 0,
        new_users_this_month: 0,
        active_ads: 0,
        deleted_ads: 0,
        premium_ads: 0,
        active_boosts: 0,
        basic_boosts: 0,
        premium_boosts: 0,
        ultimate_boosts: 0,
        total_points: 0,
        total_credits: 0
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">إحصائيات التطبيق</h2>
        <div className="text-center py-8">جاري تحميل الإحصائيات...</div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">إحصائيات التطبيق</h2>
        <div className="text-center py-8">خطأ في تحميل الإحصائيات</div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'إجمالي المستخدمين',
      value: stats.total_users,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      title: 'المستخدمون المميزون',
      value: stats.premium_users,
      icon: Star,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100'
    },
    {
      title: 'مستخدمون جدد هذا الشهر',
      value: stats.new_users_this_month,
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      title: 'الإعلانات النشطة',
      value: stats.active_ads,
      icon: Car,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100'
    },
    {
      title: 'الإعلانات المحذوفة',
      value: stats.deleted_ads,
      icon: Trash2,
      color: 'text-red-600',
      bgColor: 'bg-red-100'
    },
    {
      title: 'الإعلانات المميزة',
      value: stats.premium_ads,
      icon: Star,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">إحصائيات التطبيق</h2>
        <p className="text-gray-600 mt-1">نظرة عامة على أداء التطبيق</p>
      </div>

      {/* الإحصائيات العامة */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value?.toLocaleString() || 0}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* إحصائيات التعزيز */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>إحصائيات التعزيز</CardTitle>
            <CardDescription>أنواع التعزيز المستخدمة</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span>التعزيزات النشطة:</span>
              <span className="font-semibold">{stats.active_boosts}</span>
            </div>
            <div className="flex justify-between">
              <span>تعزيز أساسي:</span>
              <span className="font-semibold">{stats.basic_boosts}</span>
            </div>
            <div className="flex justify-between">
              <span>تعزيز مميز:</span>
              <span className="font-semibold">{stats.premium_boosts}</span>
            </div>
            <div className="flex justify-between">
              <span>تعزيز نهائي:</span>
              <span className="font-semibold">{stats.ultimate_boosts}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>النقاط والرصيد</CardTitle>
            <CardDescription>إجمالي النقاط في النظام</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span>إجمالي النقاط:</span>
              <span className="font-semibold">{stats.total_points?.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>إجمالي الرصيد:</span>
              <span className="font-semibold">{stats.total_credits?.toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardStats;
