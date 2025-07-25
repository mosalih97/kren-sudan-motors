
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Eye, EyeOff, Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { validatePassword } from "@/utils/passwordValidation";
import { sanitizeInput } from "@/utils/inputSanitizer";

interface NewPasswordFormProps {
  token: string;
}

export const NewPasswordForm = ({ token }: NewPasswordFormProps) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const validatePasswords = () => {
    const sanitizedPassword = sanitizeInput(password, 128);
    const sanitizedConfirmPassword = sanitizeInput(confirmPassword, 128);
    
    if (!sanitizedPassword || !sanitizedConfirmPassword) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال كلمة المرور وتأكيدها",
        variant: "destructive"
      });
      return false;
    }

    const passwordValidation = validatePassword(sanitizedPassword);
    if (!passwordValidation.isValid) {
      toast({
        title: "خطأ في كلمة المرور",
        description: passwordValidation.errors.join(', '),
        variant: "destructive"
      });
      return false;
    }

    if (sanitizedPassword !== sanitizedConfirmPassword) {
      toast({
        title: "خطأ",
        description: "كلمات المرور غير متطابقة",
        variant: "destructive"
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validatePasswords()) {
      return;
    }

    setLoading(true);
    try {
      // استخدام Supabase Auth المدمج لتحديث كلمة المرور
      const { error } = await supabase.auth.updateUser({
        password: sanitizeInput(password, 128)
      });

      if (error) {
        console.error('Password update error:', error);
        
        // تسجيل الحدث الأمني للفشل
        try {
          await supabase.rpc('log_security_event', {
            event_type: 'password_reset_failed',
            event_data: {
              error: error.message,
              timestamp: new Date().toISOString()
            }
          });
        } catch (logError) {
          console.error('Failed to log security event:', logError);
        }

        toast({
          title: "خطأ",
          description: error.message.includes('session') ? 
            "الرابط غير صحيح أو منتهي الصلاحية" : 
            "حدث خطأ أثناء تحديث كلمة المرور",
          variant: "destructive"
        });
      } else {
        // تسجيل الحدث الأمني للنجاح
        try {
          await supabase.rpc('log_security_event', {
            event_type: 'password_reset_successful',
            event_data: {
              timestamp: new Date().toISOString()
            }
          });
        } catch (logError) {
          console.error('Failed to log security event:', logError);
        }

        toast({
          title: "تم بنجاح",
          description: "تم تحديث كلمة المرور بنجاح",
        });
        
        // التوجه إلى صفحة تسجيل الدخول
        setTimeout(() => {
          navigate('/auth');
        }, 2000);
      }
    } catch (error: any) {
      console.error('Password update error:', error);
      
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تحديث كلمة المرور",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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
            maxLength={128}
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute left-0 top-0 h-full px-3 py-2 hover:bg-transparent"
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
            placeholder="أعد إدخال كلمة المرور"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="pr-10 pl-10"
            required
            maxLength={128}
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute left-0 top-0 h-full px-3 py-2 hover:bg-transparent"
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
  );
};
