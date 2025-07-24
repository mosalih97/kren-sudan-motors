
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
import { UserPointsDisplay } from "@/components/UserPointsDisplay";
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

  useEffect(() => {
    if (!user || !id) return;
    
    fetchAd();
    checkBoostEligibility();
  }, [user, id]);

  const fetchAd = async () => {
    try {
      const { data: adData, error: adError } = await supabase
        .from('ads')
        .select('*')
        .eq('id', id)
        .eq('user_id', user?.id)
        .single();

      if (adError) throw adError;
      setAd(adData);
    } catch (error) {
      console.error('Error fetching ad:', error);
      toast.error("فشل في جلب بيانات الإعلان");
      navigate('/profile');
    } finally {
      setLoading(false);
    }
  };

  const checkBoostEligibility = async () => {
    if (!id || !user) return;
    
    const eligibilityResults: {[key: string]: any} = {};
    
    for (const plan of boostPlans) {
      try {
        const { data, error } = await supabase.rpc('can_boost_ad_enhanced', {
          ad_id_param: id,
          user_id_param: user.id,
          boost_plan: plan.id
        });

        if (!error && data) {
          eligibilityResults[plan.id] = data;
        } else {
          eligibilityResults[plan.id] = { can_boost: false, reason: "خطأ في فحص الأهلية" };
        }
      } catch (error) {
        console.error(`Error checking eligibility for ${plan.id}:`, error);
        eligibilityResults[plan.id] = { can_boost: false, reason: "خطأ في فحص الأهلية" };
      }
    }
    
    setBoostEligibility(eligibilityResults);
  };

  const handleBoost = async (plan: BoostPlan) => {
    if (!user || !ad) return;

    setBoosting(plan.id);
    
    try {
      const { data, error } = await supabase.rpc('boost_ad_enhanced', {
        ad_id_param: ad.id,
        user_id_param: user.id,
        boost_plan: plan.id
      });

      if (error) throw error;

      if (data?.success) {
        toast.success("تم تعزيز الإعلان بنجاح!");
        await refetchPoints();
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

  const totalPoints = pointsData?.total_points || 0;
  const isPremium = pointsData?.membership_type === 'premium';

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
            
            {!isPremium && (
              <div className="mt-4 flex items-center gap-2 p-3 bg-amber-50 rounded-lg border border-amber-200">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                <span className="text-sm text-amber-700">
                  المستخدمون العاديون يستخدمون النقاط الأساسية فقط للتعزيز
                </span>
              </div>
            )}
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
                        <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
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
