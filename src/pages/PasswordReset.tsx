
import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Mail, Lock, ArrowLeft } from "lucide-react";

const PasswordReset = () => {
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"email" | "reset">("email");
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  // إذا كان هناك رمز في الرابط، انتقل مباشرة لخطوة إعادة التعيين
  useState(() => {
    if (token) {
      setStep("reset");
    }
  }, [token]);

  const handleSendReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.rpc('create_password_reset_token', {
        user_email: email
      });

      if (error) {
        toast({
          title: "خطأ",
          description: "حدث خطأ أثناء إرسال رمز الاستعادة",
          variant: "destructive"
        });
        return;
      }

      const result = data as { success: boolean; message: string };
      
      if (result.success) {
        toast({
          title: "تم إرسال رمز الاستعادة",
          description: "تحقق من بريدك الإلكتروني للحصول على رمز استعادة كلمة المرور"
        });
        setStep("reset");
      } else {
        toast({
          title: "خطأ",
          description: result.message || "البريد الإلكتروني غير مسجل",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "خطأ",
        description: "حدث خطأ غير متوقع",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast({
        title: "خطأ",
        description: "كلمتا المرور غير متطابقتان",
        variant: "destructive"
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "خطأ",
        description: "كلمة المرور يجب أن تكون 6 أحرف على الأقل",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.rpc('reset_password_with_token', {
        reset_token: token || "",
        new_password: newPassword
      });

      if (error) {
        toast({
          title: "خطأ",
          description: "حدث خطأ أثناء تحديث كلمة المرور",
          variant: "destructive"
        });
        return;
      }

      const result = data as { success: boolean; message: string };

      if (result.success) {
        toast({
          title: "تم تحديث كلمة المرور",
          description: "تم تحديث كلمة المرور بنجاح. يمكنك الآن تسجيل الدخول"
        });
        navigate("/auth");
      } else {
        toast({
          title: "خطأ",
          description: result.message || "الرمز غير صحيح أو منتهي الصلاحية",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "خطأ",
        description: "حدث خطأ غير متوقع",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto rounded-full primary-gradient flex items-center justify-center mb-4">
            <span className="text-white text-2xl font-bold">ك</span>
          </div>
          <h1 className="text-3xl font-bold text-foreground">الكرين</h1>
          <p className="text-muted-foreground mt-2">استعادة كلمة المرور</p>
        </div>

        <Card className="card-gradient border-0 shadow-xl">
          <CardHeader>
            <CardTitle className="text-center text-2xl">
              {step === "email" ? "استعادة كلمة المرور" : "تعيين كلمة مرور جديدة"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {step === "email" ? (
              <form onSubmit={handleSendReset} className="space-y-4">
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
                  {loading ? "جاري الإرسال..." : "إرسال رمز الاستعادة"}
                </Button>

                <div className="text-center">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => navigate("/auth")}
                    className="text-sm"
                  >
                    <ArrowLeft className="h-4 w-4 ml-1" />
                    العودة لتسجيل الدخول
                  </Button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="new-password">كلمة المرور الجديدة</Label>
                  <div className="relative">
                    <Lock className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="new-password"
                      type="password"
                      placeholder="أدخل كلمة المرور الجديدة"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="pr-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-password">تأكيد كلمة المرور</Label>
                  <div className="relative">
                    <Lock className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="confirm-password"
                      type="password"
                      placeholder="أعد إدخال كلمة المرور"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pr-10"
                      required
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "جاري التحديث..." : "تحديث كلمة المرور"}
                </Button>

                <div className="text-center">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => navigate("/auth")}
                    className="text-sm"
                  >
                    <ArrowLeft className="h-4 w-4 ml-1" />
                    العودة لتسجيل الدخول
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PasswordReset;
