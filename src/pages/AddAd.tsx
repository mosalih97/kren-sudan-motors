import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { BackButton } from "@/components/BackButton";
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
    condition: "مستعملة",
    papersType: "",
    sellerRole: "مالك",
    brokerCommissionRequested: false,
    brokerCommissionAmount: "",
    licenseStatus: ""
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
      
      // ملء أرقام الهاتف والواتساب تلقائياً إذا كانت موجودة في الملف الشخصي
      if (data) {
        setAdData(prev => ({
          ...prev,
          phone: data.phone || prev.phone,
          whatsapp: data.whatsapp || prev.whatsapp
        }));
      }
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

    // التحقق من تقييد الإعلانات - Premium users get 40 ads, free users get 5
    const monthlyLimit = profile.membership_type === 'premium' ? 40 : 5;
    if (profile.monthly_ads_count >= monthlyLimit) {
      toast({
        title: "وصلت للحد الأقصى",
        description: profile.membership_type === 'premium' 
          ? "يمكن للمستخدمين المميزين إضافة 40 إعلان شهرياً فقط"
          : "يمكن للمستخدمين العاديين إضافة 5 إعلانات شهرياً فقط. قم بترقية عضويتك للمزيد",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    
    try {
      // تنسيق أرقام الهاتف والواتساب لقاعدة البيانات (إضافة كود الدولة وحذف الصفر)
      const formatPhoneForDB = (phone: string) => {
        if (!phone) return '';
        // إزالة أي أحرف غير رقمية
        const cleanPhone = phone.replace(/\D/g, '');
        // إذا كان الرقم يبدأ بـ 0 وطوله 10 خانات، إزالة الصفر وإضافة كود الدولة
        if (cleanPhone.startsWith('0') && cleanPhone.length === 10) {
          return '+249' + cleanPhone.substring(1);
        }
        return phone;
      };

      // إدراج الإعلان أولاً
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
          phone: formatPhoneForDB(adData.phone),
          whatsapp: formatPhoneForDB(adData.whatsapp),
          mileage: adData.mileage,
          fuel_type: adData.fuelType,
          transmission: adData.transmission,
          condition: adData.condition,
          images: images,
          status: "active",
          papers_type: adData.papersType || null,
          seller_role: adData.sellerRole || null,
          license_status: adData.licenseStatus || null,
          broker_commission_requested: adData.sellerRole === "وسيط" ? !!adData.brokerCommissionRequested : false,
          broker_commission_amount: adData.sellerRole === "وسيط" && adData.brokerCommissionRequested ? parseInt(adData.brokerCommissionAmount || "0") : 0
        });

      if (error) throw error;

      // تحديث عدد الإعلانات الشهرية فقط بعد نجاح إدراج الإعلان
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          monthly_ads_count: (profile.monthly_ads_count || 0) + 1 
        })
        .eq('user_id', user.id);

      if (updateError) {
        console.error("Error updating monthly ads count:", updateError);
        // لا نريد أن نفشل العملية بسبب عدم تحديث العداد
      }

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
      <BackButton to="/profile" />
      
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
              {/* التنويهات المهمة */}
              <div className="space-y-3">
                <div className="bg-orange-50 border border-orange-200 text-orange-800 rounded-md p-3 text-sm">
                  <strong>تأكد من التفاصيل بعناية لأنه لا يمكن تعديل الإعلان لاحقاً</strong>
                </div>
                <div className="bg-blue-50 border border-blue-200 text-blue-800 rounded-md p-3 text-sm">
                  <strong>يجب ملء جميع الحقول الإجبارية والمميزة بعلامة *</strong>
                </div>
              </div>
              
              <div className="bg-primary/10 border border-primary/20 text-primary rounded-md p-3 text-sm">
                لابد من توضيح حالة السيارة الحالية بالتفصيل وبمصداقية
              </div>
              
              <div className="bg-orange-50 border border-orange-200 text-orange-800 rounded-md p-3 text-sm">
                <strong>تأكد من التفاصيل بعناية لأنه لا يمكن تعديل الإعلان لاحقاً</strong>
              </div>
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
                      <span className="font-medium text-primary">
                        {profile.membership_type === 'premium' 
                          ? (profile.points || 0) + (profile.credits || 0)
                          : (profile.points || 0)
                        }
                      </span> نقطة
                    </div>
                  </div>
                  
                  <div className="bg-background rounded-md p-3 border border-primary/20">
                    <div className="text-sm">
                      <span className="text-muted-foreground">الإعلانات المتاحة هذا الشهر: </span>
                      <span className="font-medium text-primary">
                        {Math.max(0, (profile.membership_type === 'premium' ? 40 : 5) - (profile.monthly_ads_count || 0))} من {profile.membership_type === 'premium' ? 40 : 5}
                      </span>
                    </div>
                    {(profile.monthly_ads_count || 0) >= (profile.membership_type === 'premium' ? 40 : 5) && (
                      <p className="text-warning text-xs mt-1">
                        وصلت للحد الأقصى من الإعلانات هذا الشهر. 
                        {profile.membership_type !== 'premium' && " قم بترقية عضويتك للمزيد."}
                      </p>
                    )}
                  </div>
                  
                  {profile.membership_type === 'premium' && (
                    <div className="bg-primary/10 rounded-md p-3 border border-primary/20">
                      <p className="text-sm text-primary">
                        🎉 عضوية مميزة: 40 إعلان شهرياً + عرض مجاني لمعلومات التواصل + 130 نقطة إضافية
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

                {/* معلومات قانونية وصفة البائع */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">معلومات قانونية وصفة البائع</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>نوع الأوراق المتوفرة *</Label>
                      <Select value={adData.papersType} onValueChange={(value) => setAdData({ ...adData, papersType: value })} required>
                        <SelectTrigger>
                          <SelectValue placeholder="اختر نوع الأوراق" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="شهادة بحث">شهادة بحث</SelectItem>
                          <SelectItem value="توكيل">توكيل</SelectItem>
                          <SelectItem value="قيد نقل ملكية">قيد نقل ملكية</SelectItem>
                          <SelectItem value="أورنيك حكومي">أورنيك حكومي</SelectItem>
                          <SelectItem value="أوراق أخرى">أوراق أخرى</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>حالة الترخيص *</Label>
                      <Select value={adData.licenseStatus} onValueChange={(value) => setAdData({ ...adData, licenseStatus: value })} required>
                        <SelectTrigger>
                          <SelectValue placeholder="اختر حالة الترخيص" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ترخيص ساري">ترخيص ساري</SelectItem>
                          <SelectItem value="ترخيص غير ساري">ترخيص غير ساري</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>ما هي صفتك بالنسبة للسيارة؟ *</Label>
                      <Select value={adData.sellerRole} onValueChange={(value) => setAdData({ ...adData, sellerRole: value })} required>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="مالك">مالك</SelectItem>
                          <SelectItem value="وكيل">وكيل</SelectItem>
                          <SelectItem value="وسيط">وسيط</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {adData.sellerRole === "وسيط" && (
                    <div className="space-y-3 border rounded-md p-3">
                      <div className="space-y-2">
                        <Label>هل تطلب عمولة من المشتري؟</Label>
                        <Select value={adData.brokerCommissionRequested ? "yes" : "no"} onValueChange={(v) => setAdData({ ...adData, brokerCommissionRequested: v === "yes", brokerCommissionAmount: v === "yes" ? adData.brokerCommissionAmount : "" })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="no">لا</SelectItem>
                            <SelectItem value="yes">نعم</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {adData.brokerCommissionRequested && (
                        <div className="space-y-2">
                          <Label htmlFor="brokerCommissionAmount">قيمة العمولة النهائية (جنيه سوداني)</Label>
                          <Input
                            id="brokerCommissionAmount"
                            type="number"
                            placeholder="مثال: 50000"
                            value={adData.brokerCommissionAmount}
                            onChange={(e) => setAdData({ ...adData, brokerCommissionAmount: e.target.value })}
                            min={0}
                          />
                        </div>
                      )}

                      <p className="text-xs text-warning">
                        لا تطلب اكثر من العمولة المحددة في الإعلان وإلا سوف تعرض حسابك للحظر نهائياً
                      </p>
                    </div>
                  )}
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
                      <Label htmlFor="phone">رقم الهاتف *</Label>
                      <div className="relative">
                        <Phone className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="phone"
                          type="tel"
                          placeholder="09XXXXXXXX"
                          value={adData.phone}
                          onChange={(e) => setAdData({...adData, phone: e.target.value})}
                          className="pr-10"
                          pattern="[0-9]{10}"
                          maxLength={10}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="whatsapp">رقم الواتساب *</Label>
                      <div className="relative">
                        <Phone className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="whatsapp"
                          type="tel"
                          placeholder="09XXXXXXXX"
                          value={adData.whatsapp}
                          onChange={(e) => setAdData({...adData, whatsapp: e.target.value})}
                          className="pr-10"
                          pattern="[0-9]{10}"
                          maxLength={10}
                          required
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* الصور */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">صور السيارة *</h3>
                  
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

                <Button 
                  type="submit" 
                  size="lg" 
                  className="w-full" 
                  disabled={loading || !adData.papersType || !adData.sellerRole || !adData.licenseStatus || images.length === 0}
                >
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
