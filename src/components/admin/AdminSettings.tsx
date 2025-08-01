
import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Settings, Save, Eye, EyeOff, LogOut } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export const AdminSettings: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [loggingOutAll, setLoggingOutAll] = useState(false);
  const { toast } = useToast();
  const { logout } = useAdminAuth();

  const updateCredentials = async () => {
    if (!username.trim() || !password.trim()) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال اسم المستخدم وكلمة المرور",
        variant: "destructive",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "خطأ",
        description: "كلمة المرور وتأكيد كلمة المرور غير متطابقتين",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 8) {
      toast({
        title: "خطأ",
        description: "كلمة المرور يجب أن تكون 8 أحرف على الأقل",
        variant: "destructive",
      });
      return;
    }

    setUpdating(true);
    try {
      // Get admin user ID from session
      const { data: sessionData } = await supabase.auth.getUser();
      const adminUserId = sessionData?.user?.id;

      if (!adminUserId) {
        toast({
          title: "خطأ",
          description: "فشل في التحقق من هوية المدير",
          variant: "destructive",
        });
        return;
      }

      // Hash the password using bcrypt-like function
      const passwordHash = await hashPassword(password);

      const { data, error } = await supabase.rpc('update_admin_credentials', {
        admin_user_id: adminUserId,
        new_username: username,
        new_password_hash: passwordHash
      });

      if (error || !data?.success) {
        toast({
          title: "فشل التحديث",
          description: data?.message || "فشل في تحديث بيانات الدخول",
          variant: "destructive",
        });
      } else {
        toast({
          title: "تم التحديث بنجاح",
          description: "تم تحديث بيانات الدخول، يرجى تسجيل الدخول مرة أخرى",
        });
        setUsername('');
        setPassword('');
        setConfirmPassword('');
        
        // Logout after update
        setTimeout(() => {
          logout();
        }, 2000);
      }
    } catch (error) {
      console.error('Update error:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تحديث بيانات الدخول",
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  const logoutAllSessions = async () => {
    setLoggingOutAll(true);
    try {
      // Get admin user ID from session
      const { data: sessionData } = await supabase.auth.getUser();
      const adminUserId = sessionData?.user?.id;

      if (!adminUserId) {
        toast({
          title: "خطأ",
          description: "فشل في التحقق من هوية المدير",
          variant: "destructive",
        });
        return;
      }

      const { data, error } = await supabase.rpc('logout_all_admin_sessions', {
        admin_id: adminUserId
      });

      if (error || !data?.success) {
        toast({
          title: "خطأ",
          description: "فشل في تسجيل الخروج من جميع الجلسات",
          variant: "destructive",
        });
      } else {
        toast({
          title: "تم بنجاح",
          description: "تم تسجيل الخروج من جميع الجلسات",
        });
        
        // Logout current session
        setTimeout(() => {
          logout();
        }, 1000);
      }
    } catch (error) {
      console.error('Logout all error:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تسجيل الخروج",
        variant: "destructive",
      });
    } finally {
      setLoggingOutAll(false);
    }
  };

  // Simple password hashing function (in production, use a proper library)
  const hashPassword = async (password: string): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hash))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            تغيير بيانات الدخول
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="new-username">اسم المستخدم الجديد</Label>
            <Input
              id="new-username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="أدخل اسم المستخدم الجديد"
              dir="ltr"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="new-password">كلمة المرور الجديدة</Label>
            <div className="relative">
              <Input
                id="new-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="أدخل كلمة المرور الجديدة (8 أحرف على الأقل)"
                dir="ltr"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute left-2 top-1/2 transform -translate-y-1/2"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm-password">تأكيد كلمة المرور</Label>
            <div className="relative">
              <Input
                id="confirm-password"
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="أعد إدخال كلمة المرور"
                dir="ltr"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute left-2 top-1/2 transform -translate-y-1/2"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          <Button onClick={updateCredentials} disabled={updating}>
            <Save className="w-4 h-4 ml-1" />
            {updating ? 'جاري التحديث...' : 'حفظ التغييرات'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>إدارة الجلسات</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              تسجيل الخروج من جميع الجلسات النشطة (بما في ذلك الجلسة الحالية)
            </p>
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                  <LogOut className="w-4 h-4 ml-1" />
                  تسجيل خروج من جميع الجلسات
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>تأكيد تسجيل الخروج</AlertDialogTitle>
                  <AlertDialogDescription>
                    هل أنت متأكد من تسجيل الخروج من جميع الجلسات النشطة؟
                    <br />
                    سيتم تسجيل خروجك من الجلسة الحالية أيضاً.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>إلغاء</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={logoutAllSessions}
                    disabled={loggingOutAll}
                  >
                    {loggingOutAll ? 'جاري تسجيل الخروج...' : 'تأكيد'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
