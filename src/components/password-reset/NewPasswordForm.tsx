
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Lock, Eye, EyeOff } from "lucide-react";

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

  const validatePassword = (password: string) => {
    const errors = [];
    
    if (password.length < 8) {
      errors.push("كلمة المرور يجب أن تكون 8 أحرف على الأقل");
    }
    
    if (!/[A-Z]/.test(password)) {
      errors.push("كلمة المرور يجب أن تحتوي على حرف كبير واحد على الأقل");
    }
    
    if (!/[a-z]/.test(password)) {
      errors.push("كلمة المرور يجب أن تحتوي على حرف صغير واحد على الأقل");
    }
    
    if (!/[0-9]/.test(password)) {
      errors.push("كلمة المرور يجب أن تحتوي على رقم واحد على الأقل");
    }
    
    return errors;
  };

  const sanitizeInput = (input: string) => {
    return input.trim();
  };

  const validatePasswords = () => {
    const sanitizedPassword = sanitizeInput(password);
    const sanitizedConfirmPassword = sanitizeInput(confirmPassword);
    
    if (!sanitizedPassword || !sanitizedConfirmPassword) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال كلمة المرور وتأكيدها",
        variant: "destructive"
      });
      return false;
    }

    if (sanitizedPassword !== sanitizedConfirmPassword) {
      toast({
        title: "خطأ",
        description: "كلمتا المرور غير متطابقتين",
        variant: "destructive"
      });
      return false;
    }

    const passwordErrors = validatePassword(sanitizedPassword);
    if (passwordErrors.length > 0) {
      toast({
        title: "خطأ",
        description: passwordErrors[0],
        variant: "destructive"
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validatePasswords()) return;

    const sanitizedPassword = sanitizeInput(password);
    const sanitizedToken = sanitizeInput(token);

    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('reset_password_with_token', {
        reset_token: sanitizedToken,
        new_password: sanitizedPassword
      });

      if (error) throw error;

      const result = data as { success: boolean; message: string };
      
      if (result.success) {
        toast({
          title: "تم بنجاح",
          description: "تم تحديث كلمة المرور بنجاح",
        });
        
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
      let errorMessage = "حدث خطأ أثناء تحديث كلمة المرور";
      
      if (error?.message?.includes('token')) {
        errorMessage = "الرمز غير صحيح أو منتهي الصلاحية";
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
            maxLength={128}
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
  );
};
