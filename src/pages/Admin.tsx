
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Users, Car, FileText, Settings, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import AdminUsersTab from '@/components/admin/AdminUsersTab';
import AdminAdsTab from '@/components/admin/AdminAdsTab';
import AdminLogsTab from '@/components/admin/AdminLogsTab';
import AdminSettingsTab from '@/components/admin/AdminSettingsTab';

const Admin = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [stats, setStats] = useState({
    totalUsers: 0,
    premiumUsers: 0,
    totalAds: 0,
    activeAds: 0
  });

  useEffect(() => {
    checkAdminAccess();
    fetchStats();
  }, [user]);

  const checkAdminAccess = async () => {
    if (!user) {
      navigate('/');
      return;
    }

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      if (profile?.role !== 'admin') {
        toast({
          title: "غير مصرح",
          description: "ليس لديك صلاحيات للوصول إلى لوحة التحكم",
          variant: "destructive"
        });
        navigate('/');
        return;
      }

      setIsAdmin(true);
    } catch (error) {
      console.error('Error checking admin access:', error);
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      // إحصائيات المستخدمين
      const { data: users } = await supabase
        .from('profiles')
        .select('membership_type');

      const totalUsers = users?.length || 0;
      const premiumUsers = users?.filter(u => u.membership_type === 'premium').length || 0;

      // إحصائيات الإعلانات
      const { data: ads } = await supabase
        .from('ads')
        .select('status');

      const totalAds = ads?.length || 0;
      const activeAds = ads?.filter(a => a.status === 'active').length || 0;

      setStats({
        totalUsers,
        premiumUsers,
        totalAds,
        activeAds
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
          <p className="mt-4 text-lg">جاري التحقق من الصلاحيات...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Shield className="h-8 w-8 text-primary ml-3" />
              <h1 className="text-xl font-bold text-gray-900">لوحة التحكم الإدارية</h1>
            </div>
            <Button onClick={handleLogout} variant="outline" className="flex items-center gap-2">
              <LogOut className="h-4 w-4" />
              تسجيل الخروج
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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
              <Users className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.premiumUsers}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">إجمالي الإعلانات</CardTitle>
              <Car className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalAds}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">الإعلانات النشطة</CardTitle>
              <Car className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.activeAds}</div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="users" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              المستخدمون
            </TabsTrigger>
            <TabsTrigger value="ads" className="flex items-center gap-2">
              <Car className="h-4 w-4" />
              الإعلانات
            </TabsTrigger>
            <TabsTrigger value="logs" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              سجلات الترقية
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              الإعدادات
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <AdminUsersTab onStatsUpdate={fetchStats} />
          </TabsContent>

          <TabsContent value="ads">
            <AdminAdsTab onStatsUpdate={fetchStats} />
          </TabsContent>

          <TabsContent value="logs">
            <AdminLogsTab />
          </TabsContent>

          <TabsContent value="settings">
            <AdminSettingsTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;
