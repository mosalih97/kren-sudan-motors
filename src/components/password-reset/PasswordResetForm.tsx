
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Mail } from "lucide-react";
import { sanitizeEmail, isValidEmail } from "@/utils/inputSanitizer";

interface PasswordResetFormProps {
  onSuccess?: (email: string) => void;
}

export const PasswordResetForm = ({ onSuccess }: PasswordResetFormProps) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

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
      // استخدام Supabase Auth المدمج لإرسال رسالة استعادة كلمة المرور
      const { error } = await supabase.auth.resetPasswordForEmail(sanitizedEmail, {
        redirectTo: `${window.location.origin}/password-reset`
      });

      if (error) {
        console.error('Password reset error:', error);
        
        // تسجيل الحدث الأمني للفشل
        try {
          await supabase.rpc('log_security_event', {
            event_type: 'password_reset_failed',
            event_data: {
              email: sanitizedEmail,
              error: error.message,
              timestamp: new Date().toISOString()
            }
          });
        } catch (logError) {
          console.error('Failed to log security event:', logError);
        }

        toast({
          title: "خطأ",
          description: "حدث خطأ أثناء إرسال الطلب. يرجى المحاولة مرة أخرى",
          variant: "destructive"
        });
      } else {
        // تسجيل الحدث الأمني للنجاح
        try {
          await supabase.rpc('log_security_event', {
            event_type: 'password_reset_requested',
            event_data: {
              email: sanitizedEmail,
              timestamp: new Date().toISOString()
            }
          });
        } catch (logError) {
          console.error('Failed to log security event:', logError);
        }

        toast({
          title: "تم إرسال الطلب",
          description: "إذا كان البريد الإلكتروني مسجل في النظام، ستتلقى رسالة تحتوي على رابط لإعادة تعيين كلمة المرور",
        });
        
        onSuccess?.(sanitizedEmail);
      }
    } catch (error: any) {
      console.error('Password reset error:', error);
      
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء إرسال الطلب. يرجى المحاولة مرة أخرى",
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
