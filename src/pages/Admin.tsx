
import React from 'react';
import { Navigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Car, Star, TrendingUp } from 'lucide-react';
import { useAdminCheck } from '@/hooks/useAdminCheck';
import { useAdminStats } from '@/hooks/useAdminStats';
import AdminLoadingScreen from '@/components/admin/AdminLoadingScreen';
import AccessDeniedScreen from '@/components/admin/AccessDeniedScreen';
import { useAuth } from '@/contexts/AuthContext';

const Admin = () => {
  const { user } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdminCheck();
  const { stats, loading: statsLoading, refetch } = useAdminStats(isAdmin);

  // إذا كان التطبيق يحمل بيانات المصادقة
  if (adminLoading) {
    return <AdminLoadingScreen />;
  }

  // إذا لم يكن المستخدم مسجل دخول
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // إذا لم يكن المستخدم مديراً
  if (isAdmin === false) {
    return <AccessDeniedScreen userEmail={user.email} />;
  }

  // إذا لم يتم التحقق بعد من الصلاحيات
  if (isAdmin === null) {
    return <AdminLoadingScreen />;
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
              <div className="text-2xl font-bold">
                {statsLoading ? '...' : (stats?.total_users || 0)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">إجمالي الإعلانات</CardTitle>
              <Car className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statsLoading ? '...' : (stats?.total_ads || 0)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">الإعلانات النشطة</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statsLoading ? '...' : (stats?.active_ads || 0)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">المستخدمون المميزون</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statsLoading ? '...' : (stats?.premium_users || 0)}
              </div>
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
                onClick={refetch}
                variant="outline"
                className="w-full"
                disabled={statsLoading}
              >
                {statsLoading ? 'جاري التحديث...' : 'تحديث الإحصائيات'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Admin;
