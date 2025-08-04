import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { BackButton } from "@/components/BackButton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Car, Upload } from "lucide-react";

const AddAd = () => {
  const [formData, setFormData] = useState({
    title: "",
    brand: "",
    model: "",
    year: "",
    mileage: "",
    fuel_type: "",
    transmission: "",
    price: "",
    city: "",
    description: "",
    phone: "",
    whatsapp: ""
  });
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from("ads")
        .insert({
          title: formData.title,
          brand: formData.brand,
          model: formData.model,
          year: parseInt(formData.year),
          mileage: formData.mileage,
          fuel_type: formData.fuel_type,
          transmission: formData.transmission,
          price: parseInt(formData.price),
          city: formData.city,
          description: formData.description,
          phone: formData.phone,
          whatsapp: formData.whatsapp,
          user_id: user.id,
          status: "active"
        });

      if (error) throw error;

      toast({
        title: "تم نشر الإعلان بنجاح",
        description: "سيتم مراجعة الإعلان وعرضه قريباً"
      });
      
      navigate("/profile");
    } catch (error) {
      console.error("Error creating ad:", error);
      toast({
        title: "خطأ في نشر الإعلان",
        description: "حاول مرة أخرى",
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
        <Card className="max-w-2xl mx-auto card-gradient border-0 shadow-xl">
          <CardHeader className="text-center">
            <div className="w-16 h-16 rounded-full primary-gradient flex items-center justify-center mx-auto mb-4">
              <Car className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold">أضف إعلان جديد</CardTitle>
            <p className="text-muted-foreground">اعرض سيارتك للبيع</p>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">عنوان الإعلان</Label>
                  <Input
                    id="title"
                    placeholder="مثال: تويوتا كامري 2020"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="brand">الماركة</Label>
                  <Select value={formData.brand} onValueChange={(value) => setFormData({ ...formData, brand: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر الماركة" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="toyota">تويوتا</SelectItem>
                      <SelectItem value="honda">هوندا</SelectItem>
                      <SelectItem value="hyundai">هيونداي</SelectItem>
                      <SelectItem value="kia">كيا</SelectItem>
                      <SelectItem value="nissan">نيسان</SelectItem>
                      <SelectItem value="other">أخرى</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                
                
                <div className="space-y-2">
                  <Label htmlFor="model">الموديل</Label>
                  <Input
                    id="model"
                    placeholder="مثال: كامري"
                    value={formData.model}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="year">السنة</Label>
                  <Input
                    id="year"
                    type="number"
                    placeholder="2020"
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="mileage">المسافة المقطوعة (كم)</Label>
                  <Input
                    id="mileage"
                    type="number"
                    placeholder="50000"
                    value={formData.mileage}
                    onChange={(e) => setFormData({ ...formData, mileage: e.target.value })}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="fuel_type">نوع الوقود</Label>
                  <Select value={formData.fuel_type} onValueChange={(value) => setFormData({ ...formData, fuel_type: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر نوع الوقود" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="بنزين">بنزين</SelectItem>
                      <SelectItem value="ديزل">ديزل</SelectItem>
                      <SelectItem value="هايبرد">هايبرد</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="transmission">ناقل الحركة</Label>
                  <Select value={formData.transmission} onValueChange={(value) => setFormData({ ...formData, transmission: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر ناقل الحركة" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="أوتوماتيك">أوتوماتيك</SelectItem>
                      <SelectItem value="مانوال">مانوال</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="price">السعر (جنيه سوداني)</Label>
                  <Input
                    id="price"
                    type="number"
                    placeholder="150000"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="city">المدينة</Label>
                  <Input
                    id="city"
                    placeholder="الخرطوم"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phone">رقم الهاتف</Label>
                  <Input
                    id="phone"
                    placeholder="0123456789"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="whatsapp">واتساب (اختياري)</Label>
                  <Input
                    id="whatsapp"
                    placeholder="0123456789"
                    value={formData.whatsapp}
                    onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">الوصف</Label>
                <Textarea
                  id="description"
                  placeholder="اكتب وصفاً مفصلاً للسيارة..."
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                />
              </div>
              
              <Button type="submit" className="w-full" disabled={loading}>
                <Upload className="mr-2 h-4 w-4" />
                {loading ? "جاري النشر..." : "نشر الإعلان"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AddAd;
