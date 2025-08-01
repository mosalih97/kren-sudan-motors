
import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Settings, LogOut, Key } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAdminAuth } from '@/contexts/AdminAuthContext';

export const AdminSettings: React.FC = () => {
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { logout, sessionToken } = useAdminAuth();

  const updateCredentials = async () => {
    if (!newUsername.trim() || !newPassword.trim()) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال اسم المستخدم وكلمة المرور الجديدة",
        variant: "destructive",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "خطأ",
        description: "كلمة المرور وتأكيدها غير متطابقان",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 8) {
      toast({
        title: "خطأ",
        description: "كلمة المرور يجب أن تكون 8 أحرف على الأقل",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Hash the password (in a real implementation, this should be done on the server)
      const passwordHash = btoa(newPassword); // Basic encoding - should use proper hashing
      
      const { data, error } = await supabase.rpc('update_admin_credentials', {
        admin_user_id: 'current_admin_id', // This should be the actual admin ID
        new_username: newUsername,
        new_password_hash: passwordHash
      });

      if (error || !data) {
        toast({
          title: "فشل التحديث",
          description: "حدث خطأ أثناء تحديث بيانات الدخول",
          variant: "destructive",
        });
      } else {
        const result = data as { success?: boolean; message?: string };
        if (!result?.success) {
          toast({
            title: "فشل التحديث",
            description: result?.message || "حدث خطأ أثناء تحديث بيانات الدخول",
            variant: "destructive",
          });
        } else {
          toast({
            title: "تم التحديث",
            description: "تم تحديث بيانات الدخول بنجاح. سيتم تسجيل خروجك الآن.",
          });
          
          // Clear form
          setNewUsername('');
          setNewPassword('');
          setConfirmPassword('');
          
          // Logout after successful update
          setTimeout(() => logout(), 2000);
        }
      }
    } catch (error) {
      console.error('Update error:', error);
      toast({
        title: "خطأ",
        description: "فشل في تحديث بيانات الدخول",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const logoutAllSessions = async () => {
    const confirmLogout = window.confirm(
      "هل أنت متأكد من تسجيل الخروج من جميع الجلسات؟"
    );

    if (!confirmLogout) return;

    try {
      const { data } = await supabase.rpc('logout_all_admin_sessions', {
        admin_id: 'current_admin_id' // This should be the actual admin ID
      });

      const result = data as { success?: boolean; message?: string };
      toast({
        title: "تم بنجاح",
        description: result?.message || "تم تسجيل الخروج من جميع الجلسات",
      });
      
      logout();
    } catch (error) {
      console.error('Logout all error:', error);
      toast({
        title: "خطأ",
        description: "فشل في تسجيل الخروج من جميع الجلسات",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 rtl:space-x-reverse">
            <Settings className="h-5 w-5" />
            <span>إعدادات لوحة التحكم</span>
          </CardTitle>
          <CardDescription>
            إدارة إعدادات الأمان وبيانات الدخول
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Update Credentials Section */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <Key className="h-4 w-4" />
              <h3 className="text-lg font-semibold">تحديث بيانات الدخول</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="new-username">اسم المستخدم الجديد</Label>
                <Input
                  id="new-username"
                  type="text"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="أدخل اسم المستخدم الجديد"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="new-password">كلمة المرور الجديدة</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="أدخل كلمة المرور الجديدة"
                />
              </div>
              
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="confirm-password">تأكيد كلمة المرور</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="أعد كتابة كلمة المرور"
                />
              </div>
            </div>
            
            <Button 
              onClick={updateCredentials}
              disabled={loading}
              className="w-full md:w-auto"
            >
              {loading ? 'جاري التحديث...' : 'تحديث بيانات الدخول'}
            </Button>
          </div>

          <hr />

          {/* Security Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">الأمان</h3>
            
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                إدارة الجلسات النشطة وتسجيل الخروج الآمن
              </p>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  variant="outline"
                  onClick={logoutAllSessions}
                  className="flex items-center space-x-2 rtl:space-x-reverse"
                >
                  <LogOut className="h-4 w-4" />
                  <span>تسجيل الخروج من جميع الجلسات</span>
                </Button>
                
                <Button
                  variant="destructive"
                  onClick={logout}
                  className="flex items-center space-x-2 rtl:space-x-reverse"
                >
                  <LogOut className="h-4 w-4" />
                  <span>تسجيل الخروج</span>
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
