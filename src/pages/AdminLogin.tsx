
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function AdminLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async () => {
    setError('');
    setLoading(true);
    
    try {
      const { data, error: funcError } = await supabase.rpc('create_admin_session', {
        username_input: username,
        password_input: password,
        ip_addr: '',
        user_agent_input: navigator.userAgent
      });

      if (funcError || !data?.success) {
        setError(data?.message || 'فشل تسجيل الدخول');
        return;
      }

      localStorage.setItem('admin_token', data.session_token);
      navigate('/admin-users');
    } catch (err) {
      setError('حدث خطأ في الاتصال');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center text-2xl">تسجيل دخول المدير</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Input
              type="text"
              placeholder="اسم المستخدم"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              dir="rtl"
            />
          </div>
          
          <div>
            <Input
              type="password"
              placeholder="كلمة المرور"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              dir="rtl"
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button 
            onClick={handleLogin}
            className="w-full"
            disabled={loading || !username || !password}
          >
            {loading ? 'جارٍ تسجيل الدخول...' : 'دخول'}
          </Button>
          
          <div className="text-sm text-gray-500 text-center">
            <p>اسم المستخدم: admin</p>
            <p>كلمة المرور: admin123</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
