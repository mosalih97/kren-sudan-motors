
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Upload, AlertTriangle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const UploadReceipt = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [uploading, setUploading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [whiteReceiptFile, setWhiteReceiptFile] = useState<File | null>(null);
  const [greenReceiptFile, setGreenReceiptFile] = useState<File | null>(null);
  const [userId, setUserId] = useState('');

  const handleWhiteReceiptSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setWhiteReceiptFile(file);
    }
  };

  const handleGreenReceiptSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setGreenReceiptFile(file);
    }
  };

  const uploadAndVerifyReceipts = async () => {
    if (!whiteReceiptFile || !greenReceiptFile || !userId || !user) {
      toast({
        variant: "destructive",
        title: "خطأ",
        description: "يرجى رفع الإيصالين وإدخال رقم المستخدم",
      });
      return;
    }

    setUploading(true);
    
    try {
      console.log('بدء رفع الإيصالات...');
      
      // رفع الإيصال الأبيض
      const whiteFileExt = whiteReceiptFile.name.split('.').pop();
      const whiteFileName = `${user.id}/${Date.now()}-white.${whiteFileExt}`;
      
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

      // رفع الإيصال الأخضر
      const greenFileExt = greenReceiptFile.name.split('.').pop();
      const greenFileName = `${user.id}/${Date.now()}-green.${greenFileExt}`;
      
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

      // الحصول على الروابط العامة
      const { data: whiteUrlData } = supabase.storage
        .from('bank-receipts')
        .getPublicUrl(whiteFileName);

      const { data: greenUrlData } = supabase.storage
        .from('bank-receipts')
        .getPublicUrl(greenFileName);

      console.log('تم رفع الإيصالات بنجاح');
      setUploading(false);
      setVerifying(true);

      // التحقق من الإيصالات
      console.log('بدء التحقق من الإيصالات...');
      
      const { data: verifyData, error: verifyError } = await supabase.functions
        .invoke('verify-receipt', {
          body: { 
            user_id: userId,
            white_image_url: whiteUrlData.publicUrl,
            green_image_url: greenUrlData.publicUrl
          }
        });

      console.log('نتيجة التحقق:', verifyData);

      if (verifyError) {
        console.error('خطأ في التحقق:', verifyError);
        throw verifyError;
      }

      if (verifyData?.status === 'success') {
        toast({
          title: "تم التحقق بنجاح",
          description: "تم التحقق من الإيصالات وتسجيل الدفع بنجاح",
        });
        
        setTimeout(() => {
          navigate('/profile');
        }, 2000);
      } else {
        toast({
          variant: "destructive",
          title: "فشل في التحقق",
          description: verifyData?.error || "فشل في التحقق من الإيصالات",
        });
      }

    } catch (error) {
      console.error('خطأ في العملية:', error);
      
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
      
      toast({
        variant: "destructive",
        title: "خطأ في العملية",
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
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 p-4">
      <div className="max-w-2xl mx-auto">
        <Card className="shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-orange-800">
              رفع إيصال الدفع
            </CardTitle>
            <CardDescription className="text-gray-600">
              ارفع صورتي إيصال التحويل البنكي (الأبيض والأخضر) للتحقق من صحة الدفع
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* عرض تقدم العملية */}
            {(uploading || verifying) && (
              <Alert className="border-blue-200 bg-blue-50">
                <Loader2 className="h-4 w-4 animate-spin" />
                <AlertDescription>
                  <div className="space-y-2">
                    <p className="font-bold text-blue-800">جاري المعالجة...</p>
                    <p className="text-sm">
                      {uploading ? 'جاري رفع الإيصالات...' : 'جاري التحقق من الإيصالات...'}
                    </p>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* رقم المستخدم */}
            <div className="space-y-2">
              <Label htmlFor="user-id" className="text-sm font-medium text-gray-700">
                رقم المستخدم (8 أرقام)
              </Label>
              <Input
                id="user-id"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="أدخل رقم المستخدم المكون من 8 أرقام"
                className="font-mono text-lg"
                maxLength={8}
              />
            </div>

            {/* النص التنبيهي */}
            <Alert className="border-orange-200 bg-orange-50">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2 text-sm">
                  <p className="font-bold text-orange-800">📢 متطلبات التحقق:</p>
                  <ul className="list-disc list-inside space-y-1 mt-2">
                    <li>رقم الحساب يجب أن يكون: <strong>0913036899290001</strong></li>
                    <li>العملية يجب أن تكون خلال آخر 24 ساعة</li>
                    <li>رقم العملية يجب أن يكون مكون من 11 رقم</li>
                    <li>الصور يجب أن تكون واضحة وعالية الجودة</li>
                  </ul>
                </div>
              </AlertDescription>
            </Alert>

            {/* رفع الإيصال الأبيض */}
            <div className="space-y-4">
              <Label htmlFor="white-receipt-upload" className="text-sm font-medium text-gray-700">
                صورة الإيصال الأبيض
              </Label>
              
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors bg-gray-50">
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

            {/* زر الرفع */}
            <Button
              onClick={uploadAndVerifyReceipts}
              disabled={!whiteReceiptFile || !greenReceiptFile || !userId || uploading || verifying}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white"
            >
              {uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  جاري الرفع...
                </>
              ) : verifying ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  جاري التحقق...
                </>
              ) : (
                'رفع الإيصالات والتحقق'
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UploadReceipt;
