
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Upload, Copy, Check, AlertTriangle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const UploadReceipt = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [uploading, setUploading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [greenReceiptFile, setGreenReceiptFile] = useState<File | null>(null);
  const [whiteReceiptFile, setWhiteReceiptFile] = useState<File | null>(null);
  const [copied, setCopied] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [verificationProgress, setVerificationProgress] = useState<string>('');

  const displayAccountNumber = "3689929";

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('user_id_display, display_name')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('خطأ في جلب بيانات المستخدم:', error);
      } else {
        setUserProfile(data);
      }
    };

    fetchUserProfile();
  }, [user]);

  const membershipId = userProfile?.user_id_display || '';

  const copyMembershipId = () => {
    navigator.clipboard.writeText(membershipId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: "تم النسخ",
      description: "تم نسخ رقم العضوية بنجاح",
    });
  };

  const handleGreenReceiptSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setGreenReceiptFile(file);
    }
  };

  const handleWhiteReceiptSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setWhiteReceiptFile(file);
    }
  };

  const uploadReceipt = async () => {
    if (!greenReceiptFile || !whiteReceiptFile || !user || !membershipId) {
      toast({
        variant: "destructive",
        title: "خطأ",
        description: "يرجى رفع كلا الإيصالين (الأخضر والأبيض) أولاً",
      });
      return;
    }

    setUploading(true);
    setVerificationProgress('جاري رفع الإيصالات...');
    
    try {
      console.log('بدء رفع الإيصالات...');
      
      const receiptPaths = [];

      // رفع الإيصال الأخضر
      const greenFileExt = greenReceiptFile.name.split('.').pop();
      const greenFileName = `${user.id}/${Date.now()}-${membershipId}-green.${greenFileExt}`;
      
      console.log('رفع الإيصال الأخضر:', greenFileName);
      
      const { error: greenUploadError } = await supabase.storage
        .from('bank-receipts')
        .upload(greenFileName, greenReceiptFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (greenUploadError) {
        console.error('خطأ في رفع الإيصال الأخضر:', greenUploadError);
        throw greenUploadError;
      }

      receiptPaths.push(greenFileName);
      console.log('تم رفع الإيصال الأخضر بنجاح');

      // رفع الإيصال الأبيض
      const whiteFileExt = whiteReceiptFile.name.split('.').pop();
      const whiteFileName = `${user.id}/${Date.now()}-${membershipId}-white.${whiteFileExt}`;
      
      console.log('رفع الإيصال الأبيض:', whiteFileName);
      
      const { error: whiteUploadError } = await supabase.storage
        .from('bank-receipts')
        .upload(whiteFileName, whiteReceiptFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (whiteUploadError) {
        console.error('خطأ في رفع الإيصال الأبيض:', whiteUploadError);
        throw whiteUploadError;
      }

      receiptPaths.push(whiteFileName);
      console.log('تم رفع الإيصال الأبيض بنجاح');

      // حفظ الطلب في قاعدة البيانات
      setVerificationProgress('حفظ الطلب في قاعدة البيانات...');
      console.log('حفظ الطلب في قاعدة البيانات...');
      
      const { error: insertError } = await supabase
        .from('receipt_submissions')
        .insert({
          user_id: user.id,
          membership_id: membershipId,
          receipt_url: JSON.stringify(receiptPaths)
        });

      if (insertError) {
        console.error('خطأ في حفظ الطلب:', insertError);
        throw insertError;
      }

      console.log('تم حفظ الطلب بنجاح');

      // بدء التحقق من الإيصالات
      setUploading(false);
      setVerifying(true);
      setVerificationProgress('بدء التحقق من الإيصالات...');
      console.log('بدء التحقق من الإيصالات...');
      
      let verificationSuccess = false;
      let lastError = '';

      // التحقق من الإيصال الأول
      try {
        setVerificationProgress('التحقق من الإيصال الأول...');
        console.log(`التحقق من الإيصال الأول:`, receiptPaths[0]);
        
        const { data: verifyData, error: verifyError } = await supabase.functions
          .invoke('verify-receipt', {
            body: { 
              imagePath: receiptPaths[0],
              membershipId
            }
          });

        console.log(`نتيجة التحقق من الإيصال الأول:`, verifyData);

        if (verifyData?.success) {
          verificationSuccess = true;
          setVerificationProgress('تم التحقق بنجاح من الإيصال الأول');
        } else {
          lastError = verifyData?.error || 'فشل في التحقق من الإيصال الأول';
          console.error(`خطأ في التحقق من الإيصال الأول:`, verifyData?.error);
        }
      } catch (error) {
        console.error(`خطأ في التحقق من الإيصال الأول:`, error);
        lastError = 'خطأ في الاتصال أثناء التحقق من الإيصال الأول';
      }

      // إذا لم ينجح التحقق من الإيصال الأول، جرب الثاني
      if (!verificationSuccess && receiptPaths[1]) {
        try {
          setVerificationProgress('التحقق من الإيصال الثاني...');
          console.log(`التحقق من الإيصال الثاني:`, receiptPaths[1]);
          
          const { data: verifyData, error: verifyError } = await supabase.functions
            .invoke('verify-receipt', {
              body: { 
                imagePath: receiptPaths[1],
                membershipId
              }
            });

          console.log(`نتيجة التحقق من الإيصال الثاني:`, verifyData);

          if (verifyData?.success) {
            verificationSuccess = true;
            setVerificationProgress('تم التحقق بنجاح من الإيصال الثاني');
          } else {
            lastError = verifyData?.error || 'فشل في التحقق من الإيصال الثاني';
            console.error(`خطأ في التحقق من الإيصال الثاني:`, verifyData?.error);
          }
        } catch (error) {
          console.error(`خطأ في التحقق من الإيصال الثاني:`, error);
          lastError = 'خطأ في الاتصال أثناء التحقق من الإيصال الثاني';
        }
      }

      if (verificationSuccess) {
        setVerificationProgress('تم تفعيل الاشتراك المميز بنجاح!');
        toast({
          title: "تم التحقق بنجاح",
          description: "تم تفعيل الاشتراك المميز بنجاح",
        });
        
        setTimeout(() => {
          navigate('/profile');
        }, 2000);
      } else {
        setVerificationProgress('فشل في التحقق من الإيصالات');
        toast({
          variant: "destructive",
          title: "فشل في التحقق",
          description: lastError || "لم يتم تفعيل الاشتراك المميز. يرجى التأكد من صحة الإيصالات ووضوحها",
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
      
      setVerificationProgress('فشل في العملية');
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
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 p-4">
      <div className="max-w-2xl mx-auto">
        <Card className="shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-orange-800">
              تفعيل الاشتراك المميز
            </CardTitle>
            <CardDescription className="text-gray-600">
              ارفع صورتي إيصال التحويل البنكي (الأخضر والأبيض) لتفعيل الاشتراك المميز
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
                    <p className="text-sm">{verificationProgress}</p>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* رقم العضوية */}
            <div className="space-y-2">
              <Label htmlFor="membership-id" className="text-sm font-medium text-gray-700">
                رقم العضوية المميز
              </Label>
              <div className="flex gap-2">
                <Input
                  id="membership-id"
                  value={membershipId}
                  readOnly
                  className="bg-gray-50 font-mono text-lg"
                />
                <Button
                  onClick={copyMembershipId}
                  variant="outline"
                  size="icon"
                  className="shrink-0"
                  disabled={!membershipId}
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-xs text-gray-500">
                استخدم هذا الرقم في خانة التعليق عند التحويل البنكي
              </p>
            </div>

            {/* النص التنبيهي */}
            <Alert className="border-orange-200 bg-orange-50">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2 text-sm">
                  <p className="font-bold text-orange-800">📢 تنبيه هام قبل رفع إيصال التحويل:</p>
                  <p>لضمان تفعيل اشتراكك المميز تلقائيًا في تطبيق "الكرين"، يجب اتباع التعليمات التالية بدقة:</p>
                  
                  <ol className="list-decimal list-inside space-y-1 mt-2">
                    <li>قم بالتحويل إلى رقم الحساب: <strong>{displayAccountNumber}</strong></li>
                    <li>اسم المستفيد: <strong>محمد الامين منتصر صالح عبدالقادر</strong></li>
                    <li>يجب كتابة رقم عضويتك (ID المكون من 8 أرقام) في خانة التعليق</li>
                    <li>المبلغ المطلوب: <strong>25,000 جنيه سوداني</strong></li>
                    <li>بعد التحويل، تأكد من رفع الصورتين التاليتين:</li>
                  </ol>
                  
                  <div className="bg-white p-3 rounded-md mt-2">
                    <p>✅ إيصال بنكك الأخضر</p>
                    <p>✅ إيصال بنكك الأبيض</p>
                  </div>
                  
                  <div className="mt-3">
                    <p className="font-bold text-red-600">⚠️ ملاحظات مهمة:</p>
                    <ul className="list-disc list-inside space-y-1 mt-1">
                      <li>تأكد أن الصور واضحة تمامًا وعالية الجودة</li>
                      <li>تأكد من ظهور رقم العضوية بوضوح في خانة التعليق</li>
                      <li>تأكد من ظهور رقم العملية بوضوح في الإيصال</li>
                      <li>في حال عدم وضوح الإيصال، لن يتم تفعيل الاشتراك</li>
                    </ul>
                  </div>
                </div>
              </AlertDescription>
            </Alert>

            {/* معلومات التحويل البنكي */}
            <Alert>
              <AlertDescription>
                <div className="space-y-2 text-sm">
                  <p><strong>رقم الحساب:</strong> {displayAccountNumber}</p>
                  <p><strong>اسم المستفيد:</strong> محمد الامين منتصر صالح عبدالقادر</p>
                  <p><strong>المبلغ:</strong> 25,000 جنيه سوداني</p>
                  <p><strong>التعليق:</strong> {membershipId}</p>
                </div>
              </AlertDescription>
            </Alert>

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

            {/* زر الرفع */}
            <Button
              onClick={uploadReceipt}
              disabled={!greenReceiptFile || !whiteReceiptFile || uploading || verifying || !membershipId}
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
