
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Zap, Crown, Star, MessageCircle, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Header } from "@/components/Header";

interface BoostPlan {
  id: string;
  name: string;
  description: string;
  duration: number; // in hours
  price: number; // in credits
  icon: any;
  features: string[];
  popular?: boolean;
}

const boostPlans: BoostPlan[] = [
  {
    id: "basic",
    name: "تعزيز سريع",
    description: "ظهور في المقدمة لمدة ساعة واحدة",
    duration: 1,
    price: 5,
    icon: Zap,
    features: [
      "ظهور في أعلى النتائج لمدة ساعة كاملة",
      "زيادة المشاهدات بنسبة 200%",
      "أولوية في البحث"
    ]
  },
  {
    id: "premium",
    name: "تعزيز مميز",
    description: "ظهور مميز لمدة 3 أيام",
    duration: 72,
    price: 60,
    icon: Crown,
    features: [
      "ظهور مميز لمدة 3 أيام كاملة",
      "زيادة المشاهدات بنسبة 500%",
      "شارة مميز على الإعلان",
      "أولوية قصوى في البحث",
      "تثبيت في المقدمة"
    ],
    popular: true
  },
  {
    id: "ultimate",
    name: "تعزيز احترافي",
    description: "تعزيز شامل لمدة أسبوع كامل",
    duration: 168, // 7 days
    price: 100,
    icon: Star,
    features: [
      "ظهور مميز لمدة أسبوع كامل",
      "زيادة المشاهدات بنسبة 800%",
      "شارة احترافي مميز",
      "تثبيت في أعلى النتائج",
      "أولوية مطلقة في البحث",
      "عرض مميز في جميع الأقسام"
    ]
  }
];

export default function BoostAd() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [ad, setAd] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [boosting, setBoosting] = useState<string | null>(null);
  const [canBoost, setCanBoost] = useState<any>(null);

  useEffect(() => {
    if (!user || !id) return;
    
    fetchAdAndProfile();
    checkBoostEligibility();
  }, [user, id]);

  const fetchAdAndProfile = async () => {
    try {
      // جلب الإعلان
      const { data: adData, error: adError } = await supabase
        .from('ads')
        .select('*')
        .eq('id', id)
        .eq('user_id', user?.id)
        .single();

      if (adError) throw adError;
      setAd(adData);

      // جلب بيانات المستخدم
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (profileError) throw profileError;
      setProfile(profileData);

    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error("فشل في جلب بيانات الإعلان");
      navigate('/profile');
    } finally {
      setLoading(false);
    }
  };

  const checkBoostEligibility = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('boost-ad', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        body: new URLSearchParams({ ad_id: id! }).toString()
      });

      if (error) throw error;
      setCanBoost(data);
    } catch (error) {
      console.error('Error checking boost eligibility:', error);
    }
  };

  const handleBoost = async (plan: BoostPlan) => {
    if (!user || !ad) return;

    setBoosting(plan.id);
    
    try {
      const { data, error } = await supabase.functions.invoke('boost-ad', {
        body: JSON.stringify({
          ad_id: ad.id,
          hours_duration: plan.duration
        })
      });

      if (error) throw error;

      if (data?.success) {
        toast.success("تم تعزيز الإعلان بنجاح!");
        navigate('/profile');
      } else {
        toast.error(data?.message || "فشل في تعزيز الإعلان");
      }
    } catch (error) {
      console.error('Error boosting ad:', error);
      toast.error("حدث خطأ أثناء تعزيز الإعلان");
    } finally {
      setBoosting(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
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
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">الإعلان غير موجود</div>
        </div>
      </div>
    );
  }

  const isPremiumUser = profile?.membership_type === 'premium';
  const userCredits = profile?.credits || 0;
  const monthlyAdsCount = profile?.monthly_ads_count || 0;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={() => navigate(-1)}
            className="mb-4"
          >
            <ArrowLeft className="ml-2 h-4 w-4" />
            العودة
          </Button>
          
          <h1 className="text-3xl font-bold mb-2">تعزيز الإعلان</h1>
          <p className="text-muted-foreground">
            اختر خطة التعزيز المناسبة لإعلانك: {ad.title}
          </p>
        </div>

        {/* معلومات المستخدم */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="w-5 h-5" />
              معلومات الحساب
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">نوع العضوية:</span>
                <Badge variant={isPremiumUser ? "default" : "secondary"}>
                  {isPremiumUser ? "مميز" : "عادي"}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">الكريديت المتاح:</span>
                <span className="font-bold text-lg">{userCredits} نقطة</span>
              </div>
              
              {isPremiumUser && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">الإعلانات الشهرية:</span>
                  <span className="font-medium">{monthlyAdsCount}/40</span>
                </div>
              )}
              
              {!isPremiumUser && (
                <div className="flex items-center gap-2 p-3 bg-amber-50 rounded-lg border border-amber-200">
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                  <span className="text-sm text-amber-700">
                    يجب تفعيل العضوية المميزة لاستخدام خدمات التعزيز
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* رسالة عدم القدرة على التعزيز */}
        {canBoost && !canBoost.can_boost && (
          <Card className="mb-6 border-destructive">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-destructive" />
                <p className="text-destructive font-medium">{canBoost.reason}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* خطط التعزيز */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {boostPlans.map((plan) => {
            const Icon = plan.icon;
            const canAfford = userCredits >= plan.price;
            const isEligible = canBoost?.can_boost && isPremiumUser;
            
            return (
              <Card 
                key={plan.id} 
                className={`relative ${plan.popular ? 'border-primary shadow-lg' : ''} ${!isEligible ? 'opacity-60' : ''}`}
              >
                {plan.popular && (
                  <Badge className="absolute -top-2 right-4 bg-primary">
                    الأكثر شعبية
                  </Badge>
                )}
                
                <CardHeader className="text-center">
                  <Icon className="w-12 h-12 mx-auto mb-4 text-primary" />
                  <CardTitle>{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                  
                  <div className="text-3xl font-bold text-primary">
                    {plan.price} نقطة
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {plan.duration === 1 ? "ساعة واحدة" : 
                     plan.duration === 72 ? "3 أيام" : 
                     "أسبوع كامل"}
                  </div>
                </CardHeader>
                
                <CardContent>
                  <ul className="space-y-2 mb-6">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  
                  <Button 
                    className="w-full"
                    onClick={() => handleBoost(plan)}
                    disabled={!isEligible || !canAfford || boosting === plan.id}
                  >
                    {boosting === plan.id ? "جاري التعزيز..." : "تعزيز الإعلان"}
                  </Button>
                  
                  {!canAfford && isPremiumUser && (
                    <p className="text-sm text-destructive mt-2 text-center">
                      نقاط غير كافية - تحتاج {plan.price} نقطة
                    </p>
                  )}
                  
                  {!isPremiumUser && (
                    <p className="text-sm text-muted-foreground mt-2 text-center">
                      يتطلب عضوية مميزة
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Separator className="my-8" />

        {/* تفاصيل نظام النقاط */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5" />
              نظام النقاط والعضوية المميزة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium">المستخدمون المميزون يحصلون على:</h4>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• 130 نقطة شهرياً للتعزيز</li>
                    <li>• حتى 40 إعلان شهرياً</li>
                    <li>• عرض معلومات الاتصال مجاناً</li>
                    <li>• أولوية في البحث</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">أسعار التعزيز:</h4>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• ساعة واحدة: 5 نقاط</li>
                    <li>• 3 أيام: 60 نقطة</li>
                    <li>• أسبوع كامل: 100 نقطة</li>
                  </ul>
                </div>
              </div>
              
              {!isPremiumUser && (
                <div className="p-4 bg-primary/10 rounded-lg">
                  <p className="text-sm">
                    <strong>ملاحظة:</strong> المستخدمون العاديون لا يمكنهم استخدام نقاط التعزيز. 
                    يجب تفعيل العضوية المميزة للاستفادة من هذه الخدمة.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* معلومات التواصل */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              تحتاج مساعدة؟
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              لتفعيل العضوية المميزة أو الحصول على مساعدة، تواصل معنا عبر واتساب
            </p>
            <Button asChild>
              <a 
                href="https://wa.me/249123456789?text=أريد%20تفعيل%20العضوية%20المميزة" 
                target="_blank" 
                rel="noopener noreferrer"
              >
                تواصل عبر واتساب
              </a>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
