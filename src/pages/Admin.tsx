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

  // Check admin access and ensure admin profile exists
  const checkAdminAccess = async () => {
    if (!user?.email) {
      setIsLoading(false);
      return;
    }

    try {
      console.log('Checking admin access for email:', user.email);
      
      // First check if user has admin privileges in email list
      const { data: emailCheck, error: emailError } = await supabase.rpc('check_admin_access', {
        user_email: user.email
      });

      console.log('Email admin check result:', emailCheck, emailError);

      if (emailCheck === true) {
        // Ensure admin profile exists in profiles table
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (profileError && profileError.code !== 'PGRST116') {
          console.error('Error checking profile:', profileError);
        }

        if (!profile) {
          // Create admin profile if it doesn't exist
          console.log('Creating admin profile for user:', user.id);
          const { error: insertError } = await supabase
            .from('profiles')
            .insert({
              user_id: user.id,
              display_name: user.email?.split('@')[0] || 'مدير',
              membership_type: 'admin',
              is_premium: true,
              points: 1000,
              credits: 1000
            });

          if (insertError) {
            console.error('Error creating admin profile:', insertError);
          }
        } else if (profile.membership_type !== 'admin') {
          // Update existing profile to admin
          console.log('Updating profile to admin:', user.id);
          const { error: updateError } = await supabase
            .from('profiles')
            .update({ 
              membership_type: 'admin',
              is_premium: true 
            })
            .eq('user_id', user.id);

          if (updateError) {
            console.error('Error updating profile to admin:', updateError);
          }
        }

        setIsAuthenticated(true);
        await loadAdminData();
      }
    } catch (error) {
      console.error('Error in admin check:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Alternative admin login using credentials
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
      // Primary authentication method - hardcoded credentials
      if (username === 'admin' && password === 'admin123') {
        console.log('Using hardcoded admin credentials - successful');
        setIsAuthenticated(true);
        await loadAdminData();
        
        toast({
          title: "مرحباً بك في لوحة التحكم",
          description: "تم تسجيل الدخول بنجاح",
        });
        return;
      }

      // Secondary method - try RPC function if available
      try {
        const { data, error } = await supabase.rpc('create_admin_session', {
          username_input: username,
          password_input: password,
          ip_addr: '',
          user_agent_input: navigator.userAgent
        });

        console.log('RPC Admin login response:', { data, error });

        if (!error && data && typeof data === 'object' && 'success' in data && data.success) {
          if ('session_token' in data && data.session_token) {
            localStorage.setItem('admin_session_token', String(data.session_token));
          }
          
          setIsAuthenticated(true);
          await loadAdminData();
          
          toast({
            title: "مرحباً بك",
            description: "تم تسجيل الدخول بنجاح عبر قاعدة البيانات",
          });
          return;
        }
      } catch (rpcError) {
        console.log('RPC method failed, falling back to hardcoded check:', rpcError);
      }

      // If we reach here, authentication failed
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

  // Load admin dashboard data
  const loadAdminData = async () => {
    try {
      console.log('Loading admin data...');
      
      // Load stats
      const { data: statsData, error: statsError } = await supabase.rpc('get_admin_stats');
      if (statsError) {
        console.error('Error loading stats:', statsError);
      } else if (statsData) {
        console.log('Raw stats data:', statsData);
        if (typeof statsData === 'object' && statsData !== null) {
          const statsObject = statsData as Record<string, unknown>;
          const convertedStats: AdminStats = {
            total_users: Number(statsObject.total_users || 0),
            total_ads: Number(statsObject.total_ads || 0),
            active_ads: Number(statsObject.active_ads || 0),
            premium_users: Number(statsObject.premium_users || 0),
            total_boosts: Number(statsObject.total_boosts || 0),
            new_users_this_month: Number(statsObject.new_users_this_month || 0)
          };
          console.log('Converted stats:', convertedStats);
          setStats(convertedStats);
        }
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
