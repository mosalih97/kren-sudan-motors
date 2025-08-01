
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Eye, EyeOff, Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { validatePassword } from "@/utils/passwordValidation";
import { sanitizeHtml } from "@/utils/securityValidation";

export const NewPasswordForm = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const validatePasswords = () => {
    // Enhanced validation with sanitization
    const sanitizedPassword = sanitizeHtml(password);
    const sanitizedConfirmPassword = sanitizeHtml(confirmPassword);
    
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
      const sanitizedPassword = sanitizeHtml(password);
      
      const { error } = await supabase.auth.updateUser({
        password: sanitizedPassword
      });

      if (error) {
        console.error('Password update error:', error);
        
        // Enhanced security logging
        try {
          await supabase.rpc('log_security_event', {
            event_type: 'password_reset_failed',
            event_data: {
              error: error.message,
              timestamp: new Date().toISOString(),
              ip_address: 'unknown',
              user_agent: navigator.userAgent
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
        // Enhanced security logging for successful password reset
        try {
          await supabase.rpc('log_security_event', {
            event_type: 'password_reset_successful',
            event_data: {
              timestamp: new Date().toISOString(),
              ip_address: 'unknown',
              user_agent: navigator.userAgent
            }
          });
        } catch (logError) {
          console.error('Failed to log security event:', logError);
        }

        toast({
          title: "تم بنجاح",
          description: "تم تحديث كلمة المرور بنجاح",
        });
        
        // Navigate to auth page after successful reset
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
            disabled={loading}
            autoComplete="new-password"
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute left-0 top-0 h-full px-3 py-2 hover:bg-transparent"
            onClick={() => setShowPassword(!showPassword)}
            disabled={loading}
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
            disabled={loading}
            autoComplete="new-password"
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute left-0 top-0 h-full px-3 py-2 hover:bg-transparent"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            disabled={loading}
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
