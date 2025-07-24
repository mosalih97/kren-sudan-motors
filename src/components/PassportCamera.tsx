
import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Camera, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface PassportCameraProps {
  onVerificationSuccess: () => void;
  receiptId?: string;
}

export const PassportCamera: React.FC<PassportCameraProps> = ({ onVerificationSuccess, receiptId }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{
    success: boolean;
    message: string;
    data?: any;
  } | null>(null);
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCameraClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const processPassportImage = async (file: File) => {
    if (!user) return;

    setIsProcessing(true);
    setVerificationResult(null);

    try {
      // رفع الصورة إلى Supabase Storage
      const fileName = `${user.id}/${Date.now()}-passport.jpg`;
      
      const { error: uploadError } = await supabase.storage
        .from('user-passports')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        throw uploadError;
      }

      // استدعاء Edge Function للتحقق من الجواز
      const { data: verifyData, error: verifyError } = await supabase.functions
        .invoke('verify-passport-sudan', {
          body: {
            imagePath: fileName,
            receiptId: receiptId || null
          }
        });

      if (verifyError) {
        throw verifyError;
      }

      setVerificationResult({
        success: verifyData.success,
        message: verifyData.message,
        data: verifyData
      });

      if (verifyData.success) {
        setIsVerified(true);
        toast({
          title: "تم التحقق من الجواز بنجاح",
          description: "تم حفظ بيانات الجواز بنجاح",
        });
        onVerificationSuccess();
      } else {
        setIsVerified(false);
        toast({
          variant: "destructive",
          title: "فشل التحقق من الجواز",
          description: verifyData.message,
        });
      }

    } catch (error) {
      console.error('خطأ في معالجة صورة الجواز:', error);
      
      setVerificationResult({
        success: false,
        message: "حدث خطأ أثناء معالجة صورة الجواز"
      });

      setIsVerified(false);
      toast({
        variant: "destructive",
        title: "خطأ في معالجة الصورة",
        description: "حدث خطأ أثناء معالجة صورة الجواز",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // التحقق من نوع الملف
    if (!file.type.startsWith('image/')) {
      toast({
        variant: "destructive",
        title: "نوع ملف غير صالح",
        description: "يرجى اختيار صورة صالحة",
      });
      return;
    }

    // التحقق من حجم الملف (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        variant: "destructive",
        title: "حجم الملف كبير جداً",
        description: "يرجى اختيار صورة أصغر من 10 ميجابايت",
      });
      return;
    }

    await processPassportImage(file);
  };

  return (
    <div className="space-y-4">
      <div className={`p-4 rounded-lg border ${isVerified ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
        <h3 className={`font-semibold mb-2 ${isVerified ? 'text-green-800' : 'text-red-800'}`}>
          {isVerified ? '✅ تم التحقق من الجواز' : '📋 تصوير الجواز السوداني (إجباري)'}
        </h3>
        
        {!isVerified && (
          <>
            <p className="text-sm text-red-700 mb-4">
              <strong>⚠️ خطوة إجبارية:</strong> يجب تصوير الجواز السوداني قبل رفع الإيصالات
            </p>
            
            <Alert className="mb-4 border-red-200 bg-red-50">
              <AlertDescription className="text-sm">
                <strong>تعليمات مهمة:</strong>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>تأكد من وضوح الصورة تماماً</li>
                  <li>الجواز يجب أن يكون سودانياً</li>
                  <li>يجب أن تكون جميع البيانات مقروءة</li>
                  <li>تأكد من ظهور كلمة "جمهورية السودان" أو "Republic of Sudan"</li>
                </ul>
              </AlertDescription>
            </Alert>
          </>
        )}

        {isVerified && (
          <Alert className="mb-4 border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-700">
              تم التحقق من الجواز السوداني بنجاح. يمكنك الآن رفع الإيصالات.
            </AlertDescription>
          </Alert>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileSelect}
          className="hidden"
        />

        <Button
          onClick={handleCameraClick}
          disabled={isProcessing || isVerified}
          className={`w-full text-white ${
            isVerified 
              ? 'bg-green-600 hover:bg-green-700' 
              : 'bg-red-600 hover:bg-red-700'
          }`}
        >
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              جاري المعالجة...
            </>
          ) : isVerified ? (
            <>
              <CheckCircle className="mr-2 h-4 w-4" />
              تم التحقق من الجواز
            </>
          ) : (
            <>
              <Camera className="mr-2 h-4 w-4" />
              تصوير الجواز (إجباري)
            </>
          )}
        </Button>

        {verificationResult && !isVerified && (
          <Alert className="mt-4 border-red-200 bg-red-50">
            <XCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-700">
              {verificationResult.message}
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
};
