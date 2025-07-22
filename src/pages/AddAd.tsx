import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { User, Session } from "@supabase/supabase-js";
import { Car, Upload, Phone, MapPin, Calendar, Gauge, Fuel, Settings, FileImage, X } from "lucide-react";

const AddAd = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Form state
  const [adData, setAdData] = useState({
    title: "",
    description: "",
    brand: "",
    model: "",
    year: "",
    price: "",
    city: "",
    phone: "",
    whatsapp: "",
    mileage: "",
    fuelType: "بنزين",
    transmission: "أوتوماتيك",
    condition: "مستعملة"
  });

  const [images, setImages] = useState<string[]>([]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (!session?.user) {
          navigate("/auth");
        } else {
          fetchUserProfile(session.user.id);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (!session?.user) {
        navigate("/auth");
      } else {
        fetchUserProfile(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const handleImageAdd = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = true;
    input.onchange = async (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (files && user) {
        setLoading(true);
        try {
          const uploadPromises = Array.from(files).map(async (file) => {
            const fileExt = file.name.split('.').pop();
            const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
            
            const { data, error } = await supabase.storage
              .from('car-images')
              .upload(fileName, file);
            
            if (error) throw error;
            
            const { data: { publicUrl } } = supabase.storage
              .from('car-images')
              .getPublicUrl(fileName);
            
            return publicUrl;
          });
          
          const uploadedUrls = await Promise.all(uploadPromises);
          setImages([...images, ...uploadedUrls]);
          toast({
            title: "تم تحميل الصور بنجاح",
            description: `تم تحميل ${uploadedUrls.length} صورة`,
          });
        } catch (error) {
          console.error('Error uploading images:', error);
          toast({
            title: "خطأ في تحميل الصور",
            description: "حدث خطأ أثناء تحميل الصور",
            variant: "destructive",
          });
        } finally {
          setLoading(false);
        }
      }
    };
    input.click();
  };

  const handleImageRemove = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile) return;

    // التحقق من تقييد الإعلانات للمستخدمين العاديين
    if (profile.membership_type === 'free' && profile.monthly_ads_count >= 5) {
      toast({
        title: "وصلت للحد الأقصى",
        description: "يمكن للمستخدمين العاديين إضافة 5 إعلانات شهرياً فقط. قم بترقية عضويتك للمزيد",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    
    try {
      // تحديث عدد الإعلانات الشهرية
      await supabase
        .from('profiles')
        .update({ 
          monthly_ads_count: (profile.monthly_ads_count || 0) + 1 
        })
        .eq('user_id', user.id);
      const { error } = await supabase
        .from("ads")
        .insert({
          user_id: user.id,
          title: adData.title,
          description: adData.description,
          brand: adData.brand,
          model: adData.model,
          year: parseInt(adData.year),
          price: parseInt(adData.price),
          city: adData.city,
          phone: adData.phone,
          whatsapp: adData.whatsapp,
          mileage: adData.mileage,
          fuel_type: adData.fuelType,
          transmission: adData.transmission,
          condition: adData.condition,
          images: images,
          status: "active"
        });

      if (error) throw error;

      toast({
        title: "تم نشر الإعلان بنجاح",
        description: "تم نشر إعلانك وهو الآن متاح للعرض"
      });

      navigate("/profile");
    } catch (error) {
      console.error("Error creating ad:", error);
      toast({
        title: "خطأ في نشر الإعلان",
        description: "حدث خطأ أثناء نشر الإعلان، حاول مرة أخرى",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return null; // Will redirect to auth
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Card className="card-gradient border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-2xl">
                <div className="w-10 h-10 rounded-lg primary-gradient flex items-center justify-center">
                  <Car className="h-5 w-5 text-white" />
                </div>
                أضف إعلان سيارة جديد
              </CardTitle>
              <p className="text-muted-foreground">
                أضف تفاصيل سيارتك للوصول إلى آلاف المشترين المهتمين
              </p>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* معلومات العضوية والإعلانات */}
              {profile && (
                <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">نوع العضوية:</span>
                      <Badge variant={profile.membership_type === 'premium' ? 'premium' : 'default'}>
                        {profile.membership_type === 'premium' ? 'مميز' : 'عادي'}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <span className="font-medium text-primary">{profile.points || 0}</span> نقطة
                    </div>
                  </div>
                  
                  {profile.membership_type === 'free' && (
                    <div className="bg-background rounded-md p-3 border border-warning/20">
                      <div className="text-sm">
                        <span className="text-muted-foreground">الإعلانات المتاحة هذا الشهر: </span>
                        <span className="font-medium text-primary">
                          {Math.max(0, 5 - (profile.monthly_ads_count || 0))} من 5
                        </span>
                      </div>
                      {(profile.monthly_ads_count || 0) >= 5 && (
                        <p className="text-warning text-xs mt-1">
                          وصلت للحد الأقصى من الإعلانات هذا الشهر. قم بترقية عضويتك للمزيد.
                        </p>
                      )}
                    </div>
                  )}
                  
                  {profile.membership_type === 'premium' && (
                    <div className="bg-primary/10 rounded-md p-3 border border-primary/20">
                      <p className="text-sm text-primary">
                        🎉 عضوية مميزة: إعلانات غير محدودة + عرض مجاني لمعلومات التواصل
                      </p>
                    </div>
                  )}
                </div>
              )}
              
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* العنوان والوصف */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">معلومات أساسية</h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="title">عنوان الإعلان *</Label>
                    <Input
                      id="title"
                      placeholder="مثال: تويوتا كامري 2022 - فل أوبشن"
                      value={adData.title}
                      onChange={(e) => setAdData({...adData, title: e.target.value})}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">وصف السيارة</Label>
                    <Textarea
                      id="description"
                      placeholder="اكتب وصفاً مفصلاً عن حالة السيارة والمميزات..."
                      value={adData.description}
                      onChange={(e) => setAdData({...adData, description: e.target.value})}
                      rows={4}
                    />
                  </div>
                </div>

                {/* تفاصيل السيارة */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">تفاصيل السيارة</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="brand">الماركة *</Label>
                      <Input
                        id="brand"
                        placeholder="تويوتا، نيسان، هوندا..."
                        value={adData.brand}
                        onChange={(e) => setAdData({...adData, brand: e.target.value})}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="model">الموديل *</Label>
                      <Input
                        id="model"
                        placeholder="كامري، التيما، أكورد..."
                        value={adData.model}
                        onChange={(e) => setAdData({...adData, model: e.target.value})}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="year">سنة الصنع</Label>
                      <div className="relative">
                        <Calendar className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="year"
                          type="number"
                          placeholder="2020"
                          value={adData.year}
                          onChange={(e) => setAdData({...adData, year: e.target.value})}
                          className="pr-10"
                          min="1990"
                          max={new Date().getFullYear()}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="mileage">الكيلومترات</Label>
                      <div className="relative">
                        <Gauge className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="mileage"
                          placeholder="15,000 كم"
                          value={adData.mileage}
                          onChange={(e) => setAdData({...adData, mileage: e.target.value})}
                          className="pr-10"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>نوع الوقود</Label>
                      <Select value={adData.fuelType} onValueChange={(value) => setAdData({...adData, fuelType: value})}>
                        <SelectTrigger>
                          <div className="flex items-center gap-2">
                            <Fuel className="h-4 w-4" />
                            <SelectValue />
                          </div>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="بنزين">بنزين</SelectItem>
                          <SelectItem value="ديزل">ديزل</SelectItem>
                          <SelectItem value="هايبرد">هايبرد</SelectItem>
                          <SelectItem value="كهربائي">كهربائي</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>ناقل الحركة</Label>
                      <Select value={adData.transmission} onValueChange={(value) => setAdData({...adData, transmission: value})}>
                        <SelectTrigger>
                          <div className="flex items-center gap-2">
                            <Settings className="h-4 w-4" />
                            <SelectValue />
                          </div>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="أوتوماتيك">أوتوماتيك</SelectItem>
                          <SelectItem value="يدوي">يدوي</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>حالة السيارة</Label>
                      <Select value={adData.condition} onValueChange={(value) => setAdData({...adData, condition: value})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="جديدة">جديدة</SelectItem>
                          <SelectItem value="مستعملة">مستعملة</SelectItem>
                          <SelectItem value="بحاجة لإصلاح">بحاجة لإصلاح</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="price">السعر (جنيه سوداني) *</Label>
                      <Input
                        id="price"
                        type="number"
                        placeholder="45000000"
                        value={adData.price}
                        onChange={(e) => setAdData({...adData, price: e.target.value})}
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* معلومات الاتصال */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">معلومات الاتصال</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city">المدينة *</Label>
                      <div className="relative">
                        <MapPin className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="city"
                          placeholder="الخرطوم، بحري، أم درمان..."
                          value={adData.city}
                          onChange={(e) => setAdData({...adData, city: e.target.value})}
                          className="pr-10"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">رقم الهاتف</Label>
                      <div className="relative">
                        <Phone className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="phone"
                          placeholder="+249 123 456 789"
                          value={adData.phone}
                          onChange={(e) => setAdData({...adData, phone: e.target.value})}
                          className="pr-10"
                        />
                      </div>
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="whatsapp">رقم الواتساب</Label>
                      <div className="relative">
                        <Phone className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="whatsapp"
                          placeholder="+249 123 456 789"
                          value={adData.whatsapp}
                          onChange={(e) => setAdData({...adData, whatsapp: e.target.value})}
                          className="pr-10"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* الصور */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">صور السيارة</h3>
                  
                  <div className="space-y-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleImageAdd}
                      className="w-full h-20 border-dashed"
                    >
                      <div className="flex flex-col items-center gap-2">
                        <Upload className="h-6 w-6" />
                        <span>اختر صور من المعرض</span>
                      </div>
                    </Button>

                    {images.length > 0 && (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {images.map((image, index) => (
                          <div key={index} className="relative group">
                            <img
                              src={image}
                              alt={`صورة ${index + 1}`}
                              className="w-full h-24 object-cover rounded-lg"
                            />
                            <button
                              type="button"
                              onClick={() => handleImageRemove(index)}
                              className="absolute top-1 right-1 w-6 h-6 bg-destructive text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <Button type="submit" size="lg" className="w-full" disabled={loading}>
                  {loading ? "جاري النشر..." : "نشر الإعلان"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AddAd;