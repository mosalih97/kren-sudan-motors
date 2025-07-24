
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Zap, Crown, Star, MessageCircle, AlertCircle, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Header } from "@/components/Header";
import { UserPointsDisplay } from "@/components/UserPointsDisplay";
import { AdBoostStatus } from "@/components/AdBoostStatus";
import { useUserPoints } from "@/hooks/useUserPoints";

interface BoostPlan {
  id: string;
  name: string;
  description: string;
  duration: number;
  price: number;
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
    duration: 168,
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
  const { data: pointsData, refetch: refetchPoints } = useUserPoints();
  const [ad, setAd] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [boosting, setBoosting] = useState<string | null>(null);
  const [boostEligibility, setBoostEligibility] = useState<{[key: string]: any}>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      toast.error("يجب تسجيل الدخول لتعزيز الإعلانات");
      navigate('/auth');
      return;
    }
    
    if (!id) {
      toast.error("معرف الإعلان غير صحيح");
      navigate('/profile');
      return;
    }
    
    fetchAd();
  }, [user, id, navigate]);

  useEffect(() => {
    if (ad) {
      checkBoostEligibility();
    }
  }, [ad]);

  const fetchAd = async () => {
    if (!id || !user) return;
    
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching ad for boost, ID:', id);
      
      const { data: adData, error: adError } = await supabase
        .from('ads')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      console.log('Ad data for boost:', adData);
      console.log('Ad error for boost:', adError);

      if (adError) {
        console.error('Error fetching ad for boost:', adError);
        if (adError.code === 'PGRST116') {
          setError("الإعلان غير موجود أو لا تملك صلاحية الوصول إليه");
        } else {
          setError("فشل في جلب بيانات الإعلان");
        }
        return;
      }

      if (!adData) {
        setError("الإعلان غير موجود");
        return;
      }

      if (adData.status !== 'active') {
        setError("لا يمكن تعزيز إعلان غير نشط");
        return;
      }

      setAd(adData);
    } catch (error) {
      console.error('Error fetching ad for boost:', error);
      setError("حدث خطأ في جلب بيانات الإعلان");
    } finally {
      setLoading(false);
    }
  };

  const checkBoostEligibility = async () => {
    if (!id || !user) return;
    
    console.log('Checking boost eligibility for ad:', id);
    
    const eligibilityResults: {[key: string]: any} = {};
    
    for (const plan of boostPlans) {
      try {
        const { data, error } = await supabase.functions.invoke('boost-ad-enhanced', {
          method: 'GET',
          query: {
            ad_id: id,
            boost_plan: plan.id
          }
        });

        console.log(`Eligibility check for ${plan.id}:`, data, error);

        if (error) {
          console.error(`Error checking eligibility for ${plan.id}:`, error);
          eligibilityResults[plan.id] = { 
            can_boost: false, 
            reason: error.message || "خطأ في فحص الأهلية" 
          };
        } else if (data) {
          eligibilityResults[plan.id] = {
            can_boost: data.can_boost || false,
            reason: data.reason || "خطأ في فحص الأهلية",
            cost: data.cost || plan.price,
            user_points: data.user_points || null
          };
        } else {
          eligibilityResults[plan.id] = { 
            can_boost: false, 
            reason: "لا يمكن فحص الأهلية" 
          };
        }
      } catch (error) {
        console.error(`Error checking eligibility for ${plan.id}:`, error);
        eligibilityResults[plan.id] = { 
          can_boost: false, 
          reason: "خطأ في فحص الأهلية" 
        };
      }
    }
    
    setBoostEligibility(eligibilityResults);
  };

  const handleBoost = async (plan: BoostPlan) => {
    if (!user || !ad) return;

    console.log('Starting boost process for plan:', plan.id);

    // التحقق من الأهلية مرة أخرى
    const eligibility = boostEligibility[plan.id];
    if (!eligibility?.can_boost) {
      toast.error(eligibility?.reason || "لا يمكن تعزيز الإعلان");
      return;
    }

    setBoosting(plan.id);
    
    try {
      const { data, error } = await supabase.functions.invoke('boost-ad-enhanced', {
        method: 'POST',
        body: {
          ad_id: ad.id,
          boost_plan: plan.id
        }
      });

      console.log('Boost result:', data, error);

      if (error) {
        console.error('Boost error:', error);
        toast.error(error.message || "فشل في تعزيز الإعلان");
        return;
      }

      if (data?.success) {
        toast.success("تم تعزيز الإعلان بنجاح!");
        
        // تحديث النقاط وحالة التعزيز
        await refetchPoints();
        
        // تحديث حالة الإعلان محلياً
        setAd(prev => ({
          ...prev,
          top_spot: true,
          top_spot_until: data.expires_at
        }));
        
        // تحديث حالة الأهلية
        await checkBoostEligibility();
        
        // الانتقال إلى الملف الشخصي بعد نجاح التعزيز
        setTimeout(() => {
          navigate('/profile');
        }, 2000);
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
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">جاري التحميل...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <Card className="max-w-md mx-auto">
              <CardContent className="p-8 text-center">
                <AlertCircle className="h-16 w-16 mx-auto text-destructive mb-4" />
                <h2 className="text-xl font-semibold mb-2">خطأ في تحميل الإعلان</h2>
                <p className="text-muted-foreground mb-6">{error}</p>
                <div className="flex gap-2 justify-center">
                  <Button onClick={() => navigate('/profile')} variant="outline">
                    <ArrowLeft className="ml-2 h-4 w-4" />
                    العودة للملف الشخصي
                  </Button>
                  <Button onClick={fetchAd}>
                    إعادة المحاولة
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (!ad) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <Card className="max-w-md mx-auto">
              <CardContent className="p-8 text-center">
                <h2 className="text-xl font-semibold mb-2">الإعلان غير موجود</h2>
                <p className="text-muted-foreground mb-6">
                  الإعلان غير موجود أو غير مملوك لك
                </p>
                <Button onClick={() => navigate('/profile')}>
                  <ArrowLeft className="ml-2 h-4 w-4" />
                  العودة للملف الشخصي
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  const totalPoints = pointsData?.total_points || 0;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/profile')}
            className="mb-4"
          >
            <ArrowLeft className="ml-2 h-4 w-4" />
            العودة للملف الشخصي
          </Button>
          
          <h1 className="text-3xl font-bold mb-2">تعزيز الإعلان</h1>
          <p className="text-muted-foreground">
            اختر خطة التعزيز المناسبة لإعلانك: {ad.title}
          </p>
        </div>

        {/* حالة التعزيز الحالية */}
        <AdBoostStatus adId={ad.id} className="mb-6" />

        {/* معلومات الحساب والنقاط */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="w-5 h-5" />
              معلومات الحساب والنقاط
            </CardTitle>
          </CardHeader>
          <CardContent>
            <UserPointsDisplay variant="full" />
          </CardContent>
        </Card>

        {/* خطط التعزيز */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {boostPlans.map((plan) => {
            const Icon = plan.icon;
            const eligibility = boostEligibility[plan.id];
            const canBoost = eligibility?.can_boost || false;
            const canAfford = totalPoints >= plan.price;
            const isEligible = canBoost && canAfford;
            
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
                        <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  
                  <Button 
                    className="w-full"
                    onClick={() => handleBoost(plan)}
                    disabled={!isEligible || boosting === plan.id}
                  >
                    {boosting === plan.id ? "جاري التعزيز..." : "تعزيز الإعلان"}
                  </Button>
                  
                  {!canAfford && (
                    <p className="text-sm text-destructive mt-2 text-center">
                      نقاط غير كافية - تحتاج {plan.price} نقطة
                    </p>
                  )}
                  
                  {eligibility && !canBoost && (
                    <p className="text-sm text-destructive mt-2 text-center">
                      {eligibility.reason}
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
              نظام النقاط والتعزيز
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium">أسعار التعزيز:</h4>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• ساعة واحدة: 5 نقاط</li>
                    <li>• 3 أيام: 60 نقطة</li>
                    <li>• أسبوع كامل: 100 نقطة</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">المستخدمون المميزون:</h4>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• 130 نقطة إضافية شهرياً</li>
                    <li>• أولوية في استخدام النقاط</li>
                    <li>• حتى 40 إعلان شهرياً</li>
                    <li>• مزايا إضافية في التعزيز</li>
                  </ul>
                </div>
              </div>
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
