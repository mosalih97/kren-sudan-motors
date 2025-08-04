
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/Header';
import { BackButton } from '@/components/BackButton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { Upload, Receipt, Calendar, FileText, AlertCircle } from 'lucide-react';

export default function UploadReceipt() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    membershipId: '',
    transactionNumber: '',
    receiptDate: '',
    receiptFile: null as File | null
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "حجم الملف كبير",
          description: "يرجى اختيار صورة أصغر من 5 ميجابايت",
          variant: "destructive"
        });
        return;
      }
      setFormData(prev => ({ ...prev, receiptFile: file }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({
        title: "خطأ",
        description: "يجب تسجيل الدخول لرفع الإيصال",
        variant: "destructive"
      });
      return;
    }

    if (!formData.receiptFile) {
      toast({
        title: "ملف مطلوب",
        description: "يرجى اختيار صورة الإيصال",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // رفع الملف إلى Supabase Storage
      const fileExt = formData.receiptFile.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('bank-receipts')
        .upload(fileName, formData.receiptFile);

      if (uploadError) throw uploadError;

      // الحصول على URL الملف
      const { data: { publicUrl } } = supabase.storage
        .from('bank-receipts')
        .getPublicUrl(fileName);

      // حفظ بيانات الإيصال في قاعدة البيانات
      const { error } = await supabase
        .from('receipt_submissions')
        .insert({
          user_id: user.id,
          membership_id: formData.membershipId,
          transaction_number: formData.transactionNumber,
          receipt_date: formData.receiptDate,
          receipt_url: publicUrl,
          status: 'pending'
        });

      if (error) throw error;

      toast({
        title: "تم رفع الإيصال بنجاح",
        description: "سيتم مراجعة الإيصال وتفعيل العضوية خلال 24 ساعة"
      });

      navigate('/profile');
    } catch (error) {
      console.error('Error uploading receipt:', error);
      toast({
        title: "خطأ في رفع الإيصال",
        description: "حدث خطأ أثناء رفع الإيصال، يرجى المحاولة مرة أخرى",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <BackButton />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Card className="card-gradient border-0 shadow-lg">
            <CardHeader className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Receipt className="h-6 w-6 text-primary" />
                <CardTitle className="text-2xl font-bold">رفع إيصال الدفع</CardTitle>
              </div>
              <CardDescription>
                قم برفع إيصال دفع العضوية المميزة لتفعيل حسابك
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-6">
                {/* تعليمات الدفع */}
                <Card className="bg-primary/5 border-primary/20">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-semibold mb-2">معلومات الدفع</h4>
                        <div className="space-y-1 text-sm">
                          <p><strong>البنك:</strong> بنك فيصل الإسلامي</p>
                          <p><strong>رقم الحساب:</strong> 1234567890</p>
                          <p><strong>قيمة العضوية المميزة:</strong> 15,000 جنيه سوداني شهرياً</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* نموذج رفع الإيصال */}
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="membershipId" className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      رقم العضوية *
                    </Label>
                    <Input
                      id="membershipId"
                      placeholder="أدخل رقم عضويتك"
                      value={formData.membershipId}
                      onChange={(e) => handleInputChange('membershipId', e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="transactionNumber" className="flex items-center gap-2">
                      <Receipt className="h-4 w-4" />
                      رقم المعاملة *
                    </Label>
                    <Input
                      id="transactionNumber"
                      placeholder="أدخل رقم المعاملة من الإيصال"
                      value={formData.transactionNumber}
                      onChange={(e) => handleInputChange('transactionNumber', e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="receiptDate" className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      تاريخ الدفع *
                    </Label>
                    <Input
                      id="receiptDate"
                      type="date"
                      value={formData.receiptDate}
                      onChange={(e) => handleInputChange('receiptDate', e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="receiptFile" className="flex items-center gap-2">
                      <Upload className="h-4 w-4" />
                      صورة الإيصال *
                    </Label>
                    <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                      <input
                        id="receiptFile"
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                      <label htmlFor="receiptFile" className="cursor-pointer">
                        <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                        {formData.receiptFile ? (
                          <div>
                            <p className="text-sm font-medium">{formData.receiptFile.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {(formData.receiptFile.size / 1024 / 1024).toFixed(2)} ميجابايت
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p className="text-sm text-muted-foreground">
                              اسحب صورة الإيصال هنا أو انقر لاختيارها
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              حد أقصى 5 ميجابايت - JPG, PNG, PDF
                            </p>
                          </div>
                        )}
                      </label>
                    </div>
                  </div>

                  <Button type="submit" className="w-full" size="lg" disabled={loading}>
                    {loading ? 'جاري رفع الإيصال...' : 'رفع الإيصال'}
                  </Button>
                </form>

                {/* ملاحظات إضافية */}
                <Card className="bg-muted/30">
                  <CardContent className="p-4">
                    <h4 className="font-semibold mb-2">ملاحظات مهمة:</h4>
                    <ul className="text-sm space-y-1 text-muted-foreground">
                      <li>• تأكد من وضوح جميع التفاصيل في صورة الإيصال</li>
                      <li>• سيتم مراجعة الإيصال خلال 24 ساعة كحد أقصى</li>
                      <li>• ستصلك إشعارات بحالة المراجعة على بريدك الإلكتروني</li>
                      <li>• في حالة الرفض، يمكنك إعادة الإرسال مع تصحيح البيانات</li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
