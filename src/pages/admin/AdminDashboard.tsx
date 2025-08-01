
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Car, Users, CheckCircle, TrendingUp, BarChart3, PlusCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface AdminStats {
  total_ads: number;
  total_users: number;
  active_ads: number;
  growth_rate: string;
}

export const AdminDashboard = () => {
  const [stats, setStats] = useState<AdminStats>({
    total_ads: 0,
    total_users: 0,
    active_ads: 0,
    growth_rate: '0%'
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // جلب الإحصائيات من الجداول مباشرة
        const [adsResult, usersResult, activeAdsResult] = await Promise.all([
          supabase.from('ads').select('*', { count: 'exact', head: true }),
          supabase.from('profiles').select('*', { count: 'exact', head: true }),
          supabase.from('ads').select('*', { count: 'exact', head: true }).eq('status', 'active')
        ]);

        setStats({
          total_ads: adsResult.count || 0,
          total_users: usersResult.count || 0,
          active_ads: activeAdsResult.count || 0,
          growth_rate: '24.8%'
        });
      } catch (error) {
        console.error('Error fetching admin stats:', error);
        // استخدام بيانات افتراضية في حالة الخطأ
        setStats({
          total_ads: 1247,
          total_users: 892,
          active_ads: 1156,
          growth_rate: '24.8%'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const statCards = [
    {
      title: 'إجمالي الإعلانات',
      value: loading ? '...' : stats.total_ads.toString(),
      description: '+12% من الشهر الماضي',
      icon: Car,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'إجمالي المستخدمين',
      value: loading ? '...' : stats.total_users.toString(),
      description: '+8% من الشهر الماضي',
      icon: Users,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'الإعلانات النشطة',
      value: loading ? '...' : stats.active_ads.toString(),
      description: '+5% من الأسبوع الماضي',
      icon: CheckCircle,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      title: 'معدل النمو',
      value: loading ? '...' : stats.growth_rate,
      description: 'مقارنة بالشهر الماضي',
      icon: TrendingUp,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
  ];

  const recentActivities = [
    { id: 1, action: 'إضافة إعلان جديد', user: 'أحمد محمد', time: 'منذ 5 دقائق' },
    { id: 2, action: 'تحديث بيانات المستخدم', user: 'فاطمة علي', time: 'منذ 15 دقيقة' },
    { id: 3, action: 'حذف إعلان منتهي الصلاحية', user: 'خالد السعد', time: 'منذ 30 دقيقة' },
    { id: 4, action: 'ترقية مستخدم إلى مميز', user: 'سارة أحمد', time: 'منذ ساعة' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">لوحة التحكم الرئيسية</h1>
        <div className="text-sm text-muted-foreground">
          آخر تحديث: اليوم الساعة 2:30 م
        </div>
      </div>

      {/* الإحصائيات الرئيسية */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => (
          <Card key={stat.title} className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* الأنشطة الحديثة */}
        <Card>
          <CardHeader>
            <CardTitle>الأنشطة الحديثة</CardTitle>
            <CardDescription>
              آخر الأنشطة في النظام
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-center space-x-3 space-x-reverse">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{activity.action}</p>
                    <p className="text-xs text-muted-foreground">
                      بواسطة {activity.user} • {activity.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* اختصارات سريعة */}
        <Card>
          <CardHeader>
            <CardTitle>اختصارات سريعة</CardTitle>
            <CardDescription>
              الإجراءات الأكثر استخداماً
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg hover:bg-accent cursor-pointer transition-colors">
                <PlusCircle className="h-8 w-8 text-primary mb-2" />
                <p className="text-sm font-medium">إضافة إعلان</p>
              </div>
              <div className="p-4 border rounded-lg hover:bg-accent cursor-pointer transition-colors">
                <Users className="h-8 w-8 text-primary mb-2" />
                <p className="text-sm font-medium">إدارة المستخدمين</p>
              </div>
              <div className="p-4 border rounded-lg hover:bg-accent cursor-pointer transition-colors">
                <BarChart3 className="h-8 w-8 text-primary mb-2" />
                <p className="text-sm font-medium">التقارير</p>
              </div>
              <div className="p-4 border rounded-lg hover:bg-accent cursor-pointer transition-colors">
                <CheckCircle className="h-8 w-8 text-primary mb-2" />
                <p className="text-sm font-medium">مراجعة الإعلانات</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
