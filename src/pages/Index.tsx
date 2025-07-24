
import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { SearchFilters } from "@/components/SearchFilters";
import { CarCard } from "@/components/CarCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { ArrowRight, TrendingUp, Users, Car, Search, Shield, Clock } from "lucide-react";
import { Link } from "react-router-dom";

const Index = () => {
  const [featuredCars, setFeaturedCars] = useState<any[]>([]);
  const [latestCars, setLatestCars] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalCars: 0,
    totalUsers: 0,
    totalViews: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // جلب الإعلانات المميزة
      const { data: featured, error: featuredError } = await supabase
        .from('ads')
        .select(`
          *,
          profiles (
            user_id,
            display_name,
            avatar_url,
            membership_type
          )
        `)
        .eq('status', 'active')
        .eq('is_featured', true)
        .order('created_at', { ascending: false })
        .limit(6);

      if (featuredError) {
        console.error('Error fetching featured cars:', featuredError);
      } else {
        setFeaturedCars(featured || []);
      }

      // جلب آخر الإعلانات
      const { data: latest, error: latestError } = await supabase
        .from('ads')
        .select(`
          *,
          profiles (
            user_id,
            display_name,
            avatar_url,
            membership_type
          )
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(8);

      if (latestError) {
        console.error('Error fetching latest cars:', latestError);
      } else {
        setLatestCars(latest || []);
      }

      // جلب الإحصائيات
      const { data: adsCount } = await supabase
        .from('ads')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      const { data: usersCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      const { data: viewsData } = await supabase
        .from('ads')
        .select('view_count')
        .eq('status', 'active');

      const totalViews = viewsData?.reduce((sum, ad) => sum + (ad.view_count || 0), 0) || 0;

      setStats({
        totalCars: adsCount?.length || 0,
        totalUsers: usersCount?.length || 0,
        totalViews
      });

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-br from-primary/10 to-secondary/10">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-12">
            <h1 className="text-5xl font-bold text-foreground mb-6">
              أكبر منصة لبيع وشراء السيارات في السودان
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              اكتشف آلاف السيارات المتاحة للبيع أو اعرض سيارتك للبيع بسهولة
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="text-lg px-8">
                <Link to="/cars">
                  <Search className="ml-2 h-5 w-5" />
                  تصفح السيارات
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="text-lg px-8">
                <Link to="/add-ad">
                  <Car className="ml-2 h-5 w-5" />
                  أضف إعلانك
                </Link>
              </Button>
            </div>
          </div>
          
          <div className="max-w-6xl mx-auto">
            <SearchFilters />
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <Card className="text-center p-6 card-gradient border-0 shadow-lg">
              <CardContent className="p-0">
                <div className="flex items-center justify-center mb-4">
                  <div className="p-3 bg-primary/10 rounded-full">
                    <Car className="h-8 w-8 text-primary" />
                  </div>
                </div>
                <div className="text-3xl font-bold text-foreground mb-2">
                  {stats.totalCars.toLocaleString()}
                </div>
                <div className="text-muted-foreground">سيارة متاحة</div>
              </CardContent>
            </Card>
            
            <Card className="text-center p-6 card-gradient border-0 shadow-lg">
              <CardContent className="p-0">
                <div className="flex items-center justify-center mb-4">
                  <div className="p-3 bg-secondary/10 rounded-full">
                    <Users className="h-8 w-8 text-secondary" />
                  </div>
                </div>
                <div className="text-3xl font-bold text-foreground mb-2">
                  {stats.totalUsers.toLocaleString()}
                </div>
                <div className="text-muted-foreground">مستخدم مسجل</div>
              </CardContent>
            </Card>
            
            <Card className="text-center p-6 card-gradient border-0 shadow-lg">
              <CardContent className="p-0">
                <div className="flex items-center justify-center mb-4">
                  <div className="p-3 bg-accent/10 rounded-full">
                    <TrendingUp className="h-8 w-8 text-accent" />
                  </div>
                </div>
                <div className="text-3xl font-bold text-foreground mb-2">
                  {stats.totalViews.toLocaleString()}
                </div>
                <div className="text-muted-foreground">مشاهدة</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Featured Cars Section */}
      {featuredCars.length > 0 && (
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-bold text-foreground mb-2">
                  السيارات المميزة
                </h2>
                <p className="text-muted-foreground">
                  أفضل السيارات المتاحة حالياً
                </p>
              </div>
              <Button asChild variant="outline">
                <Link to="/cars">
                  عرض الكل
                  <ArrowRight className="mr-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
          </div>
        </section>
      )}

      {/* Latest Cars Section */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-foreground mb-2">
                آخر الإعلانات
              </h2>
              <p className="text-muted-foreground">
                أحدث السيارات المضافة للمنصة
              </p>
            </div>
            <Button asChild variant="outline">
              <Link to="/cars">
                عرض الكل
                <ArrowRight className="mr-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {latestCars.map((car) => (
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
              />
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              لماذا تختار منصتنا؟
            </h2>
            <p className="text-lg text-muted-foreground">
              نوفر لك أفضل تجربة لبيع وشراء السيارات
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="text-center p-6 card-gradient border-0 shadow-lg">
              <CardContent className="p-0">
                <div className="flex items-center justify-center mb-4">
                  <div className="p-3 bg-primary/10 rounded-full">
                    <Shield className="h-8 w-8 text-primary" />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">
                  آمن وموثوق
                </h3>
                <p className="text-muted-foreground">
                  جميع الإعلانات مراجعة ومصدقة لضمان الجودة والأمان
                </p>
              </CardContent>
            </Card>
            
            <Card className="text-center p-6 card-gradient border-0 shadow-lg">
              <CardContent className="p-0">
                <div className="flex items-center justify-center mb-4">
                  <div className="p-3 bg-secondary/10 rounded-full">
                    <Search className="h-8 w-8 text-secondary" />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">
                  بحث متقدم
                </h3>
                <p className="text-muted-foreground">
                  ابحث عن السيارة المثالية باستخدام فلاتر متقدمة ومفصلة
                </p>
              </CardContent>
            </Card>
            
            <Card className="text-center p-6 card-gradient border-0 shadow-lg">
              <CardContent className="p-0">
                <div className="flex items-center justify-center mb-4">
                  <div className="p-3 bg-accent/10 rounded-full">
                    <Clock className="h-8 w-8 text-accent" />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">
                  سريع وسهل
                </h3>
                <p className="text-muted-foreground">
                  أضف إعلانك أو ابحث عن سيارتك المثالية في دقائق معدودة
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
