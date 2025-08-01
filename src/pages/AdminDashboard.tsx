
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, Car, MessageCircle, Crown, Activity, AlertTriangle } from 'lucide-react';
import { Navigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import { AdminStats } from '@/components/admin/AdminStats';
import { RecentUsers } from '@/components/admin/RecentUsers';
import { RecentAds } from '@/components/admin/RecentAds';
import { SecurityLogs } from '@/components/admin/SecurityLogs';

const AdminDashboard = () => {
  const { user } = useAuth();

  // التحقق من صلاحيات الإدارة
  const { data: isAdmin, isLoading: checkingAdmin } = useQuery({
    queryKey: ['admin-check', user?.email],
    queryFn: async () => {
      if (!user?.email) return false;
      
      const { data, error } = await supabase.rpc('is_admin', {
        user_email: user.email
      });

      if (error) {
        console.error('Admin check error:', error);
        return false;
      }
      
      return data;
    },
    enabled: !!user?.email,
  });

  // إذا لم يكن لديه صلاحيات إدارية
  if (!checkingAdmin && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  if (checkingAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>التحقق من الصلاحيات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">لوحة التحكم الإدارية</h1>
          <p className="text-gray-600 mt-2">إدارة شاملة لمنصة الكرين</p>
        </div>
        <Badge variant="secondary" className="bg-green-100 text-green-800">
          <Crown className="w-4 h-4 mr-1" />
          مدير النظام
        </Badge>
      </div>

      {/* الإحصائيات العامة */}
      <AdminStats />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* المستخدمون الجدد */}
        <RecentUsers />

        {/* الإعلانات الحديثة */}
        <RecentAds />
      </div>

      {/* سجلات الأمان */}
      <SecurityLogs />
    </div>
  );
};

export default AdminDashboard;
