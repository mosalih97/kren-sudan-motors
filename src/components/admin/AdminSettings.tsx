
import React, { useState } from 'react';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Settings, LogOut, Lock, User } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const AdminSettings: React.FC = () => {
  const { adminUser, logout } = useAdminAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    newUsername: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const updateCredentials = async () => {
    if (formData.newPassword !== formData.confirmPassword) {
      toast({
        title: 'خطأ',
        description: 'كلمة المرور الجديدة وتأكيدها غير متطابقين',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.newUsername || !formData.newPassword) {
      toast({
        title: 'خطأ',
        description: 'يرجى ملء جميع الحقول المطلوبة',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      // تشفير كلمة المرور الجديدة
      const { data, error } = await supabase.rpc('update_admin_credentials', {
        admin_user_id: adminUser?.id,
        new_username: formData.newUsername,
        new_password_hash: formData.newPassword // سيتم تشفيرها في الدالة
      });

      if (error) throw error;

      if (data?.success) {
        toast({
          title: 'تم بنجاح',
          description: 'تم تحديث بيانات الدخول بنجاح',
        });
        
        // إعادة تعيين النموذج
        setFormData({
          newUsername: '',
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      } else {
        throw new Error(data?.message || 'فشل في تحديث البيانات');
      }
    } catch (error) {
      console.error('Error updating credentials:', error);
      toast({
        title: 'خطأ',
        description: error instanceof Error ? error.message : 'فشل في تحديث البيانات',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const logoutAllSessions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('logout_all_admin_sessions', {
        admin_id: adminUser?.id
      });

      if (error) throw error;

      if (data?.success) {
        toast({
          title: 'تم بنجاح',
          description: 'تم تسجيل الخروج من جميع الجلسات',
        });
        
        // تسجيل الخروج من الجلسة الحالية
        await logout();
      } else {
        throw new Error(data?.message || 'فشل في تسجيل الخروج');
      }
    } catch (error) {
      console.error('Error logging out all sessions:', error);
      toast({
        title: 'خطأ',
        description: error instanceof Error ? error.message : 'فشل في تسجيل الخروج',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Settings className="h-6 w-6 text-gray-600" />
        <div>
          <h2 className="text-2xl font-bold text-gray-900">إعدادات المدير</h2>
          <p className="text-gray-600 mt-1">إدارة إعدادات الحساب والأمان</p>
        </div>
      </div>

      {/* معلومات المدير الحالية */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            معلومات الحساب
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-600">اسم المدير:</span>
            <span className="font-medium">{adminUser?.display_name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">معرف المدير:</span>
            <span className="font-mono text-sm">{adminUser?.id}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">نوع العضوية:</span>
            <span className="font-medium text-blue-600">مدير</span>
          </div>
        </CardContent>
      </Card>

      {/* تحديث بيانات الدخول */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            تحديث بيانات الدخول
          </CardTitle>
          <CardDescription>
            تغيير اسم المستخدم وكلمة المرور
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="newUsername">اسم المستخدم الجديد</Label>
              <Input
                id="newUsername"
                type="text"
                value={formData.newUsername}
                onChange={(e) => handleInputChange('newUsername', e.target.value)}
                placeholder="اسم المستخدم الجديد"
              />
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">كلمة المرور الجديدة</Label>
              <Input
                id="newPassword"
                type="password"
                value={formData.newPassword}
                onChange={(e) => handleInputChange('newPassword', e.target.value)}
                placeholder="كلمة المرور الجديدة"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">تأكيد كلمة المرور</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                placeholder="تأكيد كلمة المرور الجديدة"
              />
            </div>
          </div>

          <Button
            onClick={updateCredentials}
            disabled={loading}
            className="w-full"
          >
            {loading ? 'جاري التحديث...' : 'تحديث بيانات الدخول'}
          </Button>
        </CardContent>
      </Card>

      {/* إعدادات الأمان */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LogOut className="h-5 w-5" />
            إعدادات الأمان
          </CardTitle>
          <CardDescription>
            إدارة الجلسات الأمنية
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertDescription>
              تسجيل الخروج من جميع الجلسات سيقوم بإنهاء جميع جلسات تسجيل الدخول النشطة على جميع الأجهزة.
            </AlertDescription>
          </Alert>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="w-full">
                <LogOut className="h-4 w-4 ml-2" />
                تسجيل الخروج من جميع الجلسات
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>تأكيد تسجيل الخروج</AlertDialogTitle>
                <AlertDialogDescription>
                  هل أنت متأكد من تسجيل الخروج من جميع الجلسات النشطة؟ 
                  سيتم إنهاء جميع جلسات تسجيل الدخول على جميع الأجهزة.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>إلغاء</AlertDialogCancel>
                <AlertDialogAction
                  onClick={logoutAllSessions}
                  className="bg-red-600 hover:bg-red-700"
                  disabled={loading}
                >
                  {loading ? 'جاري تسجيل الخروج...' : 'تأكيد الخروج'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminSettings;
