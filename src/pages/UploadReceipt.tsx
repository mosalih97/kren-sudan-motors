
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Upload, AlertTriangle, CheckCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const UploadReceipt = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [uploading, setUploading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [whiteReceiptFile, setWhiteReceiptFile] = useState<File | null>(null);
  const [greenReceiptFile, setGreenReceiptFile] = useState<File | null>(null);
  const [userId, setUserId] = useState('');
  const [verificationResult, setVerificationResult] = useState<any>(null);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
    }
  }, [user, navigate]);

  const handleWhiteReceiptSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // التحقق من نوع الملف
      if (!file.type.startsWith('image/')) {
        toast({
          variant: "destructive",
          title: "خطأ",
          description: "يرجى رفع صورة صالحة فقط",
        });
        return;
      }
      
      // التحقق من حجم الملف (5MB كحد أقصى)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          variant: "destructive",
          title: "خطأ",
          description: "حجم الصورة يجب أن يكون أقل من 5MB",
        });
        return;
      }
      
      setWhiteReceiptFile(file);
    }
  };

  const handleGreenReceiptSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // التحقق من نوع الملف
      if (!file.type.startsWith('image/')) {
        toast({
          variant: "destructive",
          title: "خطأ",
          description: "يرجى رفع صورة صالحة فقط",
        });
        return;
      }
      
      // التحقق من حجم الملف (5MB كحد أقصى)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          variant: "destructive",
          title: "خطأ",
          description: "حجم الصورة يجب أن يكون أقل من 5MB",
        });
        return;
      }
      
      setGreenReceiptFile(file);
    }
  };

  const uploadAndVerifyReceipt = async () => {
    if (!whiteReceiptFile || !greenReceiptFile || !userId.trim()) {
      toast({
        variant: "destructive",
        title: "خطأ",
        description: "يرجى إدخال جميع البيانات المطلوبة",
      });
      return;
    }

    // التحقق من صحة معرف المستخدم
    if (!/^\d{8}$/.test(userId)) {
      toast({
        variant: "destructive",
        title: "خطأ",
        description: "معرف المستخدم يجب أن يكون مكون من 8 أرقام",
      });
      return;
    }

    setUploading(true);
    setVerificationResult(null);
    
    try {
      console.log('بدء رفع الإيصالات...');
      
      if (!user) {
        throw new Error('المستخدم غير مسجل الدخول');
      }

      // رفع الصورة البيضاء
      const whiteFileExt = whiteReceiptFile.name.split('.').pop();
      const whiteFileName = `${user.id}/${Date.now()}-white.${whiteFileExt}`;
      
      console.log('رفع الإيصال الأبيض:', whiteFileName);
      
      const { data: whiteUploadData, error: whiteUploadError } = await supabase.storage
        .from('bank-receipts')
        .upload(whiteFileName, whiteReceiptFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (whiteUploadError) {
        console.error('خطأ في رفع الإيصال الأبيض:', whiteUploadError);
        throw whiteUploadError;
      }

      // رفع الصورة الخضراء
      const greenFileExt = greenReceiptFile.name.split('.').pop();
      const greenFileName = `${user.id}/${Date.now()}-green.${greenFileExt}`;
      
      console.log('رفع الإيصال الأخضر:', greenFileName);
      
      const { data: greenUploadData, error: greenUploadError } = await supabase.storage
        .from('bank-receipts')
        .upload(greenFileName, greenReceiptFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (greenUploadError) {
        console.error('خطأ في رفع الإيصال الأخضر:', greenUploadError);
        throw greenUploadError;
      }

      // الحصول على روابط الصور
      const { data: whiteUrlData } = supabase.storage
        .from('bank-receipts')
        .getPublicUrl(whiteFileName);

      const { data: greenUrlData } = supabase.storage
        .from('bank-receipts')
        .getPublicUrl(greenFileName);

      const whiteImageUrl = whiteUrlData.publicUrl;
      const greenImageUrl = greenUrlData.publicUrl;

      console.log('رابط الإيصال الأبيض:', whiteImageUrl);
      console.log('رابط الإيصال الأخضر:', greenImageUrl);

      setUploading(false);
      setVerifying(true);

      // استدعاء دالة التحقق
      console.log('بدء التحقق من الإيصالات...');
      
      const { data: verifyData, error: verifyError } = await supabase.functions
        .invoke('verify-receipt', {
          body: {
            user_id: userId,
            white_image_url: whiteImageUrl,
            green_image_url: greenImageUrl
          }
        });

      console.log('نتيجة التحقق:', verifyData);
      console.log('خطأ التحقق:', verifyError);

      if (verifyError) {
        console.error('خطأ في التحقق:', verifyError);
        throw new Error('خطأ في الاتصال بخدمة التحقق');
      }

      if (verifyData?.status === 'success') {
        setVerificationResult({
          success: true,
          message: verifyData.message,
          data: verifyData.data
        });
        
        toast({
          title: "نجح التحقق",
          description: "تم التحقق من الإيصال بنجاح",
        });
      } else {
        setVerificationResult({
          success: false,
          message: verifyData?.message || 'فشل في التحقق من الإيصال'
        });
        
        toast({
          variant: "destructive",
          title: "فشل التحقق",
          description: verifyData?.message || "فشل في التحقق من الإيصال",
        });
      }

    } catch (error) {
      console.error('خطأ في رفع الإيصال:', error);
      
      let errorMessage = "حدث خطأ غير متوقع";
      
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null) {
        if ('message' in error) {
          errorMessage = String(error.message);
        } else if ('error' in error) {
          errorMessage = String(error.error);
        }
      }
      
      setVerificationResult({
        success: false,
        message: errorMessage
      });
      
      toast({
        variant: "destructive",
        title: "خطأ في رفع الإيصال",
        description: errorMessage,
      });
    } finally {
      setUploading(false);
      setVerifying(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <p className="text-center text-muted-foreground">
              يرجى تسجيل الدخول للوصول إلى هذه الصفحة
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
      <div className="max-w-2xl mx-auto">
        <Card className="shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-blue-800">
              تحقق من إيصال الدفع البنكي
            </CardTitle>
            <CardDescription className="text-gray-600">
              ارفع صورتي الإيصال الأبيض والأخضر للتحقق من الدفع
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* معرف المستخدم */}
            <div className="space-y-2">
              <Label htmlFor="user-id" className="text-sm font-medium text-gray-700">
                معرف المستخدم (8 أرقام)
              </Label>
              <Input
                id="user-id"
                type="text"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="مثال: 12345678"
                className="text-lg"
                maxLength={8}
              />
            </div>

            {/* تعليمات هامة */}
            <Alert className="border-orange-200 bg-orange-50">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2 text-sm">
                  <p className="font-bold text-orange-800">تعليمات مهمة:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>تأكد من وضوح الصور تماماً</li>
                    <li>يجب أن تحتوي الصور على رقم العملية (11 رقم)</li>
                    <li>يجب أن تحتوي على رقم الحساب: 0913036899290001</li>
                    <li>يجب أن تحتوي على التاريخ والوقت بوضوح</li>
                    <li>العملية يجب أن تكون خلال آخر 24 ساعة</li>
                  </ul>
                </div>
              </AlertDescription>
            </Alert>

            {/* رفع الإيصال الأبيض */}
            <div className="space-y-4">
              <Label htmlFor="white-receipt-upload" className="text-sm font-medium text-gray-700">
                صورة الإيصال الأبيض
              </Label>
              
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                <Input
                  id="white-receipt-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleWhiteReceiptSelect}
                  className="hidden"
                />
                <label
                  htmlFor="white-receipt-upload"
                  className="cursor-pointer flex flex-col items-center space-y-2"
                >
                  <Upload className="h-8 w-8 text-gray-600" />
                  <p className="text-sm text-gray-700">
                    {whiteReceiptFile ? whiteReceiptFile.name : 'اختر صورة الإيصال الأبيض'}
                  </p>
                </label>
              </div>

              {whiteReceiptFile && (
                <div className="mt-4">
                  <img
                    src={URL.createObjectURL(whiteReceiptFile)}
                    alt="معاينة الإيصال الأبيض"
                    className="max-h-60 mx-auto rounded-lg shadow-md"
                  />
                </div>
              )}
            </div>

            {/* رفع الإيصال الأخضر */}
            <div className="space-y-4">
              <Label htmlFor="green-receipt-upload" className="text-sm font-medium text-gray-700">
                صورة الإيصال الأخضر
              </Label>
              
              <div className="border-2 border-dashed border-green-300 rounded-lg p-6 text-center hover:border-green-400 transition-colors bg-green-50">
                <Input
                  id="green-receipt-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleGreenReceiptSelect}
                  className="hidden"
                />
                <label
                  htmlFor="green-receipt-upload"
                  className="cursor-pointer flex flex-col items-center space-y-2"
                >
                  <Upload className="h-8 w-8 text-green-600" />
                  <p className="text-sm text-green-700">
                    {greenReceiptFile ? greenReceiptFile.name : 'اختر صورة الإيصال الأخضر'}
                  </p>
                </label>
              </div>

              {greenReceiptFile && (
                <div className="mt-4">
                  <img
                    src={URL.createObjectURL(greenReceiptFile)}
                    alt="معاينة الإيصال الأخضر"
                    className="max-h-60 mx-auto rounded-lg shadow-md"
                  />
                </div>
              )}
            </div>

            {/* نتيجة التحقق */}
            {verificationResult && (
              <Alert className={verificationResult.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
                {verificationResult.success ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                )}
                <AlertDescription>
                  <div className="space-y-2">
                    <p className={`font-bold ${verificationResult.success ? 'text-green-800' : 'text-red-800'}`}>
                      {verificationResult.success ? 'نجح التحقق' : 'فشل التحقق'}
                    </p>
                    <p className="text-sm">{verificationResult.message}</p>
                    {verificationResult.success && verificationResult.data && (
                      <div className="mt-2 text-sm">
                        <p>رقم العملية: {verificationResult.data.transaction_id}</p>
                        <p>تاريخ العملية: {new Date(verificationResult.data.date_of_payment).toLocaleString('ar-EG')}</p>
                      </div>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* زر الرفع والتحقق */}
            <Button
              onClick={uploadAndVerifyReceipt}
              disabled={!whiteReceiptFile || !greenReceiptFile || !userId.trim() || uploading || verifying}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              {uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  جاري رفع الصور...
                </>
              ) : verifying ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  جاري التحقق...
                </>
              ) : (
                'رفع الصور والتحقق'
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UploadReceipt;
