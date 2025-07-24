
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Upload, X, ArrowLeft, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useUserPoints } from "@/hooks/useUserPoints";
import { Header } from "@/components/Header";
import { toast } from "sonner";

const carBrands = [
  "تويوتا", "هيونداي", "نيسان", "سوزوكي", "كيا", "هوندا", "مازدا", "فولكس واجن", "شيفروليه", "فورد",
  "بي ام دبليو", "مرسيدس", "أودي", "لكزس", "إنفينيتي", "أكورا", "جاكوار", "لاند روفر", "فولفو"
];

const cities = [
  "الخرطوم", "أمدرمان", "بحري", "الجزيرة", "القضارف", "كسلا", "البحر الأحمر", "نهر النيل", "الشمالية",
  "جنوب كردفان", "شمال كردفان", "غرب كردفان", "شرق دارفور", "شمال دارفور", "جنوب دارفور", "غرب دارفور", "وسط دارفور"
];

export default function AddAd() {
  const [formData, setFormData] = useState({
    title: '',
    brand: '',
    model: '',
    year: '',
    price: '',
    city: '',
    condition: 'مستعملة',
    transmission: 'أوتوماتيك',
    fuel_type: 'بنزين',
    mileage: '',
    phone: '',
    whatsapp: '',
    description: ''
  });
  const [images, setImages] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const { user } = useAuth();
  const { data: pointsData } = useUserPoints();
  const navigate = useNavigate();

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (images.length + files.length > 5) {
      toast.error("يمكن رفع 5 صور كحد أقصى");
      return;
    }
    setImages(prev => [...prev, ...files]);
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const uploadImages = async () => {
    const uploadedUrls = [];
    
    for (const image of images) {
      const fileExt = image.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('car-images')
        .upload(fileName, image);
      
      if (uploadError) {
        console.error('Error uploading image:', uploadError);
        continue;
      }
      
      const { data: { publicUrl } } = supabase.storage
        .from('car-images')
        .getPublicUrl(fileName);
      
      uploadedUrls.push(publicUrl);
    }
    
    return uploadedUrls;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error("يجب تسجيل الدخول أولاً");
      return;
    }

    const adsUsed = pointsData?.monthly_ads_count || 0;
    const adsLimit = pointsData?.monthly_ads_limit || 5;
    
    if (adsUsed >= adsLimit) {
      toast.error("تم الوصول للحد الأقصى من الإعلانات الشهرية");
      return;
    }

    setUploading(true);
    
    try {
      const imageUrls = await uploadImages();
      
      const { error } = await supabase
        .from('ads')
        .insert([
          {
            ...formData,
            images: imageUrls,
            user_id: user.id,
            price: parseInt(formData.price),
            year: parseInt(formData.year) || null,
            status: 'active'
          }
        ]);

      if (error) {
        console.error('Error creating ad:', error);
        toast.error("حدث خطأ أثناء إنشاء الإعلان");
        return;
      }

      toast.success("تم إنشاء الإعلان بنجاح!");
      navigate('/profile');
    } catch (error) {
      console.error('Error:', error);
      toast.error("حدث خطأ أثناء إنشاء الإعلان");
    } finally {
      setUploading(false);
    }
  };

  const adsUsed = pointsData?.monthly_ads_count || 0;
  const adsLimit = pointsData?.monthly_ads_limit || 5;
  const remainingAds = adsLimit - adsUsed;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="mb-6">
            <Button 
              variant="ghost" 
              onClick={() => navigate(-1)}
              className="mb-4"
            >
              <ArrowLeft className="ml-2 h-4 w-4" />
              العودة
            </Button>
            
            <h1 className="text-3xl font-bold mb-2">أضف إعلان سيارة جديد</h1>
            <p className="text-muted-foreground">
              أضف تفاصيل سيارتك للوصول إلى آلاف المشترين المهتمين
            </p>
          </div>

          {/* معلومات الإعلانات المتبقية */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                حالة الإعلانات الشهرية
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">الإعلانات المستخدمة</p>
                  <p className="text-lg font-bold">{adsUsed}/{adsLimit}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">الإعلانات المتبقية</p>
                  <p className="text-lg font-bold text-primary">{remainingAds}</p>
                </div>
              </div>
              <div className="mt-4 bg-muted rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(adsUsed / adsLimit) * 100}%` }}
                />
              </div>
              {pointsData?.membership_type === 'premium' ? (
                <p className="text-sm text-muted-foreground mt-2">
                  العضوية المميزة: يمكنك إضافة حتى 40 إعلان شهرياً
                </p>
              ) : (
                <p className="text-sm text-muted-foreground mt-2">
                  العضوية المجانية: يمكنك إضافة حتى 5 إعلانات شهرياً
                </p>
              )}
            </CardContent>
          </Card>

          {remainingAds <= 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <AlertCircle className="w-12 h-12 mx-auto mb-4 text-destructive" />
                <p className="text-lg font-semibold mb-2">تم الوصول للحد الأقصى</p>
                <p className="text-muted-foreground mb-4">
                  لقد استخدمت جميع الإعلانات المتاحة لهذا الشهر
                </p>
                <Button asChild>
                  <a href="https://wa.me/249123456789?text=أريد%20تفعيل%20العضوية%20المميزة">
                    تفعيل العضوية المميزة
                  </a>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* معلومات أساسية */}
              <Card>
                <CardHeader>
                  <CardTitle>معلومات أساسية</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="title">عنوان الإعلان *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => handleInputChange('title', e.target.value)}
                      placeholder="مثال: تويوتا كامري 2022 - فل أوبشن"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="brand">الماركة *</Label>
                      <Select value={formData.brand} onValueChange={(value) => handleInputChange('brand', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="اختر الماركة" />
                        </SelectTrigger>
                        <SelectContent>
                          {carBrands.map(brand => (
                            <SelectItem key={brand} value={brand}>{brand}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="model">الموديل *</Label>
                      <Input
                        id="model"
                        value={formData.model}
                        onChange={(e) => handleInputChange('model', e.target.value)}
                        placeholder="مثال: كامري"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="year">سنة الصنع</Label>
                      <Input
                        id="year"
                        type="number"
                        value={formData.year}
                        onChange={(e) => handleInputChange('year', e.target.value)}
                        placeholder="2022"
                        min="1990"
                        max="2025"
                      />
                    </div>

                    <div>
                      <Label htmlFor="price">السعر (جنيه سوداني) *</Label>
                      <Input
                        id="price"
                        type="number"
                        value={formData.price}
                        onChange={(e) => handleInputChange('price', e.target.value)}
                        placeholder="150000"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="city">المدينة *</Label>
                    <Select value={formData.city} onValueChange={(value) => handleInputChange('city', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر المدينة" />
                      </SelectTrigger>
                      <SelectContent>
                        {cities.map(city => (
                          <SelectItem key={city} value={city}>{city}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* تفاصيل السيارة */}
              <Card>
                <CardHeader>
                  <CardTitle>تفاصيل السيارة</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="condition">حالة السيارة</Label>
                      <Select value={formData.condition} onValueChange={(value) => handleInputChange('condition', value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="جديدة">جديدة</SelectItem>
                          <SelectItem value="مستعملة">مستعملة</SelectItem>
                          <SelectItem value="تحتاج إصلاح">تحتاج إصلاح</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="transmission">ناقل الحركة</Label>
                      <Select value={formData.transmission} onValueChange={(value) => handleInputChange('transmission', value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="أوتوماتيك">أوتوماتيك</SelectItem>
                          <SelectItem value="عادي">عادي</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="fuel_type">نوع الوقود</Label>
                      <Select value={formData.fuel_type} onValueChange={(value) => handleInputChange('fuel_type', value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="بنزين">بنزين</SelectItem>
                          <SelectItem value="ديزل">ديزل</SelectItem>
                          <SelectItem value="هجين">هجين</SelectItem>
                          <SelectItem value="كهربائي">كهربائي</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="mileage">المسافة المقطوعة (كم)</Label>
                      <Input
                        id="mileage"
                        value={formData.mileage}
                        onChange={(e) => handleInputChange('mileage', e.target.value)}
                        placeholder="50000"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="description">وصف السيارة</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      placeholder="اكتب وصفاً مفصلاً عن حالة السيارة والمعلومات الإضافية..."
                      rows={4}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* معلومات الاتصال */}
              <Card>
                <CardHeader>
                  <CardTitle>معلومات الاتصال</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="phone">رقم الهاتف</Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        placeholder="0123456789"
                      />
                    </div>

                    <div>
                      <Label htmlFor="whatsapp">رقم الواتساب</Label>
                      <Input
                        id="whatsapp"
                        value={formData.whatsapp}
                        onChange={(e) => handleInputChange('whatsapp', e.target.value)}
                        placeholder="0123456789"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* رفع الصور */}
              <Card>
                <CardHeader>
                  <CardTitle>صور السيارة</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="images">اختر الصور (حد أقصى 5 صور)</Label>
                      <Input
                        id="images"
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleImageUpload}
                        className="mt-2"
                      />
                    </div>

                    {images.length > 0 && (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {images.map((image, index) => (
                          <div key={index} className="relative">
                            <img
                              src={URL.createObjectURL(image)}
                              alt={`Preview ${index + 1}`}
                              className="w-full h-32 object-cover rounded-lg"
                            />
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                              onClick={() => removeImage(index)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={uploading || remainingAds <= 0}
              >
                {uploading ? "جاري النشر..." : "نشر الإعلان"}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
