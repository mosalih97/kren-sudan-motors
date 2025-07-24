
import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { CarCard } from "@/components/CarCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { ArrowRight, Star, Users, TrendingUp, Shield } from "lucide-react";

const Index = () => {
  const [featuredCars, setFeaturedCars] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeaturedCars();
  }, []);

  const fetchFeaturedCars = async () => {
    try {
      // استخدام Edge Function للحصول على الإعلانات المرتبة حسب الأولوية
      const { data: response, error } = await supabase.functions.invoke('get-prioritized-ads', {
        method: 'GET',
        body: { limit: 8 }
      });

      if (error) {
        console.error("Error fetching featured cars:", error);
      } else {
        setFeaturedCars(response?.ads || []);
      }
    } catch (error) {
      console.error("Error fetching featured cars:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="relative py-20 bg-gradient-to-br from-primary/5 to-secondary/5">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6">
              اكتشف سيارة أحلامك
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              الدليل الشامل لشراء وبيع السيارات في السودان
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/cars">
                <Button size="lg" className="text-lg px-8 py-6">
                  تصفح السيارات
                  <ArrowRight className="mr-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/add-ad">
                <Button variant="outline" size="lg" className="text-lg px-8 py-6">
                  أضف إعلانك
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            لماذا تختار الكرين؟
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="card-gradient border-0 shadow-lg">
              <CardHeader className="text-center">
                <Shield className="h-12 w-12 mx-auto mb-4 text-primary" />
                <CardTitle>موثوق وآمن</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-muted-foreground">
                  نضمن لك تجربة آمنة مع نظام تقييم المستخدمين
                </p>
              </CardContent>
            </Card>
            
            <Card className="card-gradient border-0 shadow-lg">
              <CardHeader className="text-center">
                <TrendingUp className="h-12 w-12 mx-auto mb-4 text-primary" />
                <CardTitle>أفضل الأسعار</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-muted-foreground">
                  اعثر على أفضل العروض والصفقات الحصرية
                </p>
              </CardContent>
            </Card>
            
            <Card className="card-gradient border-0 shadow-lg">
              <CardHeader className="text-center">
                <Users className="h-12 w-12 mx-auto mb-4 text-primary" />
                <CardTitle>مجتمع كبير</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-muted-foreground">
                  انضم لآلاف المستخدمين الذين يثقون بنا
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Featured Cars Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold">السيارات المميزة</h2>
            <Link to="/cars">
              <Button variant="outline">
                عرض المزيد
                <ArrowRight className="mr-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
          
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-muted-foreground">جاري التحميل...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {featuredCars.map((car) => (
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
                  userId={car.user_id}
                  seller={car.profiles ? {
                    id: car.profiles.user_id,
                    display_name: car.profiles.display_name,
                    avatar_url: car.profiles.avatar_url,
                    membership_type: car.profiles.membership_type
                  } : undefined}
                  showSellerInfo={true}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold mb-2">10,000+</div>
              <div className="text-primary-foreground/80">إعلان نشط</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">5,000+</div>
              <div className="text-primary-foreground/80">عميل سعيد</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">500+</div>
              <div className="text-primary-foreground/80">صفقة يومية</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">
            هل تريد بيع سيارتك؟
          </h2>
          <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
            انشر إعلانك الآن واصل لآلاف المشترين المحتملين
          </p>
          <Link to="/add-ad">
            <Button size="lg" className="text-lg px-8 py-6">
              أضف إعلانك مجاناً
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Index;
