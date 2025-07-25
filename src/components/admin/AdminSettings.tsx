
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Settings, Save, LogOut } from 'lucide-react';

interface AdminSettingsProps {
  onUpdateCredentials: (username: string, password: string) => Promise<boolean>;
  onLogout: () => void;
  onLogoutAll: () => void;
}

const AdminSettings: React.FC<AdminSettingsProps> = ({ 
  onUpdateCredentials, 
  onLogout, 
  onLogoutAll 
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleUpdateCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      alert('كلمات المرور غير متطابقة');
      return;
    }
    
    if (password.length < 6) {
      alert('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      return;
    }
    
    setLoading(true);
    await onUpdateCredentials(username, password);
    setLoading(false);
    
    // Clear form
    setUsername('');
    setPassword('');
    setConfirmPassword('');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          إعدادات المدير
        </CardTitle>
        <CardDescription>
          تحديث بيانات الدخول وإدارة الجلسات
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <form onSubmit={handleUpdateCredentials} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="new-username">اسم المستخدم الجديد</Label>
            <Input
              id="new-username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="أدخل اسم المستخدم الجديد"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="new-password">كلمة المرور الجديدة</Label>
            <Input
              id="new-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="أدخل كلمة المرور الجديدة"
              required
              minLength={6}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="confirm-password">تأكيد كلمة المرور</Label>
            <Input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="أعد كتابة كلمة المرور"
              required
              minLength={6}
            />
          </div>
          
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                جاري التحديث...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Save className="h-4 w-4" />
                تحديث البيانات
              </div>
            )}
          </Button>
        </form>

        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold mb-4">إدارة الجلسات</h3>
          <div className="space-y-3">
            <Button
              variant="outline"
              onClick={onLogout}
              className="w-full text-orange-600 border-orange-200 hover:bg-orange-50"
            >
              <LogOut className="h-4 w-4 mr-2" />
              تسجيل الخروج من هذا الجهاز
            </Button>
            
            <Button
              variant="outline"
              onClick={onLogoutAll}
              className="w-full text-red-600 border-red-200 hover:bg-red-50"
            >
              <LogOut className="h-4 w-4 mr-2" />
              تسجيل الخروج من جميع الأجهزة
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AdminSettings;
