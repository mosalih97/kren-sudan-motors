
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Header } from '@/components/Header';
import { BackButton } from '@/components/BackButton';
import { toast } from '@/hooks/use-toast';
import { Car, Upload, MapPin, Phone, MessageSquare } from 'lucide-react';

export default function AddAd() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    brand: '',
    model: '',
    year: '',
    price: '',
    mileage: '',
    fuel_type: 'بنزين',
    transmission: 'أوتوماتيك',
    condition: 'مستعملة',
    city: '',
    phone: '',
    whatsapp: '',
    description: '',
    images: [] as string[]
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({
        title: "خطأ",
        description: "يجب تسجيل الدخول لإضافة إعلان",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('ads')
        .insert({
          user_id: user.id,
          title: formData.title,
          brand: formData.brand,
          model: formData.model,
          year: formData.year ? parseInt(formData.year) : null,
          price: parseInt(formData.price),
          mileage: formData.mileage,
          fuel_type: formData.fuel_type,
          transmission: formData.transmission,
          condition: formData.condition,
          city: formData.city,
          phone: formData.phone,
          whatsapp: formData.whatsapp,
          description: formData.description,
          images: formData.images,
          status: 'active'
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "تم إضافة الإعلان بنجاح",
        description: "سيتم مراجعة الإعلان ونشره قريباً"
      });

      navigate('/profile');
    } catch (error) {
      console.error('Error adding ad:', error);
      toast({
        title: "خطأ في إضافة الإعلان",
        description: "حدث خطأ أثناء إضافة الإعلان، يرجى المحاولة مرة أخرى",
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
                <Car className="h-6 w-6 text-primary" />
                <CardTitle className="text-2xl font-bold">إضافة إعلان جديد</CardTitle>
              </div>
              <CardDescription>
                أضف تفاصيل السيارة لإنشاء إعلان جديد
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* معلومات السيارة الأساسية */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">معلومات السيارة</h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="title">عنوان الإعلان *</Label>
                    <Input
                      id="title"
                      placeholder="مثال: تويوتا كامري 2020 فل الفل"
                      value={formData.title}
                      onChange={(e) => handleInputChange('title', e.target.value)}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="brand">الماركة *</Label>
                      <Input
                        id="brand"
                        placeholder="تويوتا، هونداي، BMW..."
                        value={formData.brand}
                        onChange={(e) => handleInputChange('brand', e.target.value)}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="model">الموديل *</Label>
                      <Input
                        id="model"
                        placeholder="كامري، سوناتا، X5..."
                        value={formData.model}
                        onChange={(e) => handleInputChange('model', e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="year">سنة الصنع</Label>
                      <Input
                        id="year"
                        type="number"
                        placeholder="2020"
                        min="1990"
                        max="2024"
                        value={formData.year}
                        onChange={(e) => handleInputChange('year', e.target.value)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="price">السعر (جنيه سوداني) *</Label>
                      <Input
                        id="price"
                        type="number"
                        placeholder="50000000"
                        value={formData.price}
                        onChange={(e) => handleInputChange('price', e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="mileage">المسافة المقطوعة (كم)</Label>
                      <Input
                        id="mileage"
                        placeholder="120000"
                        value={formData.mileage}
                        onChange={(e) => handleInputChange('mileage', e.target.value)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="condition">حالة السيارة</Label>
                      <Select value={formData.condition} onValueChange={(value) => handleInputChange('condition', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="اختر حالة السيارة" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="جديدة">جديدة</SelectItem>
                          <SelectItem value="مستعملة">مستعملة</SelectItem>
                          <SelectItem value="تحتاج إصلاح">تحتاج إصلاح</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="fuel_type">نوع الوقود</Label>
                      <Select value={formData.fuel_type} onValueChange={(value) => handleInputChange('fuel_type', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="اختر نوع الوقود" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="بنزين">بنزين</SelectItem>
                          <SelectItem value="ديزل">ديزل</SelectItem>
                          <SelectItem value="هجين">هجين</SelectItem>
                          <SelectItem value="كهربائي">كهربائي</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="transmission">ناقل الحركة</Label>
                      <Select value={formData.transmission} onValueChange={(value) => handleInputChange('transmission', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="اختر ناقل الحركة" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="أوتوماتيك">أوتوماتيك</SelectItem>
                          <SelectItem value="عادي">عادي</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* معلومات الاتصال */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">معلومات الاتصال</h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="city" className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      المدينة *
                    </Label>
                    <Input
                      id="city"
                      placeholder="الخرطوم، أم درمان، بحري..."
                      value={formData.city}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        رقم الهاتف *
                      </Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="0912345678"
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="whatsapp" className="flex items-center gap-2">
                        <MessageSquare className="h-4 w-4" />
                        واتساب
                      </Label>
                      <Input
                        id="whatsapp"
                        type="tel"
                        placeholder="0912345678"
                        value={formData.whatsapp}
                        onChange={(e) => handleInputChange('whatsapp', e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* الوصف */}
                <div className="space-y-2">
                  <Label htmlFor="description">وصف السيارة</Label>
                  <Textarea
                    id="description"
                    placeholder="اكتب وصفاً مفصلاً عن السيارة، حالتها، الإضافات، وأي معلومات مهمة أخرى..."
                    rows={4}
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                  />
                </div>

                {/* الصور */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Upload className="h-4 w-4" />
                    الصور
                  </Label>
                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                    <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      اسحب الصور هنا أو انقر لاختيارها
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      يمكن إضافة حتى 8 صور بحد أقصى 5 ميجا لكل صورة
                    </p>
                  </div>
                </div>

                <Button type="submit" className="w-full" size="lg" disabled={loading}>
                  {loading ? 'جاري النشر...' : 'نشر الإعلان'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
