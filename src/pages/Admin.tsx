
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { UserManagement } from '@/components/admin/UserManagement';

interface AdminStats {
  total_users: number;
  total_ads: number;
  active_ads: number;
  premium_users: number;
  total_boosts: number;
  new_users_this_month: number;
}

const Admin = () => {
  const { user } = useAuth();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleAdminLogin = async () => {
    if (!username || !password) {
      toast({
        variant: "destructive",
        title: "خطأ",
        description: "يرجى إدخال اسم المستخدم وكلمة المرور",
      });
      return;
    }

    setIsLoggingIn(true);

    // دخول فوري للمدير
    if (username === 'admin' && password === 'admin123') {
      setIsAuthenticated(true);
      loadAdminDataInBackground();
      
      toast({
        title: "مرحباً بك في لوحة التحكم",
        description: "تم تسجيل الدخول بنجاح",
      });
      setIsLoggingIn(false);
      return;
    }

    // التحقق من المستخدمين المسجلين (بدون انتظار)
    if (user?.email) {
      setIsAuthenticated(true);
      loadAdminDataInBackground();
      
      toast({
        title: "مرحباً بك في لوحة التحكم",
        description: "تم تسجيل الدخول بنجاح",
      });
      setIsLoggingIn(false);
      return;
    }

    toast({
      variant: "destructive",
      title: "خطأ في تسجيل الدخول",
      description: "اسم المستخدم أو كلمة المرور غير صحيحة",
    });
    setIsLoggingIn(false);
  };

  const loadAdminDataInBackground = async () => {
    try {
      // تحميل الإحصائيات في الخلفية
      const { data: statsData, error: statsError } = await supabase.rpc('get_admin_stats');
      if (!statsError && statsData) {
        if (typeof statsData === 'object' && statsData !== null && !Array.isArray(statsData)) {
          const data = statsData as Record<string, unknown>;
          const adminStats: AdminStats = {
            total_users: Number(data.total_users) || 0,
            total_ads: Number(data.total_ads) || 0,
            active_ads: Number(data.active_ads) || 0,
            premium_users: Number(data.premium_users) || 0,
            total_boosts: Number(data.total_boosts) || 0,
            new_users_this_month: Number(data.new_users_this_month) || 0
          };
          setStats(adminStats);
        }
      }
    } catch (error) {
      console.error('Error loading admin data:', error);
      // لا نظهر رسالة خطأ للمستخدم - البيانات ستحمل في الخلفية
    }
  };

  // التحقق الفوري عند تحميل الصفحة
  useEffect(() => {
    // إذا كان المستخدم مسجل دخوله، ادخله فوراً
    if (user?.email) {
      setIsAuthenticated(true);
      loadAdminDataInBackground();
    }
  }, [user]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">جاري تحميل...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-gray-800">
              🔐 لوحة التحكم الإدارية
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              type="text"
              placeholder="اسم المستخدم (admin)"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="text-right"
              disabled={isLoggingIn}
            />
            <Input
              type="password"
              placeholder="كلمة المرور (admin123)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="text-right"
              disabled={isLoggingIn}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleAdminLogin();
                }
              }}
            />
            <Button 
              onClick={handleAdminLogin}
              className="w-full"
              disabled={isLoggingIn}
            >
              {isLoggingIn ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  جاري تسجيل الدخول...
                </>
              ) : (
                'دخول'
              )}
            </Button>
            <p className="text-sm text-gray-600 text-center">
              اسم المستخدم: admin<br />
              كلمة المرور: admin123
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">
              🛡️ لوحة التحكم الإدارية
            </CardTitle>
          </CardHeader>
        </Card>

        {/* User Management Component */}
        <UserManagement />
      </div>
    </div>
  );
};

export default Admin;
