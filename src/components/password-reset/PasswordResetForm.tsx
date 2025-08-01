
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { usePasswordReset } from "@/hooks/usePasswordReset";
import { useRateLimit } from "@/hooks/useRateLimit";
import { validateEmail, sanitizeHtml } from "@/utils/securityValidation";
import { Mail, AlertCircle, Clock } from "lucide-react";

export const PasswordResetForm = () => {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { requestPasswordReset, loading } = usePasswordReset();
  
  const { checkRateLimit, recordAttempt, isBlocked, attemptsLeft } = useRateLimit(
    'password_reset',
    { maxAttempts: 5, windowMinutes: 60, blockDurationMinutes: 60 }
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (loading || isBlocked) return;

    // Sanitize input
    const sanitizedEmail = sanitizeHtml(email.trim().toLowerCase());
    
    // Validate email
    const emailValidation = validateEmail(sanitizedEmail);
    if (!emailValidation.isValid) {
      console.error('Email validation failed:', emailValidation.errors);
      return;
    }

    // Check rate limit
    const canProceed = await checkRateLimit(sanitizedEmail);
    if (!canProceed) {
      return;
    }

    // Record attempt
    await recordAttempt(sanitizedEmail);

    try {
      const result = await requestPasswordReset(sanitizedEmail);
      
      if (result.success) {
        setIsSubmitted(true);
      }
    } catch (error) {
      console.error('Password reset request failed:', error);
    }
  };

  if (isSubmitted) {
    return (
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <Mail className="h-12 w-12 text-green-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">تم إرسال الطلب</h3>
          <p className="text-sm text-gray-600 mt-2">
            إذا كان البريد الإلكتروني مسجل لدينا، ستتلقى رسالة تحتوي على رابط استعادة كلمة المرور
          </p>
        </div>
      </div>
    );
  }

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
            disabled={loading || isBlocked}
            maxLength={254}
            autoComplete="email"
          />
        </div>
      </div>

      {isBlocked && (
        <div className="flex items-center gap-2 text-amber-600 text-sm">
          <Clock className="h-4 w-4" />
          <span>تم تجاوز الحد المسموح من المحاولات. يرجى المحاولة لاحقاً</span>
        </div>
      )}

      {!isBlocked && attemptsLeft < 3 && (
        <div className="flex items-center gap-2 text-amber-600 text-sm">
          <AlertCircle className="h-4 w-4" />
          <span>تبقى {attemptsLeft} محاولات</span>
        </div>
      )}

      <Button 
        type="submit" 
        className="w-full" 
        disabled={loading || isBlocked || !email.trim()}
      >
        {loading ? "جاري الإرسال..." : "إرسال رابط الاستعادة"}
      </Button>
    </form>
  );
};
