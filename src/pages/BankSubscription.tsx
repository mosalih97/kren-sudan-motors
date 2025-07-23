
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Header } from "@/components/Header";
import { Upload, CreditCard, Shield, CheckCircle, Clock } from "lucide-react";

export default function BankSubscription() {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      const imageUrls: string[] = [];
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileExt = file.name.split('.').pop();
        const fileName = `${user?.id}/${Date.now()}-${i}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('bank-receipts')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('bank-receipts')
          .getPublicUrl(fileName);

        imageUrls.push(publicUrl);
      }

      setUploadedImages(imageUrls);
      toast.success("تم رفع الإيصالات بنجاح!");
    } catch (error) {
      console.error('Upload error:', error);
      toast.error("حدث خطأ أثناء رفع الإيصالات");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (uploadedImages.length === 0) {
      toast.error("يرجى رفع الإيصالات أولاً");
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('verify-bank-receipts', {
        body: { imageUrls: uploadedImages }
      });

      if (error) throw error;

      if (data.success) {
        toast.success("تم إرسال الإيصالات للمراجعة بنجاح!");
        setUploadedImages([]);
      } else {
        toast.error(data.message || "حدث خطأ أثناء معالجة الإيصالات");
      }
    } catch (error) {
      console.error('Verification error:', error);
      toast.error("حدث خطأ أثناء التحقق من الإيصالات");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Card className="card-gradient border-0 shadow-lg">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <CreditCard className="h-16 w-16 text-primary" />
              </div>
              <CardTitle className="text-2xl font-bold">تفعيل العضوية المميزة</CardTitle>
              <CardDescription>
                ارفع إيصال التحويل البنكي لتفعيل العضوية المميزة
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* بيانات التحويل */}
              <div className="bg-muted/50 p-6 rounded-lg">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  بيانات التحويل البنكي
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">اسم البنك:</span>
                    <span className="font-medium">بنك الخرطوم</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">رقم الحساب:</span>
                    <span className="font-medium">1234567890</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">اسم المستفيد:</span>
                    <span className="font-medium">شركة كارز سودان</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">المبلغ:</span>
                    <span className="font-medium text-primary">1000 جنيه سوداني</span>
                  </div>
                </div>
              </div>

              {/* رفع الإيصالات */}
              <div className="space-y-4">
                <Label htmlFor="receipt-upload" className="text-base font-medium">
                  رفع إيصال التحويل
                </Label>
                
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                  <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground mb-4">
                    اسحب واسقط الإيصالات هنا أو انقر لاختيار الملفات
                  </p>
                  <Input
                    id="receipt-upload"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileUpload}
                    disabled={uploading}
                    className="max-w-xs mx-auto"
                  />
                </div>

                {uploadedImages.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      تم رفع {uploadedImages.length} إيصال(ات)
                    </p>
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle className="h-4 w-4" />
                      <span className="text-sm">جاهز للإرسال</span>
                    </div>
                  </div>
                )}
              </div>

              {/* مزايا العضوية */}
              <div className="bg-primary/5 p-6 rounded-lg">
                <h3 className="font-semibold mb-4 text-primary">مزايا العضوية المميزة</h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>130 نقطة تعزيز شهرياً</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>إعلانات مميزة تظهر في المقدمة</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>عرض معلومات الاتصال مجاناً</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>حتى 40 إعلان شهرياً</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>دعم فني مخصص</span>
                  </li>
                </ul>
              </div>

              {/* أزرار التحكم */}
              <div className="flex gap-3">
                <Button
                  onClick={handleSubmit}
                  disabled={uploading || uploadedImages.length === 0}
                  className="flex-1"
                >
                  {uploading ? (
                    <>
                      <Clock className="h-4 w-4 mr-2 animate-spin" />
                      جاري الرفع...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      إرسال للمراجعة
                    </>
                  )}
                </Button>
              </div>

              {/* معلومات إضافية */}
              <div className="text-center text-sm text-muted-foreground">
                <p>سيتم مراجعة الإيصال خلال 24 ساعة</p>
                <p>وسيتم تفعيل العضوية المميزة فور التأكد من التحويل</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
