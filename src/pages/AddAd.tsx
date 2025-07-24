import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Upload, X, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Header } from "@/components/Header";
import { useUserPoints } from "@/hooks/useUserPoints";

const brands = [
  "تويوتا", "نيسان", "هيونداي", "كيا", "فورد", "شيفروليه", "هوندا", "مازدا",
  "BMW", "مرسيدس", "أودي", "فولكس واجن", "بيجو", "رينو", "أوبل", "سوزوكي",
  "ميتسوبيشي", "لكزس", "إنفينيتي", "جينيسيس", "أخرى"
];

const cities = [
  "الخرطوم", "الخرطوم بحري", "أمدرمان", "مدني", "كسلا", "القضارف", "بورتسودان",
  "عطبرة", "الأبيض", "نيالا", "الفاشر", "الجنينة", "زالنجي", "دمازين", "كوستي",
  "ربك", "رفاعة", "سنار", "الدويم", "أخرى"
];

export default function AddAd() {
  const [formData, setFormData] = useState({
    title: "",
    brand: "",
    model: "",
    year: "",
    price: "",
    city: "",
    condition: "",
    transmission: "",
    fuel_type: "",
    mileage: "",
    phone: "",
    whatsapp: "",
    description: ""
  });
  const [images, setImages] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: pointsData, refetch: refetchPoints } = useUserPoints();

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (images.length + files.length > 10) {
      toast.error("يمكن رفع حد أقصى 10 صور");
      return;
    }
    setImages(prev => [...prev, ...files]);
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const uploadImages = async () => {
    const uploadedUrls: string[] = [];
    
    for (const image of images) {
      const fileName = `${Math.random()}.jpg`;
      const { data, error } = await supabase.storage
        .from('car-images')
        .upload(fileName, image);
      
      if (error) {
        console.error('Error uploading image:', error);
        continue;
      }
      
      const { data: urlData } = supabase.storage
        .from('car-images')
        .getPublicUrl(fileName);
      
      uploadedUrls.push(urlData.publicUrl);
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
      toast.error("لقد تجاوزت الحد الأقصى للإعلانات الشهرية");
      return;
    }

    if (!formData.title || !formData.brand || !formData.model || !formData.price || !formData.city) {
      toast.error("يرجى ملء جميع الحقول المطلوبة");
      return;
    }

    setUploading(true);
    
    try {
      const imageUrls = await uploadImages();
      
      // First, insert the ad
      const { error: adError } = await supabase
        .from('ads')
        .insert([
          {
            title: formData.title,
            brand: formData.brand,
            model: formData.model,
            year: formData.year ? parseInt(formData.year) : null,
            price: parseInt(formData.price),
            city: formData.city,
            condition: formData.condition,
            transmission: formData.transmission,
            fuel_type: formData.fuel_type,
            mileage: formData.mileage,
            phone: formData.phone,
            whatsapp: formData.whatsapp,
            description: formData.description,
            images: imageUrls,
            user_id: user.id,
            status: 'active'
          }
        ]);

      if (adError) throw adError;

      // Then, update the monthly ads count
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          monthly_ads_count: (pointsData?.monthly_ads_count || 0) + 1
        })
        .eq('user_id', user.id);

      if (updateError) {
        console.error('Error updating monthly ads count:', updateError);
        // Don't fail the operation if this update fails
      }

      toast.success("تم إضافة الإعلان بنجاح!");
      await refetchPoints(); // Refresh points data to show updated count
      navigate('/profile');
    } catch (error) {
      console.error('Error creating ad:', error);
      toast.error("حدث خطأ أثناء إضافة الإعلان");
    } finally {
      setUploading(false);
    }
  };

  const remainingAds = (pointsData?.monthly_ads_limit || 5) - (pointsData?.monthly_ads_count || 0);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="mb-6">
            <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
              <ArrowLeft className="ml-2 h-4 w-4" />
              العودة
            </Button>
            
            <h1 className="text-3xl font-bold mb-2">إضافة إعلان جديد</h1>
            <p className="text-muted-foreground">
              الإعلانات المتبقية: {remainingAds} من {pointsData?.monthly_ads_limit || 5}
            </p>
          </div>

          {remainingAds <= 0 && (
            <Card className="mb-6 border-destructive">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-destructive">
                  <AlertCircle className="h-5 w-5" />
                  <span className="font-medium">لقد تجاوزت الحد الأقصى للإعلانات الشهرية</span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  للحصول على المزيد من الإعلانات، يرجى ترقية عضويتك أو انتظار الشهر القادم
                </p>
              </CardContent>
            </Card>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
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
                    onChange={(e) => handleChange("title", e.target.value)}
                    placeholder="مثال: تويوتا كامري 2020 فل كامل"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="brand">الماركة *</Label>
                    <Select value={formData.brand} onValueChange={(value) => handleChange("brand", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر الماركة" />
                      </SelectTrigger>
                      <SelectContent>
                        {brands.map((brand) => (
                          <SelectItem key={brand} value={brand}>
                            {brand}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="model">الموديل *</Label>
                    <Input
                      id="model"
                      value={formData.model}
                      onChange={(e) => handleChange("model", e.target.value)}
                      placeholder="مثال: كامري، كوريلا، إلنترا"
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
                      onChange={(e) => handleChange("year", e.target.value)}
                      placeholder="مثال: 2020"
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
                      onChange={(e) => handleChange("price", e.target.value)}
                      placeholder="مثال: 50000"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="city">المدينة *</Label>
                  <Select value={formData.city} onValueChange={(value) => handleChange("city", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر المدينة" />
                    </SelectTrigger>
                    <SelectContent>
                      {cities.map((city) => (
                        <SelectItem key={city} value={city}>
                          {city}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>تفاصيل السيارة</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="condition">الحالة</Label>
                    <Select value={formData.condition} onValueChange={(value) => handleChange("condition", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر الحالة" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="جديدة">جديدة</SelectItem>
                        <SelectItem value="مستعملة">مستعملة</SelectItem>
                        <SelectItem value="كالزيرو">كالزيرو</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="transmission">ناقل الحركة</Label>
                    <Select value={formData.transmission} onValueChange={(value) => handleChange("transmission", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر ناقل الحركة" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="أوتوماتيك">أوتوماتيك</SelectItem>
                        <SelectItem value="عادي">عادي</SelectItem>
                        <SelectItem value="CVT">CVT</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="fuel_type">نوع الوقود</Label>
                    <Select value={formData.fuel_type} onValueChange={(value) => handleChange("fuel_type", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر نوع الوقود" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="بنزين">بنزين</SelectItem>
                        <SelectItem value="ديزل">ديزل</SelectItem>
                        <SelectItem value="هايبرد">هايبرد</SelectItem>
                        <SelectItem value="كهربائي">كهربائي</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="mileage">المسافة المقطوعة (كم)</Label>
                    <Input
                      id="mileage"
                      value={formData.mileage}
                      onChange={(e) => handleChange("mileage", e.target.value)}
                      placeholder="مثال: 50000"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>معلومات التواصل</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="phone">رقم الهاتف</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => handleChange("phone", e.target.value)}
                      placeholder="مثال: 0123456789"
                    />
                  </div>

                  <div>
                    <Label htmlFor="whatsapp">رقم الواتساب</Label>
                    <Input
                      id="whatsapp"
                      value={formData.whatsapp}
                      onChange={(e) => handleChange("whatsapp", e.target.value)}
                      placeholder="مثال: 0123456789"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">الوصف</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleChange("description", e.target.value)}
                    placeholder="اكتب وصفاً مفصلاً للسيارة..."
                    rows={4}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>صور السيارة</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                    <Upload className="mx-auto h-12 w-12 text-muted-foreground/50" />
                    <div className="mt-4">
                      <label htmlFor="images" className="cursor-pointer">
                        <span className="text-sm font-medium text-primary hover:text-primary/80">
                          اختر الصور
                        </span>
                        <input
                          id="images"
                          type="file"
                          multiple
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                      </label>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      يمكن رفع حد أقصى 10 صور
                    </p>
                  </div>

                  {images.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {images.map((image, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={URL.createObjectURL(image)}
                            alt={`Preview ${index + 1}`}
                            className="w-full h-24 object-cover rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-4">
              <Button
                type="submit"
                disabled={uploading || remainingAds <= 0}
                className="flex-1"
              >
                {uploading ? "جاري الإضافة..." : "إضافة الإعلان"}
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate(-1)}>
                إلغاء
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
