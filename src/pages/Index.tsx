import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { CarCard } from "@/components/CarCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const [featuredCars, setFeaturedCars] = useState<any[]>([]);
  const [latestCars, setLatestCars] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeaturedCars();
    fetchLatestCars();
  }, []);

  const fetchFeaturedCars = async () => {
    setLoading(true);
    try {
      const { data: response } = await supabase.functions.invoke('get-prioritized-ads', {
        method: 'GET',
      });

      const cars = response?.ads || [];
      // Filter featured cars
      const featured = cars.filter((car: any) => car.is_featured);
      setFeaturedCars(featured);
    } catch (error) {
      console.error("Error fetching featured cars:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLatestCars = async () => {
    setLoading(true);
    try {
      const { data: response } = await supabase.functions.invoke('get-prioritized-ads', {
        method: 'GET',
      });

      const cars = response?.ads || [];
      // Get the 8 latest cars
      const latest = cars.slice(0, 8);
      setLatestCars(latest);
    } catch (error) {
      console.error("Error fetching latest cars:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-12">
            <h1 className="text-5xl font-bold text-foreground mb-6">
              السوق السوداني للسيارات
            </h1>
            <p className="text-lg text-muted-foreground">
              ابحث عن سيارتك المثالية أو قم ببيعها بسرعة وسهولة
            </p>
            <div className="mt-8">
              <Link to="/cars">
                <Button size="lg">
                  تصفح السيارات <ArrowRight className="h-5 w-5 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Cars Section */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              سيارات مميزة
            </h2>
            <p className="text-lg text-muted-foreground">
              اكتشف أفضل العروض المتاحة
            </p>
          </div>

          {featuredCars.length > 0 ? (
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
          ) : (
            <Card className="card-gradient border-0 shadow-lg">
              <CardContent className="p-12 text-center">
                <h3 className="text-xl font-bold mb-2">لا توجد سيارات مميزة</h3>
                <p className="text-muted-foreground mb-4">
                  نحن نعمل على إضافة المزيد من السيارات المميزة قريباً.
                </p>
                <Button onClick={() => window.location.reload()}>
                  إعادة المحاولة
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </section>

      {/* Latest Cars Section */}
      <section className="py-16 bg-muted">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              أحدث السيارات
            </h2>
            <p className="text-lg text-muted-foreground">
              تصفح أحدث الإعلانات المضافة
            </p>
          </div>

          {latestCars.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
                  showSellerInfo={true}
                />
              ))}
            </div>
          ) : (
            <Card className="card-gradient border-0 shadow-lg">
              <CardContent className="p-12 text-center">
                <h3 className="text-xl font-bold mb-2">لا توجد أحدث السيارات</h3>
                <p className="text-muted-foreground mb-4">
                  نحن نعمل على إضافة المزيد من السيارات قريباً.
                </p>
                <Button onClick={() => window.location.reload()}>
                  إعادة المحاولة
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="py-24 bg-primary text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-6">
            هل لديك سيارة للبيع؟
          </h2>
          <p className="text-lg mb-8">
            انشر إعلانك الآن وابدأ في البيع بسرعة
          </p>
          <Link to="/add-ad">
            <Button variant="secondary" size="lg">
              أضف إعلانك الآن
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Index;
