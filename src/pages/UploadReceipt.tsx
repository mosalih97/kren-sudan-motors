
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Upload, Copy, Check } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const UploadReceipt = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [uploading, setUploading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [copied, setCopied] = useState(false);

  // الحصول على رقم العضوية (أول 8 أرقام من user.id)
  const membershipId = user?.id ? user.id.substring(0, 8) : '';

  const copyMembershipId = () => {
    navigator.clipboard.writeText(membershipId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: "تم النسخ",
      description: "تم نسخ رقم العضوية بنجاح",
    });
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const uploadReceipt = async () => {
    if (!selectedFile || !user) return;

    setUploading(true);
    try {
      // رفع الصورة إلى Supabase Storage
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('bank-receipts')
        .upload(fileName, selectedFile);

      if (uploadError) {
        throw uploadError;
      }

      // الحصول على رابط الصورة
      const { data: { publicUrl } } = supabase.storage
        .from('bank-receipts')
        .getPublicUrl(fileName);

      // حفظ الطلب في قاعدة البيانات
      const { error: insertError } = await supabase
        .from('receipt_submissions')
        .insert({
          user_id: user.id,
          membership_id: membershipId,
          receipt_url: publicUrl
        });

      if (insertError) {
        throw insertError;
      }

      // بدء التحقق من الإيصال
      setVerifying(true);
      const { data: verifyData, error: verifyError } = await supabase.functions
        .invoke('verify-receipt', {
          body: { imageUrl: publicUrl }
        });

      if (verifyError || verifyData?.error) {
        throw new Error(verifyData?.error || 'خطأ في التحقق من الإيصال');
      }

      toast({
        title: "تم التحقق بنجاح",
        description: "تم تفعيل الاشتراك المميز بنجاح",
      });

      navigate('/profile');

    } catch (error) {
      console.error('خطأ في رفع الإيصال:', error);
      toast({
        variant: "destructive",
        title: "خطأ في رفع الإيصال",
        description: error instanceof Error ? error.message : "حدث خطأ غير متوقع",
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
              ارفع صورة إيصال التحويل البنكي لتفعيل الاشتراك المميز
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
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
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-xs text-gray-500">
                استخدم هذا الرقم في خانة التعليق عند التحويل البنكي
              </p>
            </div>

            {/* معلومات التحويل البنكي */}
            <Alert>
              <AlertDescription>
                <div className="space-y-2 text-sm">
                  <p><strong>رقم الحساب:</strong> 0913 0368 9929 0001</p>
                  <p><strong>اسم المستفيد:</strong> محمد الامين منتصر صالح عبدالقادر</p>
                  <p><strong>المبلغ:</strong> 25000 جنيه سوداني</p>
                  <p><strong>التعليق:</strong> {membershipId}</p>
                </div>
              </AlertDescription>
            </Alert>

            {/* رفع الصورة */}
            <div className="space-y-4">
              <Label htmlFor="receipt-upload" className="text-sm font-medium text-gray-700">
                صورة إيصال التحويل
              </Label>
              
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-orange-400 transition-colors">
                <Input
                  id="receipt-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <label
                  htmlFor="receipt-upload"
                  className="cursor-pointer flex flex-col items-center space-y-2"
                >
                  <Upload className="h-8 w-8 text-gray-400" />
                  <p className="text-sm text-gray-600">
                    {selectedFile ? selectedFile.name : 'اختر صورة الإيصال'}
                  </p>
                </label>
              </div>

              {selectedFile && (
                <div className="mt-4">
                  <img
                    src={URL.createObjectURL(selectedFile)}
                    alt="معاينة الإيصال"
                    className="max-h-60 mx-auto rounded-lg shadow-md"
                  />
                </div>
              )}
            </div>

            {/* زر الرفع */}
            <Button
              onClick={uploadReceipt}
              disabled={!selectedFile || uploading || verifying}
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
                'رفع الإيصال والتحقق'
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UploadReceipt;
