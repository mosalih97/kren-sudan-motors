
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { Loader2, UserPlus, UserMinus, Crown, Users, Calendar, CreditCard } from 'lucide-react';

interface User {
  user_id: string;
  display_name: string;
  phone: string;
  city: string;
  membership_type: string;
  is_premium: boolean;
  points: number;
  credits: number;
  created_at: string;
  upgraded_at: string;
  premium_expires_at: string;
  days_remaining: number;
  ads_count: number;
}

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
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // التحقق من صلاحيات الإدارة
  const checkAdminAccess = async () => {
    if (!user?.email) {
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.rpc('check_admin_access', {
        user_email: user.email
      });

      if (error) {
        console.error('Error checking admin access:', error);
        setIsLoading(false);
        return;
      }

      setIsAuthenticated(data);
      if (data) {
        await loadAdminData();
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // تسجيل دخول بديل للإدارة
  const handleAdminLogin = async () => {
    if (!username || !password) {
      toast({
        variant: "destructive",
        title: "خطأ",
        description: "يرجى إدخال اسم المستخدم وكلمة المرور",
      });
      return;
    }

    try {
      const { data, error } = await supabase.rpc('create_admin_session', {
        username_input: username,
        password_input: password,
        ip_addr: '',
        user_agent_input: navigator.userAgent
      });

      if (error || !data.success) {
        toast({
          variant: "destructive",
          title: "خطأ في تسجيل الدخول",
          description: data?.message || "فشل في تسجيل الدخول",
        });
        return;
      }

      // حفظ token الجلسة
      localStorage.setItem('admin_session_token', data.session_token);
      setIsAuthenticated(true);
      await loadAdminData();
      
      toast({
        title: "مرحباً",
        description: "تم تسجيل الدخول بنجاح",
      });
    } catch (error) {
      console.error('Admin login error:', error);
      toast({
        variant: "destructive",
        title: "خطأ",
        description: "حدث خطأ أثناء تسجيل الدخول",
      });
    }
  };

  // تحميل البيانات الإدارية
  const loadAdminData = async () => {
    try {
      // تحميل إحصائيات عامة
      const { data: statsData, error: statsError } = await supabase.rpc('get_admin_stats');
      if (statsError) {
        console.error('Error loading stats:', statsError);
      } else {
        setStats(statsData);
      }

      // تحميل قائمة المستخدمين
      const { data: usersData, error: usersError } = await supabase.rpc('get_admin_users_list');
      if (usersError) {
        console.error('Error loading users:', usersError);
      } else {
        setUsers(usersData || []);
      }
    } catch (error) {
      console.error('Error loading admin data:', error);
    }
  };

  // ترقية مستخدم للعضوية المميزة
  const upgradeUserToPremium = async (userId: string) => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase.rpc('upgrade_user_to_premium', {
        target_user_id: userId,
        admin_user_id: user.id
      });

      if (error || !data.success) {
        toast({
          variant: "destructive",
          title: "خطأ",
          description: data?.message || "فشل في ترقية المستخدم",
        });
        return;
      }

      toast({
        title: "نجح",
        description: "تم ترقية المستخدم بنجاح",
      });

      await loadAdminData();
    } catch (error) {
      console.error('Error upgrading user:', error);
      toast({
        variant: "destructive",
        title: "خطأ",
        description: "حدث خطأ أثناء ترقية المستخدم",
      });
    }
  };

  // إرجاع مستخدم للعضوية العادية
  const downgradeUserToFree = async (userId: string) => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase.rpc('downgrade_user_to_free', {
        target_user_id: userId,
        admin_user_id: user.id
      });

      if (error || !data.success) {
        toast({
          variant: "destructive",
          title: "خطأ",
          description: data?.message || "فشل في إرجاع المستخدم للعضوية العادية",
        });
        return;
      }

      toast({
        title: "نجح",
        description: "تم إرجاع المستخدم للعضوية العادية",
      });

      await loadAdminData();
    } catch (error) {
      console.error('Error downgrading user:', error);
      toast({
        variant: "destructive",
        title: "خطأ",
        description: "حدث خطأ أثناء إرجاع المستخدم",
      });
    }
  };

  useEffect(() => {
    checkAdminAccess();
  }, [user]);

  const filteredUsers = users.filter(u => 
    u.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.phone?.includes(searchTerm) ||
    u.city?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
              placeholder="اسم المستخدم"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="text-right"
            />
            <Input
              type="password"
              placeholder="كلمة المرور"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="text-right"
            />
            <Button 
              onClick={handleAdminLogin}
              className="w-full"
              disabled={!username || !password}
            >
              دخول
            </Button>
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

        {/* الإحصائيات */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <Users className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                <p className="text-2xl font-bold">{stats.total_users}</p>
                <p className="text-sm text-gray-600">إجمالي المستخدمين</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <Crown className="h-8 w-8 mx-auto mb-2 text-yellow-600" />
                <p className="text-2xl font-bold">{stats.premium_users}</p>
                <p className="text-sm text-gray-600">مستخدمين مميزين</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <Calendar className="h-8 w-8 mx-auto mb-2 text-green-600" />
                <p className="text-2xl font-bold">{stats.total_ads}</p>
                <p className="text-sm text-gray-600">إجمالي الإعلانات</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <CreditCard className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                <p className="text-2xl font-bold">{stats.active_ads}</p>
                <p className="text-sm text-gray-600">إعلانات نشطة</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="h-8 w-8 mx-auto mb-2 bg-orange-600 rounded-full flex items-center justify-center text-white font-bold">
                  ↗️
                </div>
                <p className="text-2xl font-bold">{stats.total_boosts}</p>
                <p className="text-sm text-gray-600">تعزيزات نشطة</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="h-8 w-8 mx-auto mb-2 bg-red-600 rounded-full flex items-center justify-center text-white font-bold">
                  📊
                </div>
                <p className="text-2xl font-bold">{stats.new_users_this_month}</p>
                <p className="text-sm text-gray-600">مستخدمين جدد هذا الشهر</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* البحث */}
        <Card>
          <CardContent className="p-4">
            <Input
              placeholder="البحث بالاسم أو الهاتف أو المدينة..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="text-right"
            />
          </CardContent>
        </Card>

        {/* قائمة المستخدمين */}
        <Card>
          <CardHeader>
            <CardTitle>إدارة المستخدمين ({filteredUsers.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredUsers.map((user) => (
                <div key={user.user_id} className="border rounded-lg p-4 bg-white">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-lg">{user.display_name}</h3>
                        {user.membership_type === 'premium' && (
                          <Badge className="bg-yellow-100 text-yellow-800">مميز</Badge>
                        )}
                        {user.membership_type === 'admin' && (
                          <Badge className="bg-red-100 text-red-800">مدير</Badge>
                        )}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 text-sm text-gray-600">
                        <div>📞 {user.phone}</div>
                        <div>🏙️ {user.city}</div>
                        <div>🔢 نقاط: {user.points}</div>
                        <div>💳 كريديت: {user.credits}</div>
                        <div>📝 إعلانات: {user.ads_count}</div>
                        <div>📅 انضم: {new Date(user.created_at).toLocaleDateString('ar-SA')}</div>
                        {user.premium_expires_at && (
                          <div className={`${user.days_remaining < 7 ? 'text-red-600' : ''}`}>
                            ⏰ باقي: {user.days_remaining} يوم
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      {user.membership_type !== 'premium' && user.membership_type !== 'admin' && (
                        <Button
                          onClick={() => upgradeUserToPremium(user.user_id)}
                          size="sm"
                          className="bg-yellow-600 hover:bg-yellow-700"
                        >
                          <UserPlus className="h-4 w-4 ml-1" />
                          ترقية
                        </Button>
                      )}
                      
                      {user.membership_type === 'premium' && (
                        <Button
                          onClick={() => downgradeUserToFree(user.user_id)}
                          size="sm"
                          variant="outline"
                          className="border-red-300 text-red-600 hover:bg-red-50"
                        >
                          <UserMinus className="h-4 w-4 ml-1" />
                          إرجاع
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Admin;
