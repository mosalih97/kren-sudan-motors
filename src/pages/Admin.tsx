
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
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const checkAdminAccess = async () => {
    try {
      setIsLoading(true);
      console.log('Checking admin access...');
      
      // التحقق من session token المحفوظ محلياً أولاً
      const adminCredentials = localStorage.getItem('admin_session_token');
      if (adminCredentials) {
        console.log('Found admin session token - allowing access');
        setIsAuthenticated(true);
        await loadAdminData();
        return;
      }

      // التحقق من المستخدم المسجل دخوله
      if (user?.email) {
        console.log('Checking user email:', user.email);
        
        // التحقق من جدول admin_users
        const { data: adminCheck } = await supabase
          .from('admin_users')
          .select('email')
          .eq('email', user.email)
          .single();

        if (adminCheck) {
          console.log('User is admin via email check');
          
          // التأكد من وجود ملف شخصي للمدير
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', user.id)
            .single();

          if (!profile) {
            // إنشاء ملف شخصي للمدير
            await supabase
              .from('profiles')
              .insert({
                user_id: user.id,
                display_name: user.email?.split('@')[0] || 'مدير',
                membership_type: 'admin',
                is_premium: true,
                points: 1000,
                credits: 1000
              });
          } else if (profile.membership_type !== 'admin') {
            // تحديث الملف الشخصي ليكون مدير
            await supabase
              .from('profiles')
              .update({ 
                membership_type: 'admin',
                is_premium: true 
              })
              .eq('user_id', user.id);
          }

          setIsAuthenticated(true);
          await loadAdminData();
          return;
        }
      }
      
      // إذا لم يتم العثور على صلاحيات، اظهر نموذج تسجيل الدخول
      console.log('No admin access found');
    } catch (error) {
      console.error('Error checking admin access:', error);
    } finally {
      setIsLoading(false);
    }
  };

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
    console.log('Attempting admin login with username:', username);

    try {
      // بيانات الدخول المباشرة
      if (username === 'admin' && password === 'admin123') {
        console.log('Login successful with hardcoded credentials');
        localStorage.setItem('admin_session_token', 'admin_session_' + Date.now());
        setIsAuthenticated(true);
        await loadAdminData();
        
        toast({
          title: "مرحباً بك في لوحة التحكم",
          description: "تم تسجيل الدخول بنجاح",
        });
        return;
      }

      toast({
        variant: "destructive",
        title: "خطأ في تسجيل الدخول",
        description: "اسم المستخدم أو كلمة المرور غير صحيحة",
      });

    } catch (error) {
      console.error('Admin login error:', error);
      toast({
        variant: "destructive",
        title: "خطأ",
        description: "حدث خطأ أثناء تسجيل الدخول",
      });
    } finally {
      setIsLoggingIn(false);
    }
  };

  const loadAdminData = async () => {
    try {
      console.log('Loading admin data...');
      
      // تحميل الإحصائيات
      const { data: statsData, error: statsError } = await supabase.rpc('get_admin_stats');
      
      if (!statsError && statsData) {
        console.log('Stats loaded:', statsData);
        
        // التحقق من أن البيانات من النوع الصحيح
        if (typeof statsData === 'object' && statsData !== null && !Array.isArray(statsData)) {
          const adminStats: AdminStats = {
            total_users: Number(statsData.total_users) || 0,
            total_ads: Number(statsData.total_ads) || 0,
            active_ads: Number(statsData.active_ads) || 0,
            premium_users: Number(statsData.premium_users) || 0,
            total_boosts: Number(statsData.total_boosts) || 0,
            new_users_this_month: Number(statsData.new_users_this_month) || 0
          };
          setStats(adminStats);
        } else {
          console.error('Invalid stats data format:', statsData);
        }
      } else {
        console.error('Error loading stats:', statsError);
      }
    } catch (error) {
      console.error('Error loading admin data:', error);
    }
  };

  useEffect(() => {
    checkAdminAccess();
  }, [user]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">جاري التحقق من الصلاحيات...</p>
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
