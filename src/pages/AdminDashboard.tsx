
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  Users, 
  Car, 
  TrendingUp, 
  Shield, 
  LogOut, 
  Settings,
  UserCheck,
  AlertTriangle
} from 'lucide-react';

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

const AdminDashboard = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const { isAdminAuthenticated, adminLogout, loading: authLoading } = useAdminAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !isAdminAuthenticated) {
      navigate('/admin-login');
    } else if (isAdminAuthenticated) {
      loadDashboardStats();
    }
  }, [isAdminAuthenticated, authLoading]);

  const loadDashboardStats = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_dashboard_stats')
        .select('*')
        .single();

      if (error) {
        console.error('Error loading stats:', error);
        toast.error('خطأ في تحميل الإحصائيات');
      } else {
        setStats(data);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
      toast.error('خطأ في النظام');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await adminLogout();
    navigate('/admin-login');
    toast.success('تم تسجيل الخروج بنجاح');
  };

  if (authLoading || !isAdminAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4 space-x-reverse">
            <Shield className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold">لوحة تحكم المدير</h1>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="ml-2 h-4 w-4" />
            تسجيل الخروج
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
            <TabsTrigger value="users">المستخدمون</TabsTrigger>
            <TabsTrigger value="ads">الإعلانات</TabsTrigger>
            <TabsTrigger value="settings">الإعدادات</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">إجمالي المستخدمين</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.total_users || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats?.premium_users || 0} مستخدم مميز
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">الإعلانات النشطة</CardTitle>
                  <Car className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.active_ads || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats?.premium_ads || 0} إعلان مميز
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">التعزيزات النشطة</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.active_boosts || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    تعزيزات متنوعة
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">مستخدمون جدد</CardTitle>
                  <UserCheck className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.new_users_this_month || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    هذا الشهر
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>إحصائيات النقاط</CardTitle>
                  <CardDescription>إجمالي النقاط في النظام</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>النقاط الأساسية:</span>
                      <Badge variant="secondary">{stats?.total_points || 0}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>نقاط العضوية المميزة:</span>
                      <Badge variant="default">{stats?.total_credits || 0}</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>إحصائيات التعزيز</CardTitle>
                  <CardDescription>أنواع التعزيزات المختلفة</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>تعزيز أساسي:</span>
                      <Badge variant="outline">{stats?.basic_boosts || 0}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>تعزيز مميز:</span>
                      <Badge variant="secondary">{stats?.premium_boosts || 0}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>تعزيز فائق:</span>
                      <Badge variant="default">{stats?.ultimate_boosts || 0}</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>إدارة المستخدمين</CardTitle>
                <CardDescription>قائمة بجميع المستخدمين وصلاحياتهم</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-center text-muted-foreground py-8">
                  سيتم إضافة إدارة المستخدمين قريباً
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ads">
            <Card>
              <CardHeader>
                <CardTitle>إدارة الإعلانات</CardTitle>
                <CardDescription>مراجعة وإدارة جميع الإعلانات</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-center text-muted-foreground py-8">
                  سيتم إضافة إدارة الإعلانات قريباً
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>إعدادات النظام</CardTitle>
                <CardDescription>إدارة إعدادات التطبيق العامة</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-center text-muted-foreground py-8">
                  سيتم إضافة الإعدادات قريباً
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AdminDashboard;
