
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { Key, Save } from 'lucide-react';

const AdminSettingsTab: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [credentials, setCredentials] = useState({
    username: '',
    password: '',
    confirmPassword: ''
  });

  useEffect(() => {
    fetchCurrentUsername();
  }, []);

  const fetchCurrentUsername = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_credentials')
        .select('username')
        .single();

      if (error) throw error;
      
      setCredentials(prev => ({
        ...prev,
        username: data.username
      }));
    } catch (error) {
      console.error('Error fetching username:', error);
    }
  };

  const hashPassword = async (password: string): Promise<string> => {
    // استخدام Web Crypto API لتشفير كلمة المرور
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hash))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  };

  const updateCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!credentials.username.trim()) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال اسم المستخدم",
        variant: "destructive"
      });
      return;
    }

    if (credentials.password && credentials.password !== credentials.confirmPassword) {
      toast({
        title: "خطأ",
        description: "كلمة المرور غير متطابقة",
        variant: "destructive"
      });
      return;
    }

    if (credentials.password && credentials.password.length < 6) {
      toast({
        title: "خطأ",
        description: "كلمة المرور يجب أن تكون 6 أحرف على الأقل",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      let passwordHash = null;
      
      if (credentials.password) {
        passwordHash = await hashPassword(credentials.password);
      }

      const { data, error } = await supabase.rpc('update_admin_credentials', {
        admin_user_id: user?.id,
        new_username: credentials.username,
        new_password_hash: passwordHash || ''
      });

      if (error) throw error;

      const result = data as { success: boolean; message: string };
      
      if (result.success) {
        toast({
          title: "تم التحديث",
          description: result.message
        });
        
        setCredentials(prev => ({
          ...prev,
          password: '',
          confirmPassword: ''
        }));
      } else {
        toast({
          title: "خطأ",
          description: result.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error updating credentials:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تحديث البيانات",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="h-5 w-5" />
          إعدادات المدير
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={updateCredentials} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="username">اسم المستخدم</Label>
                <Input
                  id="username"
                  type="text"
                  value={credentials.username}
                  onChange={(e) => setCredentials(prev => ({ ...prev, username: e.target.value }))}
                  placeholder="أدخل اسم المستخدم الجديد"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="password">كلمة المرور الجديدة</Label>
                <Input
                  id="password"
                  type="password"
                  value={credentials.password}
                  onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="أدخل كلمة المرور الجديدة (اختياري)"
                  minLength={6}
                />
                <p className="text-sm text-gray-500 mt-1">
                  اتركه فارغاً إذا كنت لا تريد تغيير كلمة المرور
                </p>
              </div>
              
              <div>
                <Label htmlFor="confirmPassword">تأكيد كلمة المرور</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={credentials.confirmPassword}
                  onChange={(e) => setCredentials(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  placeholder="أعد إدخال كلمة المرور"
                  minLength={6}
                />
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <h3 className="font-medium text-yellow-800 mb-2">تحذير أمني</h3>
                <ul className="text-sm text-yellow-700 space-y-1">
                  <li>• استخدم كلمة مرور قوية تحتوي على أحرف وأرقام</li>
                  <li>• لا تشارك بيانات الدخول مع أي شخص</li>
                  <li>• قم بتغيير كلمة المرور بانتظام</li>
                  <li>• تأكد من تسجيل الخروج بعد الانتهاء</li>
                </ul>
              </div>
              
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h3 className="font-medium text-blue-800 mb-2">معلومات الدخول الحالية</h3>
                <p className="text-sm text-blue-700">
                  <strong>اسم المستخدم:</strong> {credentials.username}
                </p>
                <p className="text-sm text-blue-700 mt-1">
                  <strong>آخر تحديث:</strong> {new Date().toLocaleDateString('ar-SA')}
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end pt-4">
            <Button type="submit" disabled={loading} className="flex items-center gap-2">
              <Save className="h-4 w-4" />
              {loading ? 'جاري الحفظ...' : 'حفظ التغييرات'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default AdminSettingsTab;
