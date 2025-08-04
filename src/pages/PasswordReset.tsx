
import { useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { PasswordResetHeader } from "@/components/password-reset/PasswordResetHeader";
import { PasswordResetForm } from "@/components/password-reset/PasswordResetForm";
import { NewPasswordForm } from "@/components/password-reset/NewPasswordForm";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const PasswordReset = () => {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [isResetMode, setIsResetMode] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const handleAuthStateChange = async () => {
      try {
        // Check if this is a password reset callback
        const accessToken = searchParams.get('access_token');
        const refreshToken = searchParams.get('refresh_token');
        const type = searchParams.get('type');
        const mode = searchParams.get('mode');

        console.log('Password reset params:', { accessToken: !!accessToken, refreshToken: !!refreshToken, type, mode });

        if (type === 'recovery' && accessToken && refreshToken) {
          // This is a password reset callback from email
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (error) {
            console.error('Session error:', error);
            toast({
              title: "خطأ",
              description: "الرابط غير صحيح أو منتهي الصلاحية",
              variant: "destructive"
            });
            setIsResetMode(false);
          } else {
            setIsResetMode(true);
          }
        } else if (mode === 'reset') {
          // Direct reset mode from URL parameter
          setIsResetMode(true);
        } else {
          // Default to request mode
          setIsResetMode(false);
        }
      } catch (error) {
        console.error('Auth state change error:', error);
        toast({
          title: "خطأ",
          description: "حدث خطأ أثناء معالجة الطلب",
          variant: "destructive"
        });
        setIsResetMode(false);
      } finally {
        setLoading(false);
      }
    };

    handleAuthStateChange();
  }, [searchParams, toast]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <PasswordResetHeader isResetMode={isResetMode} />
        
        <CardContent>
          {isResetMode ? (
            <NewPasswordForm />
          ) : (
            <PasswordResetForm />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PasswordReset;
