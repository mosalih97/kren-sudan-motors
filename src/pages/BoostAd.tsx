
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Zap, Crown, Star, MessageCircle, AlertCircle, TrendingUp, Clock, Eye } from "lucide-react";
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
  duration: number; // in hours
  price: number; // in points
  icon: any;
  features: string[];
  popular?: boolean;
  color: string;
}

const boostPlans: BoostPlan[] = [
  {
    id: "basic",
    name: "تعزيز سريع",
    description: "ظهور في المقدمة لمدة ساعة واحدة",
    duration: 1,
    price: 5,
    icon: Zap,
    color: "from-blue-500 to-blue-600",
    features: [
      "ظهور في أعلى النتائج لمدة ساعة كاملة",
      "زيادة المشاهدات بنسبة 200%",
      "أولوية في البحث",
      "تسليط الضوء على الإعلان"
    ]
  },
  {
    id: "premium",
    name: "تعزيز مميز",
    description: "ظهور مميز لمدة 3 أيام",
    duration: 72,
    price: 60,
    icon: Crown,
    color: "from-purple-500 to-purple-600",
    features: [
      "ظهور مميز لمدة 3 أيام كاملة",
      "زيادة المشاهدات بنسبة 500%",
      "شارة مميز على الإعلان",
      "أولوية قصوى في البحث",
      "تثبيت في المقدمة",
      "عرض في القسم المميز"
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
    color: "from-amber-500 to-amber-600",
    features: [
      "ظهور مميز لمدة أسبوع كامل",
      "زيادة المشاهدات بنسبة 800%",
      "شارة احترافي مميز",
      "تثبيت في أعلى النتائج",
      "أولوية مطلقة في البحث",
      "عرض مميز في جميع الأقسام",
      "إحصائيات متقدمة"
    ]
  }
];

export default function BoostAd() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { pointsData, refreshPoints } = useUserPoints();
  const [ad, setAd] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [boosting, setBoosting] = useState<string | null>(null);
  const [canBoostResults, setCanBoostResults] = useState<Record<string, any>>({});

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
    if (!user || !id) return;

    const results: Record<string, any> = {};
    
    for (const plan of boostPlans) {
      try {
        const { data, error } = await supabase.functions.invoke('boost-ad-enhanced', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          body: new URLSearchParams({ 
            ad_id: id, 
            boost_plan: plan.id 
          }).toString()
        });

        if (error) throw error;
        results[plan.id] = data;
      } catch (error) {
        console.error(`Error checking boost eligibility for ${plan.id}:`, error);
        results[plan.id] = { can_boost: false, reason: 'خطأ في فحص الأهلية' };
      }
    }
    
    setCanBoostResults(results);
  };

  const handleBoost = async (plan: BoostPlan) => {
    if (!user || !ad) return;

    setBoosting(plan.id);
    
    try {
      const { data, error } = await supabase.functions.invoke('boost-ad-enhanced', {
        body: JSON.stringify({
          ad_id: ad.id,
          boost_plan: plan.id
        })
      });

      if (error) throw error;

      if (data?.success) {
        toast.success(`تم تعزيز الإعلان بنجاح بخطة ${plan.name}!`);
        refreshPoints(); // تحديث النقاط
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

        {/* معلومات النقاط */}
        <div className="mb-6">
          <UserPointsDisplay variant="profile" />
        </div>

        {/* خطط التعزيز */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {boostPlans.map((plan) => {
            const Icon = plan.icon;
            const canBoostData = canBoostResults[plan.id];
            const canBoost = canBoostData?.can_boost || false;
            const canAfford = pointsData ? pointsData.total_points >= plan.price : false;
            
            return (
              <Card 
                key={plan.id} 
                className={`relative ${plan.popular ? 'border-primary shadow-lg scale-105' : ''} ${!canBoost ? 'opacity-75' : ''}`}
              >
                {plan.popular && (
                  <Badge className="absolute -top-2 right-4 bg-primary">
                    الأكثر شعبية
                  </Badge>
                )}
                
                <CardHeader className="text-center">
                  <div className={`w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br ${plan.color} flex items-center justify-center`}>
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                  
                  <div className="space-y-2">
                    <div className="text-3xl font-bold text-primary">
                      {plan.price} نقطة
                    </div>
                    <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                      <Clock className="w-4 h-4" />
                      {plan.duration === 1 ? "ساعة واحدة" : 
                       plan.duration === 72 ? "3 أيام" : 
                       "أسبوع كامل"}
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <Button 
                    className={`w-full bg-gradient-to-r ${plan.color} hover:opacity-90 text-white`}
                    onClick={() => handleBoost(plan)}
                    disabled={!canBoost || !canAfford || boosting === plan.id}
                  >
                    {boosting === plan.id ? "جاري التعزيز..." : 
                     !canBoost ? "غير متاح" :
                     !canAfford ? "نقاط غير كافية" :
                     "تعزيز الإعلان"}
                  </Button>
                  
                  {canBoostData && !canBoost && (
                    <div className="mt-3 p-2 bg-destructive/10 rounded text-xs text-destructive">
                      {canBoostData.reason}
                    </div>
                  )}
                  
                  {canBoost && !canAfford && (
                    <div className="mt-3 p-2 bg-amber-50 rounded text-xs text-amber-700">
                      تحتاج {plan.price - (pointsData?.total_points || 0)} نقطة إضافية
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Separator className="my-8" />

        {/* نظام النقاط */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              كيف يعمل نظام النقاط والتعزيز
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-semibold">أنواع النقاط:</h4>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-blue-500" />
                    <span><strong>النقاط الأساسية:</strong> 20 نقطة عند التسجيل</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Crown className="w-4 h-4 text-primary" />
                    <span><strong>نقاط العضوية المميزة:</strong> 130 نقطة شهرياً</span>
                  </li>
                </ul>
              </div>
              
              <div className="space-y-4">
                <h4 className="font-semibold">مميزات التعزيز:</h4>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <Eye className="w-4 h-4 text-green-500" />
                    <span>زيادة المشاهدات بشكل كبير</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-purple-500" />
                    <span>أولوية في نتائج البحث</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Crown className="w-4 h-4 text-amber-500" />
                    <span>شارات مميزة على الإعلان</span>
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* تواصل */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              تحتاج مساعدة؟
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              لتفعيل العضوية المميزة أو الحصول على نقاط إضافية، تواصل معنا
            </p>
            <Button asChild>
              <a 
                href="https://wa.me/249123456789?text=أريد%20مساعدة%20في%20نظام%20التعزيز" 
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
