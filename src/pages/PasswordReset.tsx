
import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Mail, Lock, Eye, EyeOff } from "lucide-react";

const PasswordReset = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const token = searchParams.get('token');
  const isResetMode = !!token;

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال البريد الإلكتروني",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      console.log('إرسال طلب استعادة كلمة المرور للبريد:', email);
      
      const { data, error } = await supabase.rpc('create_password_reset_token', {
        user_email: email
      });

      console.log('استجابة الطلب:', { data, error });

      if (error) {
        console.error('خطأ في الطلب:', error);
        throw error;
      }

      const result = data as { success: boolean; message: string; token?: string };
      
      if (result.success) {
        toast({
          title: "تم إرسال الطلب",
          description: "تم إنشاء رمز استعادة كلمة المرور بنجاح.",
        });
        
        // في بيئة التطوير، نعرض الرمز للمستخدم
        if (result.token) {
          const resetUrl = `${window.location.origin}/password-reset?token=${result.token}`;
          console.log('رابط الاستعادة:', resetUrl);
          
          // إظهار رابط الاستعادة في toast منفصل
          setTimeout(() => {
            toast({
              title: "رابط الاستعادة (للتجربة)",
              description: `انسخ هذا الرابط واستخدمه: ${resetUrl}`,
              duration: 15000,
            });
          }, 1000);
        }
      } else {
        toast({
          title: "خطأ",
          description: result.message || "حدث خطأ غير متوقع",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      console.error('خطأ في معالجة الطلب:', error);
      
      let errorMessage = "حدث خطأ أثناء إرسال الطلب";
      
      if (error?.message) {
        if (error.message.includes('function') && error.message.includes('does not exist')) {
          errorMessage = "خطأ في النظام. يرجى المحاولة مرة أخرى لاحقاً";
        } else if (error.message.includes('email')) {
          errorMessage = "البريد الإلكتروني غير صحيح";
        } else {
          errorMessage = error.message;
        }
      }
      
      toast({
        title: "خطأ",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password.trim() || !confirmPassword.trim()) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال كلمة المرور وتأكيدها",
        variant: "destructive"
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "خطأ",
        description: "كلمتا المرور غير متطابقتين",
        variant: "destructive"
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: "خطأ",
        description: "كلمة المرور يجب أن تكون 6 أحرف على الأقل",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      console.log('تحديث كلمة المرور باستخدام الرمز:', token);
      
      const { data, error } = await supabase.rpc('reset_password_with_token', {
        reset_token: token,
        new_password: password
      });

      console.log('استجابة تحديث كلمة المرور:', { data, error });

      if (error) {
        console.error('خطأ في تحديث كلمة المرور:', error);
        throw error;
      }

      const result = data as { success: boolean; message: string };
      
      if (result.success) {
        toast({
          title: "تم بنجاح",
          description: "تم تحديث كلمة المرور بنجاح",
        });
        
        // توجيه المستخدم لصفحة تسجيل الدخول
        setTimeout(() => {
          navigate('/auth');
        }, 2000);
      } else {
        toast({
          title: "خطأ",
          description: result.message || "حدث خطأ أثناء تحديث كلمة المرور",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      console.error('خطأ في تحديث كلمة المرور:', error);
      
      let errorMessage = "حدث خطأ أثناء تحديث كلمة المرور";
      
      if (error?.message) {
        if (error.message.includes('token')) {
          errorMessage = "الرمز غير صحيح أو منتهي الصلاحية";
        } else {
          errorMessage = error.message;
        }
      }
      
      toast({
        title: "خطأ",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/auth')}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              العودة
            </Button>
          </div>
          
          <CardTitle className="text-2xl font-bold text-center">
            {isResetMode ? "تحديث كلمة المرور" : "استعادة كلمة المرور"}
          </CardTitle>
          
          <CardDescription className="text-center">
            {isResetMode 
              ? "أدخل كلمة المرور الجديدة"
              : "أدخل بريدك الإلكتروني لاستعادة كلمة المرور"
            }
          </CardDescription>
        </CardHeader>

        <CardContent>
          {!isResetMode ? (
            <form onSubmit={handleRequestReset} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">البريد الإلكتروني</Label>
                <div className="relative">
                  <Mail className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="أدخل بريدك الإلكتروني"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pr-10"
                    required
                  />
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "جاري الإرسال..." : "إرسال رابط الاستعادة"}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">كلمة المرور الجديدة</Label>
                <div className="relative">
                  <Lock className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="أدخل كلمة المرور الجديدة"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pr-10 pl-10"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute left-1 top-1 h-8 w-8 p-0"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">تأكيد كلمة المرور</Label>
                <div className="relative">
                  <Lock className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="أدخل كلمة المرور مرة أخرى"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pr-10 pl-10"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute left-1 top-1 h-8 w-8 p-0"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "جاري التحديث..." : "تحديث كلمة المرور"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PasswordReset;
