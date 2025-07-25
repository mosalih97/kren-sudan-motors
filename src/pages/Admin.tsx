
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AdminUsersTab } from '@/components/admin/AdminUsersTab';
import { AdminAdsTab } from '@/components/admin/AdminAdsTab';
import { AdminLogsTab } from '@/components/admin/AdminLogsTab';
import { Header } from '@/components/Header';
import { Shield, Users, FileText, Activity } from 'lucide-react';

const Admin = () => {
  const { user } = useAuth();
  const [currentTab, setCurrentTab] = useState('users');

  // التحقق من صلاحية المدير
  const { data: adminProfile, isLoading: isLoadingAdmin } = useQuery({
    queryKey: ['admin-profile', user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('membership_type')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // إحصائيات سريعة
  const { data: stats } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const [usersResult, adsResult, upgradesResult] = await Promise.all([
        supabase.from('profiles').select('membership_type', { count: 'exact' }),
        supabase.from('ads').select('status', { count: 'exact' }).eq('status', 'active'),
        supabase.from('upgrade_logs').select('action', { count: 'exact' }).eq('action', 'upgrade')
      ]);

      return {
        totalUsers: usersResult.count || 0,
        totalAds: adsResult.count || 0,
        totalUpgrades: upgradesResult.count || 0
      };
    },
    enabled: adminProfile?.membership_type === 'admin',
  });

  if (isLoadingAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-lg text-muted-foreground">جاري التحقق من الصلاحيات...</p>
        </div>
      </div>
    );
  }

  if (!user || adminProfile?.membership_type !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              لوحة التحكم الإدارية
            </h1>
          </div>
          <p className="text-muted-foreground">
            إدارة المستخدمين والإعلانات ومراقبة النشاط في تطبيق الكرين
          </p>
        </div>

        {/* الإحصائيات السريعة */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-600">إجمالي المستخدمين</p>
                    <p className="text-2xl font-bold text-blue-900">{stats.totalUsers}</p>
                  </div>
                  <Users className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-600">الإعلانات النشطة</p>
                    <p className="text-2xl font-bold text-green-900">{stats.totalAds}</p>
                  </div>
                  <FileText className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-purple-600">إجمالي الترقيات</p>
                    <p className="text-2xl font-bold text-purple-900">{stats.totalUpgrades}</p>
                  </div>
                  <Activity className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* الأقسام الرئيسية */}
        <Card className="bg-background/80 backdrop-blur-sm shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              أقسام الإدارة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="users" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  المستخدمون
                </TabsTrigger>
                <TabsTrigger value="ads" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  الإعلانات
                </TabsTrigger>
                <TabsTrigger value="logs" className="flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  السجلات
                </TabsTrigger>
              </TabsList>

              <TabsContent value="users" className="mt-6">
                <AdminUsersTab />
              </TabsContent>

              <TabsContent value="ads" className="mt-6">
                <AdminAdsTab />
              </TabsContent>

              <TabsContent value="logs" className="mt-6">
                <AdminLogsTab />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Admin;
