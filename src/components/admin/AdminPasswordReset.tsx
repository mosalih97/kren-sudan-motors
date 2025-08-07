
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const AdminPasswordReset = () => {
  const [username, setUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setSuccess(false);
    setLoading(true);

    // التحقق من البيانات المدخلة
    if (!username.trim() || !newPassword.trim() || !confirmPassword.trim()) {
      setMessage('يرجى ملء جميع الحقول');
      setLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage('كلمات المرور غير متطابقة');
      setLoading(false);
      return;
    }

    if (newPassword.length < 8) {
      setMessage('كلمة المرور يجب أن تكون 8 أحرف على الأقل');
      setLoading(false);
      return;
    }

    try {
      console.log('Attempting password reset for username:', username);
      
      // استخدام دالة إعادة تعيين كلمة المرور
      const { data, error } = await supabase.rpc('reset_admin_password', {
        admin_username: username.trim(),
        new_password: newPassword
      });

      if (error) {
        console.error('Password reset error:', error);
        setMessage(`خطأ في إعادة تعيين كلمة المرور: ${error.message}`);
        return;
      }

      if (data && typeof data === 'object' && data !== null) {
        const result = data as any;
        if (result.success) {
          setSuccess(true);
          setMessage('تم إعادة تعيين كلمة المرور بنجاح! يمكنك الآن تسجيل الدخول');
          // إعادة تعيين النموذج
          setUsername('');
          setNewPassword('');
          setConfirmPassword('');
        } else {
          setMessage(result.message || 'فشل في إعادة تعيين كلمة المرور');
        }
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      setMessage(`خطأ غير متوقع: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <RefreshCw className="h-12 w-12 text-red-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-red-800">إعادة تعيين كلمة مرور المدير</CardTitle>
          <CardDescription>
            في حالة نسيان كلمة المرور، يمكنك إعادة تعيينها هنا
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleReset} className="space-y-4">
            {message && (
              <Alert variant={success ? "default" : "destructive"}>
                {success ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
                <AlertDescription className="text-right">{message}</AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="username">اسم المستخدم</Label>
              <div className="relative">
                <Shield className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="username"
                  type="text"
                  placeholder="أدخل اسم المستخدم الحالي"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="pr-10"
                  required
                  disabled={loading}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="newPassword">كلمة المرور الجديدة</Label>
              <Input
                id="newPassword"
                type="password"
                placeholder="أدخل كلمة المرور الجديدة"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">تأكيد كلمة المرور</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="أعد إدخال كلمة المرور الجديدة"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            
            <Button 
              type="submit" 
              className="w-full bg-red-600 hover:bg-red-700" 
              disabled={loading}
            >
              {loading ? 'جاري إعادة التعيين...' : 'إعادة تعيين كلمة المرور'}
            </Button>
          </form>
          
          <div className="mt-4 text-center">
            <a 
              href="/admin-login" 
              className="text-sm text-blue-600 hover:underline"
            >
              العودة إلى صفحة تسجيل الدخول
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminPasswordReset;
