
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Navigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Car, 
  TrendingUp, 
  DollarSign, 
  Shield,
  Loader2,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface AdminStats {
  total_users: number;
  total_ads: number;
  active_ads: number;
  premium_users: number;
  total_boosts: number;
  new_users_this_month: number;
}

interface UserData {
  user_id: string;
  display_name: string;
  phone: string;
  city: string;
  membership_type: string;
  is_premium: boolean;
  points: number;
  credits: number;
  created_at: string;
  ads_count: number;
}

const AdminDashboard: React.FC = () => {
  const { user, loading } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [adminLoading, setAdminLoading] = useState(true);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<UserData[]>([]);
  const [statsLoading, setStatsLoading] = useState(false);
  const [usersLoading, setUsersLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // التحقق من صلاحيات المدير
  useEffect(() => {
    const checkAdminAccess = async () => {
      if (!user) {
        setAdminLoading(false);
        return;
      }

      try {
        // استخدام الفانكشن الجديد للتحقق من صلاحيات المدير
        const { data, error } = await supabase.rpc('is_admin_user_by_id', {
          user_id_param: user.id
        });

        if (error) {
          console.error('Admin check error:', error);
          setError('حدث خطأ في التحقق من الصلاحيات');
          setIsAdmin(false);
        } else {
          setIsAdmin(data || false);
        }
      } catch (err) {
        console.error('Admin access check failed:', err);
        setError('فشل في التحقق من صلاحيات المدير');
        setIsAdmin(false);
      } finally {
        setAdminLoading(false);
      }
    };

    checkAdminAccess();
  }, [user]);

  // جلب إحصائيات لوحة التحكم
  const fetchStats = async () => {
    setStatsLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_admin_stats');
      
      if (error) {
        console.error('Stats fetch error:', error);
        toast({
          variant: "destructive",
          title: "خطأ في جلب الإحصائيات",
          description: "حدث خطأ أثناء جلب إحصائيات لوحة التحكم",
        });
      } else {
        setStats(data);
      }
    } catch (err) {
      console.error('Stats fetch failed:', err);
      toast({
        variant: "destructive",
        title: "خطأ في الاتصال",
        description: "فشل في الاتصال بقاعدة البيانات",
      });
    } finally {
      setStatsLoading(false);
    }
  };

  // جلب قائمة المستخدمين
  const fetchUsers = async () => {
    setUsersLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_admin_users_list');
      
      if (error) {
        console.error('Users fetch error:', error);
        toast({
          variant: "destructive",
          title: "خطأ في جلب المستخدمين",
          description: "حدث خطأ أثناء جلب قائمة المستخدمين",
        });
      } else {
        setUsers(data || []);
      }
    } catch (err) {
      console.error('Users fetch failed:', err);
      toast({
        variant: "destructive",
        title: "خطأ في الاتصال",
        description: "فشل في جلب قائمة المستخدمين",
      });
    } finally {
      setUsersLoading(false);
    }
  };

  // جلب البيانات عند التأكد من صلاحيات المدير
  useEffect(() => {
    if (isAdmin && !adminLoading) {
      fetchStats();
      fetchUsers();
    }
  }, [isAdmin, adminLoading]);

  // عرض شاشة التحميل
  if (loading || adminLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">جاري التحقق من الصلاحيات...</p>
        </div>
      </div>
    );
  }

  // إعادة التوجيه إذا لم يكن المستخدم مديراً
  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  // عرض رسالة خطأ مع إمكانية إعادة المحاولة
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4">
              <AlertCircle className="h-12 w-12 text-destructive" />
              <div className="text-center">
                <h3 className="text-lg font-semibold">حدث خطأ</h3>
                <p className="text-sm text-muted-foreground mt-2">{error}</p>
              </div>
              <Button 
                onClick={() => window.location.reload()} 
                className="w-full"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                إعادة المحاولة
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* رأس الصفحة */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="h-8 w-8 text-primary" />
            لوحة التحكم الإدارية
          </h1>
          <p className="text-muted-foreground mt-2">
            مرحباً بك في لوحة التحكم الخاصة بإدارة المنصة
          </p>
        </div>
        <Button 
          onClick={() => {
            fetchStats();
            fetchUsers();
          }}
          variant="outline"
          disabled={statsLoading || usersLoading}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${(statsLoading || usersLoading) ? 'animate-spin' : ''}`} />
          تحديث البيانات
        </Button>
      </div>

      {/* بطاقات الإحصائيات */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي المستخدمين</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                stats?.total_users?.toLocaleString() || '0'
              )}
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
              {statsLoading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                stats?.total_ads?.toLocaleString() || '0'
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats?.active_ads?.toLocaleString() || '0'} إعلان نشط
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">المستخدمون المميزون</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                stats?.premium_users?.toLocaleString() || '0'
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">المستخدمون الجدد</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                stats?.new_users_this_month?.toLocaleString() || '0'
              )}
            </div>
            <p className="text-xs text-muted-foreground">هذا الشهر</p>
          </CardContent>
        </Card>
      </div>

      {/* قائمة المستخدمين */}
      <Card>
        <CardHeader>
          <CardTitle>قائمة المستخدمين</CardTitle>
          <CardDescription>
            إدارة حسابات المستخدمين والعضويات
          </CardDescription>
        </CardHeader>
        <CardContent>
          {usersLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : users.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">
              لا توجد بيانات مستخدمين متاحة
            </p>
          ) : (
            <div className="space-y-4">
              {users.slice(0, 10).map((userData) => (
                <div
                  key={userData.user_id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {userData.display_name || 'غير محدد'}
                      </span>
                      {userData.is_premium && (
                        <Badge variant="secondary">مميز</Badge>
                      )}
                      {userData.membership_type === 'admin' && (
                        <Badge variant="destructive">مدير</Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <span>{userData.phone || 'لا يوجد رقم'}</span>
                      {userData.city && <span> • {userData.city}</span>}
                      <span> • {userData.ads_count} إعلان</span>
                    </div>
                  </div>
                  <div className="text-left">
                    <div className="text-sm">
                      <span className="text-muted-foreground">النقاط: </span>
                      <span className="font-medium">{userData.points}</span>
                    </div>
                    <div className="text-sm">
                      <span className="text-muted-foreground">الرصيد: </span>
                      <span className="font-medium">{userData.credits}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;
