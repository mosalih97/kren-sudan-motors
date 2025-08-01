
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { validateEmail } from '@/utils/securityValidation';
import { validatePassword } from '@/utils/passwordValidation';
import { sanitizeHtml } from '@/utils/securityValidation';

export const usePasswordReset = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const requestPasswordReset = async (email: string) => {
    setLoading(true);
    try {
      // Enhanced input validation and sanitization
      const sanitizedEmail = sanitizeHtml(email.trim().toLowerCase());
      const emailValidation = validateEmail(sanitizedEmail);
      
      if (!emailValidation.isValid) {
        toast({
          title: "خطأ",
          description: emailValidation.errors[0],
          variant: "destructive"
        });
        return { success: false, message: emailValidation.errors[0] };
      }

      // Use a more specific redirect URL to ensure proper handling
      const redirectUrl = `${window.location.origin}/password-reset?mode=reset`;
      
      const { error } = await supabase.auth.resetPasswordForEmail(sanitizedEmail, {
        redirectTo: redirectUrl
      });

      if (error) {
        console.error('Password reset request error:', error);
        
        // Enhanced security logging
        try {
          await supabase.rpc('log_security_event', {
            event_type: 'password_reset_failed',
            event_data: { 
              email: sanitizedEmail, 
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
          description: "حدث خطأ أثناء إرسال الطلب",
          variant: "destructive"
        });
        
        return { success: false, message: error.message };
      }

      // Enhanced security logging for successful requests
      try {
        await supabase.rpc('log_security_event', {
          event_type: 'password_reset_requested',
          event_data: { 
            email: sanitizedEmail, 
            timestamp: new Date().toISOString(),
            ip_address: 'unknown',
            user_agent: navigator.userAgent
          }
        });
      } catch (logError) {
        console.error('Failed to log security event:', logError);
      }
      
      toast({
        title: "تم إرسال الطلب",
        description: "إذا كان البريد الإلكتروني مسجل، ستتلقى رسالة تحتوي على رابط الاستعادة",
      });
      
      return { success: true };
    } catch (error: any) {
      console.error('Password reset request error:', error);
      
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء إرسال الطلب",
        variant: "destructive"
      });
      
      return { success: false, message: error.message };
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (newPassword: string) => {
    setLoading(true);
    try {
      // Enhanced password validation
      const passwordValidation = validatePassword(newPassword);
      if (!passwordValidation.isValid) {
        toast({
          title: "خطأ في كلمة المرور",
          description: passwordValidation.errors.join(', '),
          variant: "destructive"
        });
        return { success: false, message: passwordValidation.errors.join(', ') };
      }

      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        console.error('Password reset error:', error);
        
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
        
        return { success: false, message: error.message };
      }

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
      
      return { success: true };
    } catch (error: any) {
      console.error('Password reset error:', error);
      
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تحديث كلمة المرور",
        variant: "destructive"
      });
      
      return { success: false, message: error.message };
    } finally {
      setLoading(false);
    }
  };

  return {
    requestPasswordReset,
    resetPassword,
    loading
  };
};
