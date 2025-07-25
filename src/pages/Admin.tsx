
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Users, FileText, Activity, Settings } from 'lucide-react';
import { AdminUsersTab } from '@/components/admin/AdminUsersTab';
import { AdminAdsTab } from '@/components/admin/AdminAdsTab';
import { AdminLogsTab } from '@/components/admin/AdminLogsTab';
import { AdminSettingsTab } from '@/components/admin/AdminSettingsTab';
import { useToast } from '@/hooks/use-toast';

const Admin = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isAdmin, setIsAdmin] = useState(false);
  const [stats, setStats] = useState({
    totalUsers: 0,
    premiumUsers: 0,
    totalAds: 0,
    activeAds: 0
  });

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
      return;
    }

    if (user) {
      checkAdminAccess();
      fetchStats();
    }
  }, [user, loading, navigate]);

  const checkAdminAccess = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('membership_type')
        .eq('user_id', user?.id)
        .single();

      if (error) throw error;

      if (data?.membership_type === 'admin') {
        setIsAdmin(true);
      } else {
        toast({
          title: "غير مسموح",
          description: "ليس لديك صلاحيات للوصول إلى لوحة التحكم",
          variant: "destructive"
        });
        navigate('/');
      }
    } catch (error) {
      console.error('Error checking admin access:', error);
      navigate('/');
    }
  };

  const fetchStats = async () => {
    try {
      // إحصائيات المستخدمين
      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select('membership_type');

      if (usersError) throw usersError;

      // إحصائيات الإعلانات
      const { data: adsData, error: adsError } = await supabase
        .from('ads')
        .select('status');

      if (adsError) throw adsError;

      setStats({
        totalUsers: usersData?.length || 0,
        premiumUsers: usersData?.filter(u => u.membership_type === 'premium').length || 0,
        totalAds: adsData?.length || 0,
        activeAds: adsData?.filter(a => a.status === 'active').length || 0
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="container mx-auto p-6 space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">لوحة التحكم الإدارية</h1>
        <Badge variant="secondary">مدير النظام</Badge>
      </div>

      {/* إحصائيات سريعة */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي المستخدمين</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">المستخدمين المميزين</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.premiumUsers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الإعلانات</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalAds}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">الإعلانات النشطة</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeAds}</div>
          </CardContent>
        </Card>
      </div>

      {/* التبويبات الرئيسية */}
      <Tabs defaultValue="users" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            إدارة المستخدمين
          </TabsTrigger>
          <TabsTrigger value="ads" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            إدارة الإعلانات
          </TabsTrigger>
          <TabsTrigger value="logs" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            سجل العمليات
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            إعدادات النظام
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <AdminUsersTab onStatsUpdate={fetchStats} />
        </TabsContent>

        <TabsContent value="ads" className="space-y-4">
          <AdminAdsTab onStatsUpdate={fetchStats} />
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <AdminLogsTab />
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <AdminSettingsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Admin;
