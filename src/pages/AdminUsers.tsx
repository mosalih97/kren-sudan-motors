
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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
  premium_expires_at: string;
  days_remaining: number;
  ads_count: number;
}

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [processingUserId, setProcessingUserId] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkAdminAuth();
    loadUsers();
  }, []);

  const checkAdminAuth = async () => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      navigate('/admin-login');
      return;
    }

    try {
      const { data } = await supabase.rpc('verify_admin_session', { token });
      if (!data?.valid) {
        localStorage.removeItem('admin_token');
        navigate('/admin-login');
      }
    } catch (err) {
      localStorage.removeItem('admin_token');
      navigate('/admin-login');
    }
  };

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase.rpc('get_admin_users_list');
      if (error) throw error;
      setUsers(data || []);
    } catch (err) {
      setError('فشل في تحميل قائمة المستخدمين');
    } finally {
      setLoading(false);
    }
  };

  const upgradeUser = async (userId: string) => {
    const token = localStorage.getItem('admin_token');
    if (!token) return;

    setProcessingUserId(userId);
    try {
      const { data: sessionData } = await supabase.rpc('verify_admin_session', { token });
      if (!sessionData?.valid) {
        navigate('/admin-login');
        return;
      }

      const { data, error } = await supabase.rpc('upgrade_user_to_premium', {
        target_user_id: userId,
        admin_user_id: sessionData.admin_id
      });

      if (error) throw error;

      if (data?.success) {
        toast({
          title: "نجح الترقية",
          description: data.message,
        });
        loadUsers();
      } else {
        toast({
          title: "فشل الترقية",
          description: data?.message || 'حدث خطأ',
          variant: "destructive",
        });
      }
    } catch (err) {
      toast({
        title: "خطأ",
        description: 'فشل في ترقية المستخدم',
        variant: "destructive",
      });
    } finally {
      setProcessingUserId(null);
    }
  };

  const downgradeUser = async (userId: string) => {
    const token = localStorage.getItem('admin_token');
    if (!token) return;

    setProcessingUserId(userId);
    try {
      const { data: sessionData } = await supabase.rpc('verify_admin_session', { token });
      if (!sessionData?.valid) {
        navigate('/admin-login');
        return;
      }

      const { data, error } = await supabase.rpc('downgrade_user_to_free', {
        target_user_id: userId,
        admin_user_id: sessionData.admin_id
      });

      if (error) throw error;

      if (data?.success) {
        toast({
          title: "نجح التراجع",
          description: data.message,
        });
        loadUsers();
      } else {
        toast({
          title: "فشل التراجع",
          description: data?.message || 'حدث خطأ',
          variant: "destructive",
        });
      }
    } catch (err) {
      toast({
        title: "خطأ",
        description: 'فشل في تراجع المستخدم',
        variant: "destructive",
      });
    } finally {
      setProcessingUserId(null);
    }
  };

  const logout = () => {
    localStorage.removeItem('admin_token');
    navigate('/admin-login');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">إدارة المستخدمين</h1>
        <Button onClick={logout} variant="outline">
          تسجيل الخروج
        </Button>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4">
        {users.map((user) => (
          <Card key={user.user_id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-lg">
                      {user.display_name || 'غير محدد'}
                    </h3>
                    <Badge 
                      variant={user.membership_type === 'premium' ? 'default' : 'secondary'}
                    >
                      {user.membership_type === 'premium' ? 'مميز' : 'عادي'}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-gray-600">
                    <div>الهاتف: {user.phone || 'غير محدد'}</div>
                    <div>المدينة: {user.city || 'غير محدد'}</div>
                    <div>النقاط: {user.points}</div>
                    <div>الكريديت: {user.credits}</div>
                    <div>عدد الإعلانات: {user.ads_count}</div>
                    <div>تاريخ التسجيل: {new Date(user.created_at).toLocaleDateString('ar-SA')}</div>
                    {user.premium_expires_at && (
                      <div>
                        انتهاء المميز: {new Date(user.premium_expires_at).toLocaleDateString('ar-SA')}
                      </div>
                    )}
                    {user.days_remaining && (
                      <div>الأيام المتبقية: {user.days_remaining}</div>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 ml-4">
                  {user.membership_type === 'free' ? (
                    <Button
                      onClick={() => upgradeUser(user.user_id)}
                      disabled={processingUserId === user.user_id}
                      size="sm"
                    >
                      {processingUserId === user.user_id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        'ترقية لمميز'
                      )}
                    </Button>
                  ) : (
                    <Button
                      onClick={() => downgradeUser(user.user_id)}
                      disabled={processingUserId === user.user_id}
                      variant="outline"
                      size="sm"
                    >
                      {processingUserId === user.user_id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        'تراجع لعادي'
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {users.length === 0 && !loading && (
        <div className="text-center py-8 text-gray-500">
          لا توجد مستخدمون
        </div>
      )}
    </div>
  );
}
