
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Settings, Key, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import bcrypt from 'bcryptjs';

export const AdminSettingsTab: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentUsername, setCurrentUsername] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingCredentials, setLoadingCredentials] = useState(true);

  useEffect(() => {
    fetchCurrentCredentials();
  }, []);

  const fetchCurrentCredentials = async () => {
    try {
      setLoadingCredentials(true);
      const { data, error } = await supabase
        .from('admin_credentials')
        .select('username')
        .single();

      if (error) throw error;

      setCurrentUsername(data.username);
      setNewUsername(data.username);
    } catch (error) {
      console.error('Error fetching credentials:', error);
      toast({
        title: "خطأ في جلب البيانات",
        description: "حدث خطأ أثناء جلب بيانات الدخول",
        variant: "destructive"
      });
    } finally {
      setLoadingCredentials(false);
    }
  };

  const handleUpdateCredentials = async () => {
    if (!user) return;

    if (newPassword && newPassword !== confirmPassword) {
      toast({
        title: "خطأ في كلمة المرور",
        description: "كلمة المرور الجديدة غير متطابقة",
        variant: "destructive"
      });
      return;
    }

    if (newPassword && newPassword.length < 6) {
      toast({
        title: "خطأ في كلمة المرور",
        description: "كلمة المرور يجب أن تكون 6 أحرف على الأقل",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      let passwordHash = null;
      
      if (newPassword) {
        // تشفير كلمة المرور الجديدة
        const saltRounds = 10;
        passwordHash = await bcrypt.hash(newPassword, saltRounds);
      }

      const { data, error } = await supabase.rpc('update_admin_credentials', {
        admin_user_id: user.id,
        new_username: newUsername,
        new_password_hash: passwordHash || currentPassword // استخدام كلمة المرور الحالية إذا لم يتم تغييرها
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "تم التحديث بنجاح",
          description: data.message
        });
        
        // إعادة تعيين النموذج
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setCurrentUsername(newUsername);
      } else {
        toast({
          title: "خطأ في التحديث",
          description: data.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error updating credentials:', error);
      toast({
        title: "خطأ في التحديث",
        description: "حدث خطأ أثناء تحديث بيانات الدخول",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (loadingCredentials) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            إعدادات النظام
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              هنا يمكنك تحديث إعدادات النظام الأساسية
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>إجمالي المستخدمين</Label>
                <div className="p-3 bg-muted rounded-lg">
                  <div className="text-2xl font-bold">المتاح قريباً</div>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>إجمالي الإعلانات</Label>
                <div className="p-3 bg-muted rounded-lg">
                  <div className="text-2xl font-bold">المتاح قريباً</div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            تحديث بيانات الدخول
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 max-w-md">
            <div className="space-y-2">
              <Label htmlFor="current-username">اسم المستخدم الحالي</Label>
              <Input
                id="current-username"
                value={currentUsername}
                disabled
                className="bg-muted"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="new-username">اسم المستخدم الجديد</Label>
              <Input
                id="new-username"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                placeholder="أدخل اسم المستخدم الجديد"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="new-password">كلمة المرور الجديدة (اختياري)</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="أدخل كلمة المرور الجديدة"
              />
            </div>
            
            {newPassword && (
              <div className="space-y-2">
                <Label htmlFor="confirm-password">تأكيد كلمة المرور الجديدة</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="أكد كلمة المرور الجديدة"
                />
              </div>
            )}
            
            <Button 
              onClick={handleUpdateCredentials}
              disabled={loading}
              className="w-full"
            >
              <Save className="h-4 w-4 mr-2" />
              {loading ? 'جاري التحديث...' : 'حفظ التغييرات'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
