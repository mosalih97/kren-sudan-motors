
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings, Save, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export const AdminSettingsTab = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [credentials, setCredentials] = useState({
    username: "",
    password: ""
  });

  useEffect(() => {
    fetchCurrentCredentials();
  }, []);

  const fetchCurrentCredentials = async () => {
    try {
      const { data, error } = await supabase
        .from("admin_credentials")
        .select("username")
        .single();

      if (error) throw error;
      
      setCredentials(prev => ({
        ...prev,
        username: data.username
      }));
    } catch (error) {
      console.error("Error fetching credentials:", error);
      toast.error("فشل في جلب بيانات الدخول");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!credentials.username || !credentials.password) {
      toast.error("يرجى ملء جميع الحقول");
      return;
    }

    if (credentials.password.length < 6) {
      toast.error("كلمة المرور يجب أن تكون 6 أحرف على الأقل");
      return;
    }

    setLoading(true);
    try {
      // Hash the password (in a real app, this should be done server-side)
      const bcrypt = await import('bcryptjs');
      const hashedPassword = await bcrypt.hash(credentials.password, 10);

      const { data, error } = await supabase.rpc('update_admin_credentials', {
        admin_user_id: user?.id,
        new_username: credentials.username,
        new_password_hash: hashedPassword
      });

      if (error) throw error;

      if (data?.success) {
        toast.success("تم تحديث بيانات الدخول بنجاح");
        setCredentials(prev => ({ ...prev, password: "" }));
      } else {
        toast.error(data?.message || "فشل في تحديث بيانات الدخول");
      }
    } catch (error) {
      console.error("Error updating credentials:", error);
      toast.error("حدث خطأ أثناء تحديث بيانات الدخول");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          إعدادات المدير
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">اسم المستخدم</Label>
            <Input
              id="username"
              type="text"
              value={credentials.username}
              onChange={(e) => setCredentials(prev => ({ ...prev, username: e.target.value }))}
              placeholder="اسم المستخدم"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password">كلمة المرور الجديدة</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={credentials.password}
                onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
                placeholder="كلمة المرور الجديدة"
                required
                minLength={6}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute left-2 top-1/2 transform -translate-y-1/2"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "جاري الحفظ..." : (
              <>
                <Save className="h-4 w-4 ml-2" />
                حفظ التغييرات
              </>
            )}
          </Button>
        </form>
        
        <div className="mt-6 p-4 bg-muted/50 rounded-lg">
          <h4 className="font-medium mb-2">ملاحظات أمنية:</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• يتم تشفير كلمة المرور قبل حفظها</li>
            <li>• تأكد من استخدام كلمة مرور قوية</li>
            <li>• لا تشارك بيانات الدخول مع أي شخص</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
