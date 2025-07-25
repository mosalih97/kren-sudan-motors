
import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { LogOut, BarChart3, Users, FileText, Settings, Shield } from 'lucide-react';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { useAdminData } from '@/hooks/useAdminData';
import AdminStats from '@/components/admin/AdminStats';
import UsersManagement from '@/components/admin/UsersManagement';
import AdsManagement from '@/components/admin/AdsManagement';
import AdminSettings from '@/components/admin/AdminSettings';

const AdminDashboard = () => {
  const { isAuthenticated, loading: authLoading, adminId, logout, logoutAll } = useAdminAuth();
  const { 
    stats, 
    users, 
    ads, 
    loading: dataLoading,
    upgradeUser,
    downgradeUser,
    deleteAd,
    updateAdminCredentials
  } = useAdminData();

  const [activeTab, setActiveTab] = useState('stats');

  // Redirect if not authenticated
  if (!authLoading && !isAuthenticated) {
    return <Navigate to="/admin-login" replace />;
  }

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  const handleUpgradeUser = async (userId: string) => {
    if (!adminId) return false;
    return await upgradeUser(userId, adminId);
  };

  const handleDowngradeUser = async (userId: string) => {
    if (!adminId) return false;
    return await downgradeUser(userId, adminId);
  };

  const handleDeleteAd = async (adId: string) => {
    if (!adminId) return false;
    return await deleteAd(adId, adminId);
  };

  const handleUpdateCredentials = async (username: string, password: string) => {
    if (!adminId) return false;
    return await updateAdminCredentials(username, password, adminId);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Shield className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">لوحة التحكم الإدارية</h1>
                <p className="text-sm text-gray-500">إدارة منصة الكرين</p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={logout}
              className="flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              تسجيل الخروج
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="stats" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              الإحصائيات
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              المستخدمون
            </TabsTrigger>
            <TabsTrigger value="ads" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              الإعلانات
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              الإعدادات
            </TabsTrigger>
          </TabsList>

          <div className="mt-6">
            <TabsContent value="stats">
              {dataLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : stats ? (
                <AdminStats stats={stats} />
              ) : (
                <div className="text-center py-12 text-gray-500">
                  لا توجد إحصائيات متاحة
                </div>
              )}
            </TabsContent>

            <TabsContent value="users">
              <UsersManagement
                users={users}
                onUpgradeUser={handleUpgradeUser}
                onDowngradeUser={handleDowngradeUser}
              />
            </TabsContent>

            <TabsContent value="ads">
              <AdsManagement
                ads={ads}
                onDeleteAd={handleDeleteAd}
              />
            </TabsContent>

            <TabsContent value="settings">
              <AdminSettings
                onUpdateCredentials={handleUpdateCredentials}
                onLogout={logout}
                onLogoutAll={logoutAll}
              />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;
