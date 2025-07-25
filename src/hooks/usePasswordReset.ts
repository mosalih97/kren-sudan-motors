
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const usePasswordReset = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const requestPasswordReset = async (email: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('create_password_reset_token', {
        user_email: email
      });

      if (error) throw error;

      const result = data as { success: boolean; message: string };
      
      if (result.success) {
        await supabase.rpc('log_security_event', {
          event_type: 'password_reset_requested',
          event_data: { email, timestamp: new Date().toISOString() }
        });
        
        toast({
          title: "تم إرسال الطلب",
          description: "إذا كان البريد الإلكتروني مسجل، ستتلقى رسالة تحتوي على رابط الاستعادة",
        });
        
        return { success: true };
      } else {
        return { success: false, message: result.message };
      }
    } catch (error: any) {
      console.error('Password reset request error:', error);
      
      await supabase.rpc('log_security_event', {
        event_type: 'password_reset_failed',
        event_data: { email, error: error.message, timestamp: new Date().toISOString() }
      });
      
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

  const resetPassword = async (token: string, newPassword: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('reset_password_with_token', {
        reset_token: token,
        new_password: newPassword
      });

      if (error) throw error;

      const result = data as { success: boolean; message: string };
      
      if (result.success) {
        toast({
          title: "تم بنجاح",
          description: "تم تحديث كلمة المرور بنجاح",
        });
        
        return { success: true };
      } else {
        throw new Error(result.message);
      }
    } catch (error: any) {
      console.error('Password reset error:', error);
      
      await supabase.rpc('log_security_event', {
        event_type: 'password_reset_failed',
        event_data: { error: error.message, timestamp: new Date().toISOString() }
      });
      
      toast({
        title: "خطأ",
        description: error.message.includes('التوكن غير صحيح') ? 
          "الرابط غير صحيح أو منتهي الصلاحية" : 
          "حدث خطأ أثناء تحديث كلمة المرور",
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
