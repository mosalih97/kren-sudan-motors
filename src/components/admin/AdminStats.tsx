
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Car, Star, TrendingUp, UserCheck, DollarSign } from 'lucide-react';
import { useAdminStats } from '@/hooks/useAdminStats';

export const AdminStats = () => {
  const { data: stats, isLoading } = useAdminStats();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const statCards = [
    {
      title: 'إجمالي المستخدمين',
      value: stats?.total_users || 0,
      icon: Users,
      color: 'text-blue-600',
    },
    {
      title: 'إجمالي الإعلانات',
      value: stats?.total_ads || 0,
      icon: Car,
      color: 'text-green-600',
    },
    {
      title: 'الإعلانات النشطة',
      value: stats?.active_ads || 0,
      icon: TrendingUp,
      color: 'text-orange-600',
    },
    {
      title: 'المستخدمون المميزون',
      value: stats?.premium_users || 0,
      icon: Star,
      color: 'text-purple-600',
    },
    {
      title: 'مستخدمون جدد اليوم',
      value: stats?.new_users_today || 0,
      icon: UserCheck,
      color: 'text-teal-600',
    },
    {
      title: 'إيرادات اليوم',
      value: `${stats?.revenue_today || 0} نقطة`,
      icon: DollarSign,
      color: 'text-emerald-600',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {statCards.map((stat, index) => (
        <Card key={index} className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              {stat.title}
            </CardTitle>
            <stat.icon className={`h-5 w-5 ${stat.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
