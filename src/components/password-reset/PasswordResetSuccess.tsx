
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, Clock, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { usePasswordReset } from '@/hooks/usePasswordReset';

interface PasswordResetSuccessProps {
  email: string;
  onResendCode: () => void;
}

export const PasswordResetSuccess = ({ email, onResendCode }: PasswordResetSuccessProps) => {
  const [countdown, setCountdown] = useState(60); // 60 ثانية للانتظار
  const [canResend, setCanResend] = useState(false);
  const navigate = useNavigate();
  const { requestPasswordReset, loading } = usePasswordReset();

  useEffect(() => {
    if (countdown > 0 && !canResend) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0) {
      setCanResend(true);
    }
  }, [countdown, canResend]);

  const handleResendCode = async () => {
    const result = await requestPasswordReset(email);
    if (result.success) {
      setCountdown(60);
      setCanResend(false);
      onResendCode();
    }
  };

  const handleBackToLogin = () => {
    navigate('/auth');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
            <Mail className="w-6 h-6 text-green-600 dark:text-green-400" />
          </div>
          <CardTitle className="text-2xl font-bold text-green-600 dark:text-green-400">
            تم إرسال الطلب بنجاح
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="text-center space-y-2">
            <p className="text-gray-600 dark:text-gray-300">
              تم إرسال رابط استعادة كلمة المرور إلى بريدك الإلكتروني
            </p>
            <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {email}
              </p>
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-start space-x-3 space-x-reverse">
              <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-blue-800 dark:text-blue-200 mb-1">
                  تحقق من بريدك الإلكتروني
                </p>
                <p className="text-blue-600 dark:text-blue-300">
                  قد تحتاج إلى التحقق من مجلد الرسائل غير المرغوب فيها (Spam)
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-center space-x-2 space-x-reverse text-sm text-gray-600 dark:text-gray-300">
              <Clock className="w-4 h-4" />
              <span>
                {canResend ? 
                  'يمكنك الآن إعادة إرسال الكود' : 
                  `إعادة الإرسال متاحة خلال ${countdown} ثانية`
                }
              </span>
            </div>

            <Button
              onClick={handleResendCode}
              disabled={!canResend || loading}
              variant="outline"
              className="w-full"
            >
              {loading ? 'جاري الإرسال...' : 'إرسال الكود مرة أخرى'}
            </Button>

            <Button
              onClick={handleBackToLogin}
              variant="ghost"
              className="w-full"
            >
              <ArrowRight className="w-4 h-4 ml-2" />
              العودة إلى صفحة تسجيل الدخول
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
