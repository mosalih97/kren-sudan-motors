
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Mail } from "lucide-react";

interface PasswordResetFormProps {
  onSuccess?: (email: string) => void;
}

export const PasswordResetForm = ({ onSuccess }: PasswordResetFormProps) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
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
      const { data, error } = await supabase.rpc('create_password_reset_token', {
        user_email: email
      });

      if (error) throw error;

      const result = data as { success: boolean; message: string; token?: string };
      
      if (result.success) {
        toast({
          title: "تم إرسال الطلب",
          description: "تم إنشاء رمز استعادة كلمة المرور بنجاح.",
        });
        
        // في بيئة التطوير، نعرض الرمز للمستخدم
        if (result.token) {
          const resetUrl = `${window.location.origin}/password-reset?token=${result.token}`;
          
          setTimeout(() => {
            toast({
              title: "رابط الاستعادة (للتجربة)",
              description: `انسخ هذا الرابط: ${resetUrl}`,
              duration: 20000,
            });
          }, 1000);
        }
        
        onSuccess?.(email);
      } else {
        toast({
          title: "خطأ",
          description: result.message || "حدث خطأ غير متوقع",
          variant: "destructive"
        });
      }
    } catch (error: any) {
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
          />
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "جاري الإرسال..." : "إرسال رابط الاستعادة"}
      </Button>
    </form>
  );
};
