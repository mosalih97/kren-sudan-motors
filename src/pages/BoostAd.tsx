import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Zap, Crown, Star, MessageCircle } from "lucide-react";
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
    name: "تعزيز أساسي",
    description: "ظهور في المقدمة لمدة 24 ساعة",
    duration: 24,
    price: 5,
    icon: Zap,
    features: [
      "ظهور في أعلى النتائج لمدة يوم كامل",
      "زيادة المشاهدات بنسبة 300%",
      "أولوية في البحث"
    ]
  },
  {
    id: "premium",
    name: "تعزيز مميز",
    description: "ظهور مميز لمدة 72 ساعة",
    duration: 72,
    price: 12,
    icon: Crown,
    features: [
      "ظهور مميز لمدة 3 أيام",
      "زيادة المشاهدات بنسبة 500%",
      "شارة مميز على الإعلان",
      "أولوية قصوى في البحث"
    ],
    popular: true
  },
  {
    id: "ultimate",
    name: "تعزيز احترافي",
    description: "تعزيز شامل لمدة أسبوع",
    duration: 168, // 7 days
    price: 25,
    icon: Star,
    features: [
      "ظهور مميز لمدة أسبوع كامل",
      "زيادة المشاهدات بنسبة 800%",
      "شارة احترافي مميز",
      "تثبيت في أعلى النتائج",
      "دعم فني مخصص"
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
            <CardTitle>معلومات الحساب</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div>
                <p className="font-medium">الكريديت المتاح: {profile?.credits || 0}</p>
                <p className="text-sm text-muted-foreground">
                  نوع العضوية: {isPremiumUser ? "مميز" : "عادي"}
                  {isPremiumUser && <Badge variant="secondary" className="mr-2">مجاني للأعضاء المميزين</Badge>}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* رسالة عدم القدرة على التعزيز */}
        {canBoost && !canBoost.can_boost && (
          <Card className="mb-6 border-destructive">
            <CardContent className="pt-6">
              <p className="text-destructive font-medium">{canBoost.reason}</p>
            </CardContent>
          </Card>
        )}

        {/* خطط التعزيز */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {boostPlans.map((plan) => {
            const Icon = plan.icon;
            const actualPrice = isPremiumUser ? 0 : plan.price;
            const canAfford = isPremiumUser || (profile?.credits || 0) >= plan.price;
            const isEligible = canBoost?.can_boost;
            
            return (
              <Card 
                key={plan.id} 
                className={`relative ${plan.popular ? 'border-primary' : ''}`}
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
                  
                  <div className="text-2xl font-bold">
                    {actualPrice === 0 ? (
                      <span className="text-green-600">مجاني</span>
                    ) : (
                      <span>{actualPrice} كريديت</span>
                    )}
                    {!isPremiumUser && plan.price > 0 && (
                      <div className="text-sm text-muted-foreground">
                        ({plan.duration} ساعة)
                      </div>
                    )}
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
                  
                  {!canAfford && !isPremiumUser && (
                    <p className="text-sm text-destructive mt-2 text-center">
                      كريديت غير كافي
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Separator className="my-8" />

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
              للحصول على خدمات التعزيز والترقية، تواصل معنا عبر واتساب
            </p>
            <Button asChild>
              <a 
                href="https://wa.me/249123456789?text=أريد%20تعزيز%20إعلاني" 
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