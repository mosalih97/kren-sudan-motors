
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Mail } from "lucide-react";
import { sanitizeEmail, isValidEmail } from "@/utils/inputSanitizer";
import { useSecurityContext } from "@/contexts/SecurityContext";

interface PasswordResetFormProps {
  onSuccess?: (email: string) => void;
}

export const PasswordResetForm = ({ onSuccess }: PasswordResetFormProps) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { logSecurityEvent } = useSecurityContext();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const sanitizedEmail = sanitizeEmail(email);
    
    if (!sanitizedEmail) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال البريد الإلكتروني",
        variant: "destructive"
      });
      return;
    }

    if (!isValidEmail(sanitizedEmail)) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال بريد إلكتروني صحيح",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // Log security event
      logSecurityEvent('password_reset_requested', {
        email: sanitizedEmail,
        timestamp: new Date().toISOString()
      });

      const { data, error } = await supabase.rpc('create_password_reset_token', {
        user_email: sanitizedEmail
      });

      if (error) throw error;

      const result = data as { success: boolean; message: string };
      
      if (result.success) {
        toast({
          title: "تم إرسال الطلب",
          description: "تم إنشاء رمز استعادة كلمة المرور بنجاح. يرجى التحقق من بريدك الإلكتروني.",
        });
        
        onSuccess?.(sanitizedEmail);
      } else {
        toast({
          title: "خطأ",
          description: result.message || "حدث خطأ غير متوقع",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      logSecurityEvent('password_reset_failed', {
        email: sanitizedEmail,
        error: error.message,
        timestamp: new Date().toISOString()
      });

      let errorMessage = "حدث خطأ أثناء إرسال الطلب";
      
      if (error?.message?.includes('email')) {
        errorMessage = "البريد الإلكتروني غير صحيح";
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
            maxLength={254}
          />
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "جاري الإرسال..." : "إرسال رابط الاستعادة"}
      </Button>
    </form>
  );
};
