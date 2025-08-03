
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
      console.log('Starting admin access check...');
      
      // التحقق السريع من session token المحفوظ محلياً
      const adminCredentials = localStorage.getItem('admin_session_token');
      if (adminCredentials) {
        console.log('Found valid admin session - quick login');
        setIsAuthenticated(true);
        setIsLoading(false);
        // تحميل البيانات في الخلفية
        loadAdminData();
        return;
      }

      // التحقق السريع من المستخدم المسجل دخوله
      if (user?.email) {
        console.log('Checking authenticated user:', user.email);
        
        // استعلام سريع للتحقق من صلاحيات الإدارة
        const { data: adminCheck, error } = await supabase
          .from('admin_users')
          .select('email')
          .eq('email', user.email)
          .single();

        if (!error && adminCheck) {
          console.log('User verified as admin');
          
          // التحقق السريع من الملف الشخصي والتحديث إذا لزم الأمر
          const { data: profile } = await supabase
            .from('profiles')
            .select('membership_type, is_premium')
            .eq('user_id', user.id)
            .single();

          if (!profile) {
            // إنشاء ملف شخصي سريع للمدير
            supabase
              .from('profiles')
              .insert({
                user_id: user.id,
                display_name: user.email?.split('@')[0] || 'مدير',
                membership_type: 'admin',
                is_premium: true,
                points: 1000,
                credits: 1000
              })
              .then(() => console.log('Admin profile created'));
          } else if (profile.membership_type !== 'admin') {
            // تحديث سريع للملف الشخصي
            supabase
              .from('profiles')
              .update({ 
                membership_type: 'admin',
                is_premium: true 
              })
              .eq('user_id', user.id)
              .then(() => console.log('Profile updated to admin'));
          }

          setIsAuthenticated(true);
          setIsLoading(false);
          // تحميل البيانات في الخلفية
          loadAdminData();
          return;
        }
      }
      
      // إذا لم يتم العثور على صلاحيات
      console.log('No admin access found - showing login form');
      setIsLoading(false);
    } catch (error) {
      console.error('Error in admin access check:', error);
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
    console.log('Attempting quick admin login...');

    try {
      // التحقق السريع من بيانات الدخول
      if (username === 'admin' && password === 'admin123') {
        console.log('Quick login successful');
        localStorage.setItem('admin_session_token', 'admin_session_' + Date.now());
        setIsAuthenticated(true);
        setIsLoggingIn(false);
        
        // تحميل البيانات في الخلفية
        loadAdminData();
        
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
      console.log('Loading admin data in background...');
      
      // تحميل الإحصائيات
      const { data: statsData, error: statsError } = await supabase.rpc('get_admin_stats');
      
      if (!statsError && statsData) {
        console.log('Stats loaded successfully:', statsData);
        
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
          // تعيين قيم افتراضية في حالة فشل التحميل
          setStats({
            total_users: 0,
            total_ads: 0,
            active_ads: 0,
            premium_users: 0,
            total_boosts: 0,
            new_users_this_month: 0
          });
        }
      } else {
        console.error('Error loading stats:', statsError);
        // تعيين قيم افتراضية
        setStats({
          total_users: 0,
          total_ads: 0,
          active_ads: 0,
          premium_users: 0,
          total_boosts: 0,
          new_users_this_month: 0
        });
      }
    } catch (error) {
      console.error('Error in loadAdminData:', error);
      // تعيين قيم افتراضية في حالة الخطأ
      setStats({
        total_users: 0,
        total_ads: 0,
        active_ads: 0,
        premium_users: 0,
        total_boosts: 0,
        new_users_this_month: 0
      });
    }
  };

  useEffect(() => {
    // بدء التحقق فور تحميل المكون
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
