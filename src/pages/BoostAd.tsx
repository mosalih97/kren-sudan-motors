
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Header } from "@/components/Header";
import { BackButton } from "@/components/BackButton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Zap, Star, Target, Crown } from "lucide-react";

const BoostAd = () => {
  const { id } = useParams<{ id: string }>();
  const [ad, setAd] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [boosting, setBoosting] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (id) {
      fetchAd();
    }
  }, [id]);

  const fetchAd = async () => {
    if (!id) return;

    try {
      const { data, error } = await supabase
        .from("ads")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      setAd(data);
    } catch (error) {
      console.error("Error fetching ad:", error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء جلب الإعلان",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBoost = async (type: string) => {
    if (!user || !ad) return;

    setBoosting(true);
    try {
      // This would normally call a Supabase function
      // For now, we'll just show a success message
      toast({
        title: "تم تعزيز الإعلان بنجاح",
        description: "سيظهر إعلانك في المقدمة لمدة أطول"
      });
    } catch (error) {
      console.error("Error boosting ad:", error);
      toast({
        title: "خطأ في تعزيز الإعلان",
        description: "حاول مرة أخرى",
        variant: "destructive"
      });
    } finally {
      setBoosting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <BackButton />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">جاري التحميل...</div>
        </div>
      </div>
    );
  }

  if (!ad) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <BackButton />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">الإعلان غير موجود</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <BackButton />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Card className="card-gradient border-0 shadow-xl mb-8">
            <CardHeader className="text-center">
              <div className="w-16 h-16 rounded-full primary-gradient flex items-center justify-center mx-auto mb-4">
                <Zap className="h-8 w-8 text-white" />
              </div>
              <CardTitle className="text-2xl font-bold">تعزيز الإعلان</CardTitle>
              <p className="text-muted-foreground">اجعل إعلانك يظهر للمزيد من المشترين</p>
            </CardHeader>
          </Card>

          {/* Current Ad Info */}
          <Card className="card-gradient border-0 shadow-xl mb-8">
            <CardContent className="p-6">
              <h3 className="text-lg font-bold mb-4">الإعلان الحالي</h3>
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="font-semibold">{ad.title}</h4>
                  <p className="text-muted-foreground">{ad.price} جنيه سوداني</p>
                </div>
                <div className="text-right">
                  <Badge variant={ad.is_premium ? "default" : "secondary"}>
                    {ad.is_premium ? "مميز" : "عادي"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Boost Options */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="card-gradient border-0 shadow-xl">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-yellow-500" />
                  <CardTitle>إعلان مميز</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  يظهر إعلانك في القسم المميز لمدة 7 أيام
                </p>
                <ul className="text-sm space-y-1">
                  <li>• ظهور في الصفحة الرئيسية</li>
                  <li>• شارة "مميز"</li>
                  <li>• زيادة المشاهدات 3x</li>
                </ul>
                <div className="text-2xl font-bold text-primary">500 ج.س</div>
                <Button 
                  className="w-full" 
                  onClick={() => handleBoost('premium')}
                  disabled={boosting || ad.is_premium}
                >
                  {ad.is_premium ? "مفعل حالياً" : "اختيار هذه الباقة"}
                </Button>
              </CardContent>
            </Card>

            <Card className="card-gradient border-0 shadow-xl">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Crown className="h-5 w-5 text-purple-500" />
                  <CardTitle>الموضع الأول</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  يظهر إعلانك في أول النتائج لمدة 3 أيام
                </p>
                <ul className="text-sm space-y-1">
                  <li>• الموضع الأول في البحث</li>
                  <li>• شارة "الأول"</li>
                  <li>• زيادة المشاهدات 5x</li>
                </ul>
                <div className="text-2xl font-bold text-primary">800 ج.س</div>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => handleBoost('top')}
                  disabled={boosting}
                >
                  اختيار هذه الباقة
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Payment Info */}
          <Card className="card-gradient border-0 shadow-xl mt-8">
            <CardContent className="p-6">
              <h3 className="text-lg font-bold mb-4">طريقة الدفع</h3>
              <p className="text-muted-foreground mb-4">
                سيتم توجيهك لصفحة الدفع بعد اختيار الباقة المناسبة
              </p>
              <div className="text-sm text-muted-foreground">
                * جميع الأسعار بالجنيه السوداني
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default BoostAd;
