import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { SearchFilters } from "@/components/SearchFilters";
import { CarCard } from "@/components/CarCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, Users, Shield, Star, ArrowLeft, Zap, Target, Award } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";


const Index = () => {
  const [featuredCars, setFeaturedCars] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeaturedCars();
  }, []);

  const fetchFeaturedCars = async () => {
    try {
      const { data, error } = await supabase
        .from("ads")
        .select(`
          *,
          profiles!ads_user_id_fkey(
            user_id,
            display_name,
            avatar_url,
            membership_type
          )
        `)
        .eq("status", "active")
        .or("is_featured.eq.true,is_premium.eq.true")
        .order("created_at", { ascending: false })
        .limit(4);

      if (error) throw error;
      setFeaturedCars(data || []);
    } catch (error) {
      console.error("Error fetching featured cars:", error);
      // استخدام البيانات التجريبية في حالة الخطأ
      setFeaturedCars([]);
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* القسم الرئيسي الجذاب */}
      <section className="relative overflow-hidden">
        <div className="hero-gradient py-20 lg:py-32">
          <div className="container mx-auto px-4 text-center text-white">
            <div className="max-w-4xl mx-auto space-y-8">
              <div className="inline-block bg-gradient-to-r from-orange-400 to-orange-500 text-white px-6 py-2 rounded-full text-sm font-medium mb-8 shadow-lg whitespace-nowrap">
                🚀 الآن في السودان - منصة السيارات الأكثر تطوراً
              </div>
              
              <h1 className="text-4xl lg:text-6xl font-bold leading-tight font-almarai">
                بيع واشتري بمزاجك مع
                <br />
                 <span className="bg-white/20 backdrop-blur-sm rounded-2xl px-6 py-3 inline-block mt-4 font-scheherazade">
                   الكرين
                 </span>
              </h1>
              
              <p className="text-xl lg:text-2xl text-white/90 max-w-2xl mx-auto">
                أكبر سوق إلكتروني للسيارات في السودان. آلاف السيارات، أسعار تنافسية، وتجربة شراء استثنائية
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-8">
                <Link to="/cars">
                  <Button variant="accent" size="xl" className="min-w-[200px]">
                    <Target className="h-5 w-5 ml-2" />
                    تصفح السيارات
                  </Button>
                </Link>
                <Link to="/add-ad">
                  <Button variant="outline" size="xl" className="min-w-[200px] bg-white/10 border-white/30 text-white hover:bg-white/20">
                    <Zap className="h-5 w-5 ml-2" />
                    بيع سيارتك الآن
                  </Button>
                </Link>
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
            {loading ? (
              // Loading skeleton
              Array.from({ length: 4 }).map((_, i) => (
                <Card key={i} className="card-gradient border-0 shadow-lg">
                  <div className="h-48 bg-muted animate-pulse rounded-t-lg"></div>
                  <CardContent className="p-4 space-y-3">
                    <div className="h-4 bg-muted animate-pulse rounded"></div>
                    <div className="h-4 bg-muted animate-pulse rounded w-3/4"></div>
                    <div className="h-4 bg-muted animate-pulse rounded w-1/2"></div>
                  </CardContent>
                </Card>
              ))
            ) : featuredCars.length > 0 ? (
              featuredCars.map((car) => (
                 <CarCard 
                  key={car.id} 
                  id={car.id}
                  title={car.title}
                  price={car.price}
                  location={car.city}
                  year={car.year}
                  mileage={car.mileage}
                  fuelType={car.fuel_type}
                  transmission={car.transmission}
                  image={car.images?.[0] || "https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=400&h=300&fit=crop"}
                  isPremium={car.is_premium}
                  isFeatured={car.is_featured}
                  isNew={car.condition === "جديدة"}
                  viewCount={car.view_count}
                  creditsRequired={1}
                  seller={car.profiles ? {
                    id: car.profiles.user_id,
                    display_name: car.profiles.display_name,
                    avatar_url: car.profiles.avatar_url,
                    membership_type: car.profiles.membership_type
                  } : undefined}
                  showSellerInfo={true}
                />
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <p className="text-muted-foreground">لا توجد سيارات مميزة حالياً</p>
              </div>
            )}
          </div>

          <div className="text-center mt-8">
            <Link to="/cars">
              <Button variant="default" size="lg">
                عرض المزيد من السيارات
                <ArrowLeft className="h-5 w-5 mr-2" />
              </Button>
            </Link>
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
              <Link to="/add-ad">
                <Button variant="accent" size="xl" className="min-w-[200px]">
                  <Zap className="h-5 w-5 ml-2" />
                  ابدأ البيع الآن
                </Button>
              </Link>
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
                <span className="text-xl font-bold font-amiri">الكرين</span>
              </div>
              <p className="text-white/70">
                منصة السيارات الرائدة في السودان. نربط البائعين والمشترين بطريقة آمنة وموثوقة.
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-bold">تواصل معنا</h3>
              <div className="space-y-4">
                {/* زر واتساب عصري */}
                <a 
                  href="https://wa.me/249966960202"
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-xl hover:shadow-lg transition-smooth mb-3"
                  style={{ background: 'var(--gradient-accent)' }}
                >
                  <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.570-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                    </svg>
                  </div>
                  <div className="text-right">
                    <div className="text-white font-semibold">واتساب</div>
                    <div className="text-white/80 text-sm">+249 966 960 202</div>
                  </div>
                </a>

                {/* زر الإيميل عصري */}
                <a 
                  href="mailto:info@alkeren.com"
                  className="flex items-center gap-3 p-3 rounded-xl hover:shadow-lg transition-smooth"
                  style={{ background: 'var(--gradient-secondary)' }}
                >
                  <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="text-right">
                    <div className="text-white font-semibold">البريد الإلكتروني</div>
                    <div className="text-white/80 text-sm">info@alkeren.com</div>
                  </div>
                </a>

                <div className="text-white/70 text-sm">📍 الخرطوم، السودان</div>
              </div>
            </div>
          </div>

          <div className="border-t border-white/20 mt-8 pt-8 text-center text-white/70">
            <p>&copy; 2025 الكرين. جميع الحقوق محفوظة.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
