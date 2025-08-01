
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Navigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { Users, Car, Star, TrendingUp } from 'lucide-react';

const Admin = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAdminAccess();
    loadDashboardStats();
  }, [user]);

  const checkAdminAccess = async () => {
    if (!user?.email) {
      setIsAdmin(false);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.rpc('is_admin', {
        user_email: user.email
      });

      if (error) throw error;
      setIsAdmin(data);
    } catch (error) {
      console.error('خطأ في التحقق من صلاحية المدير:', error);
      setIsAdmin(false);
    } finally {
      setLoading(false);
    }
  };

  const loadDashboardStats = async () => {
    try {
      const { data, error } = await supabase.rpc('get_admin_dashboard_stats');
      if (error) throw error;
      setStats(data);
    } catch (error) {
      console.error('خطأ في تحميل الإحصائيات:', error);
      toast({
        title: "خطأ",
        description: "فشل في تحميل إحصائيات لوحة التحكم",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg">جاري التحميل...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (isAdmin === false) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">غير مصرح</h1>
          <p className="text-gray-600">لا تملك صلاحيات للوصول لهذه الصفحة</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">لوحة التحكم</h1>
          <p className="text-gray-600 mt-2">مرحباً {user.email}</p>
        </div>

        {/* الإحصائيات */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">إجمالي المستخدمين</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.total_users || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">إجمالي الإعلانات</CardTitle>
              <Car className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.total_ads || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">الإعلانات النشطة</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.active_ads || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">المستخدمون المميزون</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.premium_users || 0}</div>
            </CardContent>
          </Card>
        </div>

        {/* أزرار الإجراءات */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>إدارة المستخدمين</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">عرض وإدارة المستخدمين المسجلين</p>
              <Button 
                onClick={() => window.location.href = '/admin/users'}
                className="w-full"
              >
                عرض المستخدمين
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>إدارة الإعلانات</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">مراجعة وإدارة الإعلانات المنشورة</p>
              <Button 
                onClick={() => window.location.href = '/admin/ads'}
                className="w-full"
              >
                عرض الإعلانات
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>الإحصائيات المتقدمة</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">تقارير مفصلة عن النشاطات</p>
              <Button 
                onClick={loadDashboardStats}
                variant="outline"
                className="w-full"
              >
                تحديث الإحصائيات
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Admin;
