
import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

interface SessionVerifyResponse {
  valid: boolean;
  message: string;
  username?: string;
  admin_id?: string;
}

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkSession = async () => {
      const token = localStorage.getItem('admin_token');
      if (!token) return navigate('/admin-login');

      const { data, error } = await supabase.rpc('verify_admin_session', {
        token
      });

      const response = data as SessionVerifyResponse;

      if (!response?.valid) {
        localStorage.removeItem('admin_token');
        navigate('/admin-login');
      } else {
        setLoading(false);
      }
    };

    checkSession();
  }, [navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">لوحة تحكم المدير</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link to="/admin-users">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-6">
              <div className="text-4xl mb-2">👥</div>
              <h2 className="text-xl font-semibold">إدارة المستخدمين</h2>
            </CardContent>
          </Card>
        </Link>
        <Card className="hover:shadow-lg transition-shadow cursor-pointer opacity-50">
          <CardContent className="p-6">
            <div className="text-4xl mb-2">🚘</div>
            <h2 className="text-xl font-semibold">إدارة الإعلانات</h2>
            <p className="text-sm text-gray-500">قريباً</p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-lg transition-shadow cursor-pointer opacity-50">
          <CardContent className="p-6">
            <div className="text-4xl mb-2">📊</div>
            <h2 className="text-xl font-semibold">الإحصائيات العامة</h2>
            <p className="text-sm text-gray-500">قريباً</p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-lg transition-shadow cursor-pointer opacity-50">
          <CardContent className="p-6">
            <div className="text-4xl mb-2">⚙️</div>
            <h2 className="text-xl font-semibold">الإعدادات</h2>
            <p className="text-sm text-gray-500">قريباً</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
