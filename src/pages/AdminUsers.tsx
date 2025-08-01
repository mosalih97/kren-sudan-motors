
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Navigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, User, Crown, Calendar } from 'lucide-react';
import { useAdminCheck } from '@/hooks/useAdminCheck';
import AdminLoadingScreen from '@/components/admin/AdminLoadingScreen';
import AccessDeniedScreen from '@/components/admin/AccessDeniedScreen';

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

const AdminUsers = () => {
  const { user } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdminCheck();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAdmin === true) {
      loadUsers();
    }
  }, [isAdmin]);

  const loadUsers = async () => {
    try {
      // جلب بيانات المستخدمين مع عدد الإعلانات
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          user_id,
          display_name,
          phone,
          city,
          membership_type,
          is_premium,
          points,
          credits,
          created_at
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // جلب عدد الإعلانات لكل مستخدم
      const usersWithAdsCounts = await Promise.all(
        (data || []).map(async (user) => {
          const { data: adsData, error: adsError } = await supabase
            .from('ads')
            .select('id')
            .eq('user_id', user.user_id)
            .eq('status', 'active');

          if (adsError) {
            console.error('خطأ في جلب عدد الإعلانات:', adsError);
          }

          return {
            ...user,
            ads_count: adsData?.length || 0
          };
        })
      );

      setUsers(usersWithAdsCounts);
    } catch (error) {
      console.error('خطأ في تحميل المستخدمين:', error);
      toast({
        title: "خطأ",
        description: "فشل في تحميل بيانات المستخدمين",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (adminLoading) {
    return <AdminLoadingScreen />;
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (isAdmin === false) {
    return <AccessDeniedScreen userEmail={user.email} />;
  }

  if (loading) {
    return <AdminLoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex items-center gap-4">
          <Button 
            variant="outline" 
            onClick={() => window.location.href = '/admin'}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            العودة للوحة التحكم
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">إدارة المستخدمين</h1>
            <p className="text-gray-600 mt-2">عدد المستخدمين: {users.length}</p>
          </div>
        </div>

        <div className="grid gap-6">
          {users.map((userData) => (
            <Card key={userData.user_id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">
                        {userData.display_name || 'غير محدد'}
                      </h3>
                      <p className="text-gray-600">{userData.phone}</p>
                      <p className="text-sm text-gray-500">{userData.city}</p>
                      <p className="text-sm text-gray-500">الإعلانات: {userData.ads_count}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 items-center">
                    {userData.is_premium && (
                      <Badge variant="default" className="flex items-center gap-1">
                        <Crown className="w-3 h-3" />
                        مميز
                      </Badge>
                    )}
                    <Badge variant="outline">
                      {userData.membership_type === 'premium' ? 'عضوية مميزة' : 'عضوية عادية'}
                    </Badge>
                    <Badge variant="secondary">
                      {userData.points} نقطة
                    </Badge>
                    {userData.credits > 0 && (
                      <Badge variant="secondary">
                        {userData.credits} رصيد
                      </Badge>
                    )}
                  </div>

                  <div className="text-sm text-gray-500 flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {new Date(userData.created_at).toLocaleDateString('ar-SA')}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {users.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center">
                <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">لا توجد مستخدمين مسجلين حالياً</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminUsers;
