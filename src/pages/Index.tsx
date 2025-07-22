import { Header } from "@/components/Header";
import { SearchFilters } from "@/components/SearchFilters";
import { CarCard } from "@/components/CarCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, Users, Shield, Star, ArrowLeft, Zap, Target, Award } from "lucide-react";

// بيانات تجريبية للسيارات
const featuredCars = [
  {
    id: "1",
    title: "تويوتا كامري 2022 - فل أوبشن",
    price: 45000000,
    location: "الخرطوم",
    year: 2022,
    mileage: "15,000 كم",
    fuelType: "بنزين",
    transmission: "أوتوماتيك",
    image: "https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=400&h=300&fit=crop",
    isPremium: true,
    isFeatured: true,
    viewCount: 1250,
    creditsRequired: 1
  },
  {
    id: "2", 
    title: "نيسان التيما 2021 - نظيفة جداً",
    price: 38000000,
    location: "بحري",
    year: 2021,
    mileage: "22,000 كم",
    fuelType: "بنزين",
    transmission: "أوتوماتيك",
    image: "https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?w=400&h=300&fit=crop",
    isFeatured: true,
    isNew: true,
    viewCount: 890,
    creditsRequired: 1
  },
  {
    id: "3",
    title: "هوندا أكورد 2020 - حالة ممتازة",
    price: 35000000,
    location: "أم درمان",
    year: 2020,
    mileage: "28,000 كم", 
    fuelType: "بنزين",
    transmission: "أوتوماتيك",
    image: "https://images.unsplash.com/photo-1606152421802-db97b9c7a11b?w=400&h=300&fit=crop",
    isPremium: true,
    viewCount: 654,
    creditsRequired: 1
  },
  {
    id: "4",
    title: "هيونداي إلنترا 2023 - جديدة",
    price: 42000000,
    location: "الخرطوم",
    year: 2023,
    mileage: "5,000 كم",
    fuelType: "بنزين", 
    transmission: "أوتوماتيك",
    image: "https://images.unsplash.com/photo-1609521263047-f8f205293f24?w=400&h=300&fit=crop",
    isNew: true,
    isFeatured: true,
    viewCount: 2100,
    creditsRequired: 1
  }
];

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* القسم الرئيسي الجذاب */}
      <section className="relative overflow-hidden">
        <div className="hero-gradient py-20 lg:py-32">
          <div className="container mx-auto px-4 text-center text-white">
            <div className="max-w-4xl mx-auto space-y-8">
              <Badge variant="new" className="mb-4">
                🚀 الآن في السودان - منصة السيارات الأكثر تطوراً
              </Badge>
              
              <h1 className="text-4xl lg:text-6xl font-bold leading-tight">
                اكتشف سيارة أحلامك مع
                <br />
                <span className="bg-white/20 backdrop-blur-sm rounded-2xl px-4 py-2 inline-block mt-4">
                  الكرين
                </span>
              </h1>
              
              <p className="text-xl lg:text-2xl text-white/90 max-w-2xl mx-auto">
                أكبر سوق إلكتروني للسيارات في السودان. آلاف السيارات، أسعار تنافسية، وتجربة شراء استثنائية
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-8">
                <Button variant="accent" size="xl" className="min-w-[200px]">
                  <Target className="h-5 w-5 ml-2" />
                  تصفح السيارات
                </Button>
                <Button variant="outline" size="xl" className="min-w-[200px] bg-white/10 border-white/30 text-white hover:bg-white/20">
                  <Zap className="h-5 w-5 ml-2" />
                  بيع سيارتك الآن
                </Button>
              </div>

              {/* إحصائيات سريعة */}
              <div className="grid grid-cols-3 gap-8 mt-16 max-w-2xl mx-auto">
                <div className="text-center">
                  <div className="text-3xl font-bold">15K+</div>
                  <div className="text-white/80">سيارة متاحة</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold">8K+</div>
                  <div className="text-white/80">مستخدم نشط</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold">95%</div>
                  <div className="text-white/80">رضا العملاء</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* قسم البحث والفلترة */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-foreground mb-4">
                ابحث عن سيارتك المثالية
              </h2>
              <p className="text-lg text-muted-foreground">
                استخدم فلاترنا المتقدمة للعثور على السيارة التي تناسب احتياجاتك وميزانيتك
              </p>
            </div>
            <SearchFilters />
          </div>
        </div>
      </section>

      {/* السيارات المميزة */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-foreground mb-2">
                السيارات المميزة
              </h2>
              <p className="text-lg text-muted-foreground">
                اكتشف أفضل العروض والسيارات المختارة بعناية
              </p>
            </div>
            <Button variant="outline" className="hidden md:flex">
              عرض الكل
              <ArrowLeft className="h-4 w-4 mr-2" />
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {featuredCars.map((car) => (
              <CarCard key={car.id} {...car} />
            ))}
          </div>

          <div className="text-center mt-8">
            <Button variant="default" size="lg">
              عرض المزيد من السيارات
              <ArrowLeft className="h-5 w-5 mr-2" />
            </Button>
          </div>
        </div>
      </section>

      {/* مميزات المنصة */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              لماذا تختار الكرين؟
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              نحن نقدم تجربة شراء وبيع استثنائية مع أحدث التقنيات وأفضل الخدمات
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="card-gradient border-0 shadow-lg text-center p-6 hover:shadow-xl transition-smooth">
              <CardContent className="p-0 space-y-4">
                <div className="w-16 h-16 mx-auto rounded-full primary-gradient flex items-center justify-center">
                  <Shield className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold">آمان مضمون</h3>
                <p className="text-muted-foreground">
                  جميع السيارات محققة ومضمونة من قبل خبرائنا
                </p>
              </CardContent>
            </Card>

            <Card className="card-gradient border-0 shadow-lg text-center p-6 hover:shadow-xl transition-smooth">
              <CardContent className="p-0 space-y-4">
                <div className="w-16 h-16 mx-auto rounded-full secondary-gradient flex items-center justify-center">
                  <TrendingUp className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold">أسعار عادلة</h3>
                <p className="text-muted-foreground">
                  تقييم دقيق للأسعار بناءً على حالة وموديل السيارة
                </p>
              </CardContent>
            </Card>

            <Card className="card-gradient border-0 shadow-lg text-center p-6 hover:shadow-xl transition-smooth">
              <CardContent className="p-0 space-y-4">
                <div className="w-16 h-16 mx-auto rounded-full accent-gradient flex items-center justify-center">
                  <Users className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold">مجتمع موثوق</h3>
                <p className="text-muted-foreground">
                  آلاف المستخدمين المعتمدين والتقييمات الحقيقية
                </p>
              </CardContent>
            </Card>

            <Card className="card-gradient border-0 shadow-lg text-center p-6 hover:shadow-xl transition-smooth">
              <CardContent className="p-0 space-y-4">
                <div className="w-16 h-16 mx-auto rounded-full premium-gradient flex items-center justify-center">
                  <Star className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold">تجربة مميزة</h3>
                <p className="text-muted-foreground">
                  واجهة سهلة الاستخدام مع أدوات بحث متطورة
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* دعوة للعمل */}
      <section className="py-20 primary-gradient">
        <div className="container mx-auto px-4 text-center text-white">
          <div className="max-w-3xl mx-auto space-y-8">
            <Badge variant="new" className="bg-white/20 text-white border-white/30">
              <Award className="h-4 w-4 ml-2" />
              انضم لآلاف البائعين الناجحين
            </Badge>
            
            <h2 className="text-4xl lg:text-5xl font-bold">
              هل تريد بيع سيارتك؟
            </h2>
            
            <p className="text-xl text-white/90">
              انشر إعلانك مجاناً واصل لآلاف المشترين المهتمين في جميع أنحاء السودان
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="accent" size="xl" className="min-w-[200px]">
                <Zap className="h-5 w-5 ml-2" />
                ابدأ البيع الآن
              </Button>
              <Button variant="outline" size="xl" className="min-w-[200px] bg-white/10 border-white/30 text-white hover:bg-white/20">
                تعرف على المزايا
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* الفوتر */}
      <footer className="bg-foreground text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg primary-gradient flex items-center justify-center">
                  <span className="text-white font-bold">ك</span>
                </div>
                <span className="text-xl font-bold">الكرين</span>
              </div>
              <p className="text-white/70">
                منصة السيارات الرائدة في السودان. نربط البائعين والمشترين بطريقة آمنة وموثوقة.
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-bold">روابط سريعة</h3>
              <div className="space-y-2 text-white/70">
                <div>الرئيسية</div>
                <div>السيارات</div>
                <div>المعارض</div>
                <div>قطع الغيار</div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-bold">الدعم</h3>
              <div className="space-y-2 text-white/70">
                <div>مركز المساعدة</div>
                <div>اتصل بنا</div>
                <div>الشروط والأحكام</div>
                <div>سياسة الخصوصية</div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-bold">تواصل معنا</h3>
              <div className="space-y-2 text-white/70">
                <div>📞 +249 123 456 789</div>
                <div>📧 info@alkareen.sd</div>
                <div>📍 الخرطوم، السودان</div>
              </div>
            </div>
          </div>

          <div className="border-t border-white/20 mt-8 pt-8 text-center text-white/70">
            <p>&copy; 2024 الكرين. جميع الحقوق محفوظة.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
