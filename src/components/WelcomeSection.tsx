import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Crown, 
  Star, 
  Check, 
  Users, 
  Shield, 
  Zap, 
  Target,
  Award,
  Car,
  TrendingUp,
  Eye,
  MessageCircle,
  Phone,
  ChevronLeft,
  ChevronRight,
  Gift
} from "lucide-react";
import { Link } from "react-router-dom";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

const WelcomeSection = () => {
  const [selectedPlan, setSelectedPlan] = useState<"free" | "premium">("premium");

  const features = [
    {
      icon: <Car className="h-6 w-6" />,
      title: "آلاف السيارات",
      description: "أكبر مجموعة من السيارات في السودان"
    },
    {
      icon: <Shield className="h-6 w-6" />,
      title: "أمان وموثوقية",
      description: "معاملات آمنة ومعلومات موثقة"
    },
    {
      icon: <Target className="h-6 w-6" />,
      title: "بحث متقدم",
      description: "فلاتر ذكية للعثور على ما تريد بسرعة"
    },
    {
      icon: <TrendingUp className="h-6 w-6" />,
      title: "أسعار تنافسية",
      description: "أفضل الأسعار في السوق السوداني"
    }
  ];

  const freePlanFeatures = [
    "20 نقطة للتواصل مع البائعين",
    "تصفح الإعلانات الأساسية",
    "البحث العادي",
    "5 إعلانات شهرياً",
    "الدعم الأساسي"
  ];

  const premiumPlanFeatures = [
    "135 نقطة (115 + 20 إضافية)",
    "40 إعلان شهرياً",
    "تصفح جميع الإعلانات",
    "البحث المتقدم والفلاتر الذكية", 
    "معلومات البائع كاملة",
    "إعلانات مميزة ومعززة",
    "أولوية في الظهور",
    "دعم فني 24/7",
    "إحصائيات مفصلة",
    "شارة العضو المميز"
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* قسم الترحيب الرئيسي */}
      <section className="relative overflow-hidden">
        <div className="hero-gradient py-20 lg:py-32">
          <div className="container mx-auto px-4 text-center text-white">
            <div className="max-w-4xl mx-auto space-y-8">
              {/* الشعار والترحيب */}
              <div className="flex justify-center items-center gap-4 mb-8">
                <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-xl">
                  <span className="text-2xl font-bold text-white font-amiri">ك</span>
                </div>
                <div className="text-right">
                  <h1 className="text-4xl lg:text-5xl font-bold font-amiri">الكرين</h1>
                  <p className="text-white/80">منصة السيارات الأولى في السودان</p>
                </div>
              </div>

              <div className="inline-block bg-gradient-to-r from-orange-400 to-orange-500 text-white px-6 py-2 rounded-full text-sm font-medium mb-8 shadow-lg">
                🚀 مرحباً بك في عالم السيارات الرقمي
              </div>
              
              <h2 className="text-3xl lg:text-5xl font-bold leading-tight">
                اكتشف، اشتري، بع
                <br />
                <span className="bg-white/20 backdrop-blur-sm rounded-2xl px-6 py-3 inline-block mt-4">
                  بكل ثقة وأمان
                </span>
              </h2>
              
              <p className="text-xl lg:text-2xl text-white/90 max-w-3xl mx-auto">
                منصة متكاملة تربط بين البائعين والمشترين في عالم السيارات، مع ضمان الجودة والموثوقية في كل معاملة
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* قسم الميزات */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Badge variant="new" className="mb-4 bg-primary/10 text-primary border-primary/20">
              <Star className="h-4 w-4 ml-2" />
              لماذا الكرين؟
            </Badge>
            <h3 className="text-3xl font-bold text-foreground mb-4">
              كل ما تحتاجه في مكان واحد
            </h3>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              نقدم لك تجربة استثنائية في عالم السيارات مع أحدث التقنيات وأفضل الخدمات
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <Carousel className="w-full">
              <CarouselContent>
                {features.map((feature, index) => (
                  <CarouselItem key={index} className="md:basis-1/2 lg:basis-1/2">
                    <div className="p-2">
                      <Card className="card-gradient border-0 shadow-lg hover:shadow-xl transition-smooth group aspect-square">
                        <CardContent className="flex flex-col items-center justify-center p-8 h-full text-center">
                          <div className="w-16 h-16 mx-auto mb-6 rounded-2xl primary-gradient flex items-center justify-center text-white group-hover:scale-110 transition-smooth">
                            {feature.icon}
                          </div>
                          <h4 className="font-bold text-xl mb-3">{feature.title}</h4>
                          <p className="text-muted-foreground text-base leading-relaxed">{feature.description}</p>
                        </CardContent>
                      </Card>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="hidden md:flex" />
              <CarouselNext className="hidden md:flex" />
            </Carousel>
          </div>
        </div>
      </section>

      {/* قسم العضويات */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Badge variant="new" className="mb-4 bg-premium/10 text-premium border-premium/20">
              <Crown className="h-4 w-4 ml-2" />
              اختر خطتك
            </Badge>
            <h3 className="text-4xl font-bold text-foreground mb-4">
              للدخول إلى عالم الكرين
            </h3>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              يجب التسجيل للوصول إلى جميع خدمات المنصة. اختر العضوية التي تناسب احتياجاتك
            </p>
          </div>

          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* العضوية المجانية */}
              <Card className={`relative overflow-hidden transition-smooth border-2 ${selectedPlan === "free" ? "border-primary" : "border-border"} hover:shadow-lg`}>
                <CardHeader className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-muted flex items-center justify-center">
                    <Users className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <CardTitle className="text-2xl">العضوية المجانية</CardTitle>
                  <div className="text-3xl font-bold text-foreground">
                    مجاناً
                  </div>
                  <p className="text-muted-foreground">للمستخدمين الجدد</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    {freePlanFeatures.map((feature, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                          <Check className="h-3 w-3 text-muted-foreground" />
                        </div>
                        <span className="text-sm text-muted-foreground">{feature}</span>
                      </div>
                    ))}
                  </div>
                  <Button 
                    variant="outline" 
                    size="lg" 
                    className="w-full mt-6"
                    onClick={() => setSelectedPlan("free")}
                  >
                    ابدأ مجاناً
                  </Button>
                </CardContent>
              </Card>

              {/* العضوية المميزة */}
              <Card className={`relative overflow-hidden transition-smooth border-2 ${selectedPlan === "premium" ? "border-premium" : "border-border"} hover:shadow-xl premium-card`}>
                <div className="absolute top-4 left-4">
                  <Badge className="badge-premium">
                    <Crown className="h-3 w-3 ml-1" />
                    الأكثر شعبية
                  </Badge>
                </div>
                <CardHeader className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl premium-gradient flex items-center justify-center">
                    <Crown className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="text-2xl">العضوية المميزة</CardTitle>
                  <div className="text-3xl font-bold text-premium">
                    25,000
                    <span className="text-lg text-muted-foreground"> جنيه سوداني/شهر</span>
                  </div>
                  <p className="text-muted-foreground">للمحترفين والتجار</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    {premiumPlanFeatures.map((feature, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <div className="w-5 h-5 rounded-full premium-gradient flex items-center justify-center flex-shrink-0">
                          <Check className="h-3 w-3 text-white" />
                        </div>
                        <span className="text-sm font-medium">{feature}</span>
                      </div>
                    ))}
                  </div>
                  <Button 
                    className="w-full mt-6 btn-premium"
                    size="lg"
                    onClick={() => setSelectedPlan("premium")}
                  >
                    <Crown className="h-4 w-4 ml-2" />
                    احصل على العضوية المميزة
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* العرض الحصري */}
            <div className="text-center mt-12">
              <Card className="max-w-3xl mx-auto p-8 border-2 border-premium bg-gradient-to-br from-premium/5 to-premium/10 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-premium to-orange-500"></div>
                <div className="space-y-6">
                  <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-premium to-orange-500 flex items-center justify-center animate-pulse">
                    <Gift className="h-12 w-12 text-white" />
                  </div>
                  <Badge className="bg-premium text-white border-0 text-lg px-6 py-2">
                    <Crown className="h-4 w-4 ml-2" />
                    عرض حصري محدود
                  </Badge>
                  <div>
                    <h4 className="text-3xl font-bold text-foreground mb-3">
                      50 عضوية مميزة مجانية
                    </h4>
                    <p className="text-xl text-premium font-semibold mb-2">
                      لأول 50 مستخدم مسجل فقط!
                    </p>
                    <p className="text-muted-foreground text-lg">
                      احصل على جميع مميزات العضوية المميزة مجاناً لمدة شهر كامل
                    </p>
                  </div>
                  <div className="bg-white/80 rounded-2xl p-6 border border-premium/20">
                    <h5 className="font-bold text-lg mb-3">ماذا ستحصل عليه مجاناً:</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-premium" />
                        <span>135 نقطة للتواصل</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-premium" />
                        <span>40 إعلان شهرياً</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-premium" />
                        <span>إعلانات مميزة ومعززة</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-premium" />
                        <span>دعم فني متميز</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            {/* دعوة للتسجيل */}
            <div className="text-center mt-12">
              <Card className="max-w-2xl mx-auto p-8 card-gradient border-0 shadow-xl">
                <div className="space-y-6">
                  <div className="w-20 h-20 mx-auto rounded-3xl primary-gradient flex items-center justify-center">
                    <Shield className="h-10 w-10 text-white" />
                  </div>
                  <div>
                    <h4 className="text-2xl font-bold text-foreground mb-2">
                      سجل الآن للمتابعة
                    </h4>
                    <p className="text-muted-foreground">
                      التسجيل مطلوب للوصول إلى جميع خدمات المنصة واستلام العرض الحصري
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link to="/auth?mode=signup">
                      <Button size="lg" className="min-w-[200px] btn-premium animate-pulse">
                        <Gift className="h-5 w-5 ml-2" />
                        احصل على العرض الحصري
                      </Button>
                    </Link>
                    <Link to="/auth?mode=login">
                      <Button variant="outline" size="lg" className="min-w-[200px]">
                        تسجيل الدخول
                      </Button>
                    </Link>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    بالتسجيل، تحصل على {selectedPlan === "premium" ? "العضوية المميزة مجاناً" : "العضوية المجانية"} فوراً
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* قسم المقارنة السريعة */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-foreground mb-4">
              مقارنة سريعة بين العضويات
            </h3>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="text-center p-6">
                <Eye className="h-8 w-8 mx-auto mb-4 text-muted-foreground" />
                <h4 className="font-bold mb-2">تصفح الإعلانات</h4>
                <div className="space-y-2 text-sm">
                  <div className="text-muted-foreground">مجاني: محدود</div>
                  <div className="text-premium font-semibold">مميز: غير محدود</div>
                </div>
              </Card>

              <Card className="text-center p-6">
                <MessageCircle className="h-8 w-8 mx-auto mb-4 text-muted-foreground" />
                <h4 className="font-bold mb-2">التواصل</h4>
                <div className="space-y-2 text-sm">
                  <div className="text-muted-foreground">مجاني: محدود</div>
                  <div className="text-premium font-semibold">مميز: كامل</div>
                </div>
              </Card>

              <Card className="text-center p-6">
                <Zap className="h-8 w-8 mx-auto mb-4 text-muted-foreground" />
                <h4 className="font-bold mb-2">الإعلانات</h4>
                <div className="space-y-2 text-sm">
                  <div className="text-muted-foreground">مجاني: 5 شهرياً</div>
                  <div className="text-premium font-semibold">مميز: 40 شهرياً</div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default WelcomeSection;