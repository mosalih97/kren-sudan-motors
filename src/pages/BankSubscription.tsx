
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Upload, AlertTriangle, CheckCircle, Copy, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

const BankSubscription = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [greenReceipt, setGreenReceipt] = useState<File | null>(null);
  const [whiteReceipt, setWhiteReceipt] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [userIdDisplay, setUserIdDisplay] = useState<string>('');

  React.useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    // جلب رقم العضوية للمستخدم
    const fetchUserIdDisplay = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id_display')
        .eq('user_id', user.id)
        .single();

      if (data && !error) {
        setUserIdDisplay(data.user_id_display);
      }
    };

    fetchUserIdDisplay();
  }, [user, navigate]);

  const handleFileSelect = (file: File, type: 'green' | 'white') => {
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "حجم الملف كبير جداً",
        description: "يجب أن يكون حجم الملف أقل من 2 ميجابايت",
        variant: "destructive",
      });
      return;
    }

    if (!['image/jpeg', 'image/png', 'image/jpg'].includes(file.type)) {
      toast({
        title: "نوع ملف غير مدعوم",
        description: "يجب أن يكون الملف من نوع JPG أو PNG",
        variant: "destructive",
      });
      return;
    }

    if (type === 'green') {
      setGreenReceipt(file);
    } else {
      setWhiteReceipt(file);
    }
  };

  const copyUserIdToClipboard = () => {
    navigator.clipboard.writeText(userIdDisplay);
    toast({
      title: "تم النسخ",
      description: "تم نسخ رقم العضوية إلى الحافظة",
    });
  };

  const handleSubmit = async () => {
    if (!greenReceipt || !whiteReceipt) {
      toast({
        title: "ملفات مفقودة",
        description: "يجب رفع الإيصالين (الأخضر والأبيض)",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('greenReceipt', greenReceipt);
      formData.append('whiteReceipt', whiteReceipt);

      const { data, error } = await supabase.functions.invoke('verify-bank-receipts', {
        body: formData
      });

      if (error) {
        throw error;
      }

      if (data.success) {
        toast({
          title: "تم التفعيل بنجاح! 🎉",
          description: data.message,
        });
        
        // إعادة توجيه للصفحة الرئيسية بعد 3 ثواني
        setTimeout(() => {
          navigate('/');
        }, 3000);
      } else {
        toast({
          title: "فشل في التحقق",
          description: data.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "خطأ في النظام",
        description: "حدث خطأ أثناء التحقق من الإيصالات",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return <div>جاري التحميل...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl text-right">تفعيل الاشتراك البنكي</CardTitle>
              <CardDescription className="text-right">
                قم برفع إيصالات التحويل البنكي لتفعيل العضوية المميزة
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* عرض رقم العضوية */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="text-right">
                    <p className="text-sm text-gray-600">رقم عضويتك:</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="text-lg font-mono">
                        {userIdDisplay}
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={copyUserIdToClipboard}
                      >
                        <Copy className="h-4 w-4 ml-1" />
                        نسخ
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* التنبيه المهم */}
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="text-right">
                  <strong>⚠️ تنبيه مهم:</strong> تأكد من تحويل المبلغ الصحيح (25,000 جنيه) إلى الحساب الظاهر في الإيصالات، 
                  مع كتابة رقم عضويتك المكون من 8 أرقام ({userIdDisplay}) في خانة التعليق داخل الإيصال البنكي.
                  <br />
                  <strong>في حالة وجود خطأ في رقم الحساب أو عدم إدخال رقم العضوية في خانة التعليق، 
                  لن يتم تفعيل اشتراكك ولن تُسترد قيمة التحويل.</strong>
                </AlertDescription>
              </Alert>

              {/* بيانات الحساب المستفيد */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg text-right">بيانات الحساب المستفيد</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-right">
                  <div>
                    <span className="font-semibold">اسم المستفيد: </span>
                    <span>محمد الأمين منتصر صالح عبدالقادر</span>
                  </div>
                  <div>
                    <span className="font-semibold">رقم الحساب: </span>
                    <span className="font-mono">0913 0368 9929 0001</span>
                  </div>
                  <div>
                    <span className="font-semibold">المبلغ المطلوب: </span>
                    <span className="text-green-600 font-bold">25,000 جنيه</span>
                  </div>
                </CardContent>
              </Card>

              {/* رفع الإيصالات */}
              <div className="grid gap-4 md:grid-cols-2">
                {/* الإيصال الأخضر */}
                <Card className="border-green-200">
                  <CardHeader>
                    <CardTitle className="text-center text-green-700">الإيصال الأخضر</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0], 'green')}
                        className="hidden"
                        id="green-receipt"
                      />
                      <label
                        htmlFor="green-receipt"
                        className="cursor-pointer flex flex-col items-center justify-center h-32 border-2 border-dashed border-green-300 rounded-lg hover:bg-green-50 transition-colors"
                      >
                        {greenReceipt ? (
                          <div className="text-green-700">
                            <CheckCircle className="h-8 w-8 mx-auto mb-2" />
                            <p className="text-sm">{greenReceipt.name}</p>
                          </div>
                        ) : (
                          <div className="text-green-600">
                            <Upload className="h-8 w-8 mx-auto mb-2" />
                            <p className="text-sm">اختر الإيصال الأخضر</p>
                          </div>
                        )}
                      </label>
                    </div>
                  </CardContent>
                </Card>

                {/* الإيصال الأبيض */}
                <Card className="border-gray-200">
                  <CardHeader>
                    <CardTitle className="text-center text-gray-700">الإيصال الأبيض</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0], 'white')}
                        className="hidden"
                        id="white-receipt"
                      />
                      <label
                        htmlFor="white-receipt"
                        className="cursor-pointer flex flex-col items-center justify-center h-32 border-2 border-dashed border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        {whiteReceipt ? (
                          <div className="text-gray-700">
                            <CheckCircle className="h-8 w-8 mx-auto mb-2" />
                            <p className="text-sm">{whiteReceipt.name}</p>
                          </div>
                        ) : (
                          <div className="text-gray-600">
                            <Upload className="h-8 w-8 mx-auto mb-2" />
                            <p className="text-sm">اختر الإيصال الأبيض</p>
                          </div>
                        )}
                      </label>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* زر التفعيل */}
              <Button
                onClick={handleSubmit}
                disabled={!greenReceipt || !whiteReceipt || loading}
                className="w-full"
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    جاري التحقق من الإيصالات...
                  </>
                ) : (
                  "تفعيل الاشتراك"
                )}
              </Button>

              {/* معلومات إضافية */}
              <div className="text-sm text-gray-500 text-right space-y-1">
                <p>• الحد الأقصى لحجم الملف: 2 ميجابايت</p>
                <p>• الصيغ المدعومة: JPG, PNG</p>
                <p>• سيتم التحقق من الإيصالات خلال 30 ثانية</p>
                <p>• العضوية المميزة صالحة لمدة شهر من تاريخ التفعيل</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default BankSubscription;
