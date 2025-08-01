
import React, { useState, useEffect } from 'react';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Car, TrendingUp, Award, Shield, LogOut } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AdminUsersManager } from '@/components/admin/AdminUsersManager';
import { AdminAdsManager } from '@/components/admin/AdminAdsManager';
import { AdminSettings } from '@/components/admin/AdminSettings';

interface DashboardStats {
  total_users?: number;
  premium_users?: number;
  active_ads?: number;
  premium_ads?: number;
  basic_boosts?: number;
  premium_boosts?: number;
  ultimate_boosts?: number;
  total_points?: number;
  total_credits?: number;
  new_users_this_month?: number;
}

const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'stats' | 'users' | 'ads' | 'settings'>('stats');
  const [stats, setStats] = useState<DashboardStats>({});
  const [loading, setLoading] = useState(true);
  const { logout } = useAdminAuth();
  const { toast } = useToast();

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_dashboard_stats')
        .select('*')
        .limit(1)
        .single();

      if (error) {
        console.error('Error loading stats:', error);
      } else {
        setStats(data || {});
      }
    } catch (error) {
      console.error('Stats loading error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    toast({
      title: "تم تسجيل الخروج",
      description: "تم تسجيل خروجك من لوحة التحكم بنجاح",
    });
  };

  const renderStats = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">إجمالي المستخدمين</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.total_users?.toLocaleString() || 0}</div>
          <p className="text-xs text-muted-foreground">
            مميزين: {stats.premium_users?.toLocaleString() || 0}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">الإعلانات النشطة</CardTitle>
          <Car className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.active_ads?.toLocaleString() || 0}</div>
          <p className="text-xs text-muted-foreground">
            مميزة: {stats.premium_ads?.toLocaleString() || 0}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">الإعلانات المعززة</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {((stats.basic_boosts || 0) + (stats.premium_boosts || 0) + (stats.ultimate_boosts || 0)).toLocaleString()}
          </div>
          <div className="text-xs text-muted-foreground space-y-1">
            <p>أساسي: {stats.basic_boosts || 0}</p>
            <p>مميز: {stats.premium_boosts || 0}</p>
            <p>نهائي: {stats.ultimate_boosts || 0}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">النقاط والرصيد</CardTitle>
          <Award className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{(stats.total_points || 0).toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">
            رصيد مميز: {(stats.total_credits || 0).toLocaleString()}
          </p>
        </CardContent>
      </Card>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">جاري تحميل البيانات...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4 rtl:space-x-reverse">
              <Shield className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">لوحة التحكم الإدارية</h1>
                <p className="text-gray-600">تطبيق الكرين</p>
              </div>
            </div>
            <Button onClick={handleLogout} variant="outline">
              <LogOut className="w-4 h-4 ml-2" />
              تسجيل الخروج
            </Button>
          </div>
          
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 rtl:space-x-reverse">
              <button
                onClick={() => setActiveTab('stats')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'stats'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                الإحصائيات
              </button>
              <button
                onClick={() => setActiveTab('users')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'users'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                إدارة المستخدمين
              </button>
              <button
                onClick={() => setActiveTab('ads')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'ads'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                إدارة الإعلانات
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'settings'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                الإعدادات
              </button>
            </nav>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {activeTab === 'stats' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">إحصائيات عامة</h2>
              {renderStats()}
            </div>
          </div>
        )}
        {activeTab === 'users' && <AdminUsersManager />}
        {activeTab === 'ads' && <AdminAdsManager />}
        {activeTab === 'settings' && <AdminSettings />}
      </div>
    </div>
  );
};

export default AdminDashboard;
