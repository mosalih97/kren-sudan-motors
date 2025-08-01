
import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Shield, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const AdminLogin: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login, isAuthenticated } = useAdminAuth();
  const { toast } = useToast();

  if (isAuthenticated) {
    return <Navigate to="/admin-dashboard" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // التحقق من إدخال البيانات
    if (!username.trim() || !password.trim()) {
      toast({
        title: "خطأ في البيانات",
        description: "يرجى إدخال اسم المستخدم وكلمة المرور",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    try {
      console.log('Submitting login form with:', { username: username.trim() });
      const result = await login(username.trim(), password);
      
      console.log('Login result:', result);
      
      if (result.success) {
        toast({
          title: "تم تسجيل الدخول بنجاح",
          description: "مرحباً بك في لوحة التحكم الإدارية",
        });
        // التنقل سيتم تلقائياً من خلال isAuthenticated
      } else {
        // عرض رسالة خطأ مفيدة
        const errorMessage = result.message === 'بيانات الدخول غير صحيحة' 
          ? "اسم المستخدم أو كلمة المرور غير صحيحة"
          : result.message || "حدث خطأ أثناء تسجيل الدخول";
          
        toast({
          title: "فشل تسجيل الدخول",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Login submission error:', error);
      toast({
        title: "خطأ في النظام",
        description: "حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">لوحة التحكم الإدارية</CardTitle>
          <CardDescription>تطبيق الكرين - دخول المدير</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">اسم المستخدم</Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="أدخل اسم المستخدم"
                disabled={loading}
                dir="ltr"
                className="text-left"
                autoComplete="username"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">كلمة المرور</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="أدخل كلمة المرور"
                  disabled={loading}
                  dir="ltr"
                  className="text-left pr-10"
                  autoComplete="current-password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute left-2 top-1/2 transform -translate-y-1/2 h-auto p-1"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
            </div>
            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading}
            >
              {loading ? "جاري تسجيل الدخول..." : "تسجيل الدخول"}
            </Button>
          </form>
          
          <div className="mt-6 p-3 bg-gray-50 rounded-lg text-sm text-gray-600">
            <p className="font-medium mb-1">بيانات الدخول الافتراضية:</p>
            <p>اسم المستخدم: admin</p>
            <p>كلمة المرور: admin123</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminLogin;
