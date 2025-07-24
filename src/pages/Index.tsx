import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CarCard } from "@/components/CarCard";
import { SearchFilters } from "@/components/SearchFilters";
import { Header } from "@/components/Header";
import { Car, TrendingUp, Users, Shield } from "lucide-react";

interface Ad {
  id: string;
  title: string;
  price: number;
  brand: string;
  model: string;
  year: number;
  city: string;
  mileage: string;
  fuel_type: string;
  transmission: string;
  images: string[];
  view_count: number;
  is_premium: boolean;
  is_featured: boolean;
  is_new: boolean;
  user_id: string;
  profiles: {
    display_name: string;
    membership_type: string;
    phone: string;
    whatsapp: string;
    city: string;
  };
}

export default function Index() {
  const [featuredAds, setFeaturedAds] = useState<Ad[]>([]);
  const [recentAds, setRecentAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAds();
  }, []);

  const fetchAds = async () => {
    setLoading(true);
    
    // Fetch featured ads (premium users' ads)
    const { data: featured, error: featuredError } = await supabase
      .from('ads')
      .select(`
        *,
        profiles:user_id (
          display_name,
          membership_type,
          phone,
          whatsapp,
          city
        )
      `)
      .eq('status', 'active')
      .eq('is_premium', true)
      .order('created_at', { ascending: false })
      .limit(6);

    if (featuredError) {
      console.error('Error fetching featured ads:', featuredError);
    } else {
      setFeaturedAds(featured || []);
    }

    // Fetch recent ads
    const { data: recent, error: recentError } = await supabase
      .from('ads')
      .select(`
        *,
        profiles:user_id (
          display_name,
          membership_type,
          phone,
          whatsapp,
          city
        )
      `)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(8);

    if (recentError) {
      console.error('Error fetching recent ads:', recentError);
    } else {
      setRecentAds(recent || []);
    }
    
    setLoading(false);
  };

  const handleFilterChange = (filters: any) => {
    // Navigate to cars page with filters
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        params.append(key, value as string);
      }
    });
    window.location.href = `/cars?${params.toString()}`;
  };

  const stats = [
    { label: 'سيارة معروضة', value: '1000+', icon: Car },
    { label: 'مستخدم نشط', value: '500+', icon: Users },
    { label: 'صفقة ناجحة', value: '250+', icon: TrendingUp },
    { label: 'آمان وثقة', value: '100%', icon: Shield },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-primary to-primary/80 text-primary-foreground">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              سوق السيارات السوداني
            </h1>
            <p className="text-xl md:text-2xl mb-8 opacity-90">
              اكتشف أفضل العروض للسيارات في السودان
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" variant="secondary">
                <Link to="/cars">تصفح السيارات</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/add-ad">أضف إعلانك</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Search Section */}
      <section className="py-12 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-center mb-8">
              ابحث عن سيارتك المثالية
            </h2>
            <SearchFilters onFilterChange={handleFilterChange} />
          </div>
        </div>
      </section>

      {/* Featured Ads Section */}
      {featuredAds.length > 0 && (
        <section className="py-12">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-bold">إعلانات مميزة</h2>
              <Button asChild variant="outline">
                <Link to="/cars">عرض المزيد</Link>
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredAds.map((ad) => (
                <CarCard
                  key={ad.id}
                  id={ad.id}
                  title={ad.title}
                  price={ad.price}
                  location={ad.city}
                  year={ad.year}
                  mileage={ad.mileage}
                  fuelType={ad.fuel_type}
                  transmission={ad.transmission}
                  image={ad.images?.[0]}
                  isPremium={ad.is_premium}
                  isFeatured={ad.is_featured}
                  isNew={false}
                  viewCount={ad.view_count}
                  userId={ad.user_id}
                  seller={{
                    name: ad.profiles?.display_name || 'مستخدم',
                    membershipType: ad.profiles?.membership_type || 'free',
                    phone: ad.profiles?.phone,
                    whatsapp: ad.profiles?.whatsapp,
                    city: ad.profiles?.city
                  }}
                  showSellerInfo={true}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Recent Ads Section */}
      <section className="py-12 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold">أحدث الإعلانات</h2>
            <Button asChild variant="outline">
              <Link to="/cars">عرض الكل</Link>
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {recentAds.map((ad) => (
              <CarCard
                key={ad.id}
                id={ad.id}
                title={ad.title}
                price={ad.price}
                location={ad.city}
                year={ad.year}
                mileage={ad.mileage}
                fuelType={ad.fuel_type}
                transmission={ad.transmission}
                image={ad.images?.[0]}
                isPremium={ad.is_premium}
                isFeatured={ad.is_featured}
                isNew={false}
                viewCount={ad.view_count}
                userId={ad.user_id}
                seller={{
                  name: ad.profiles?.display_name || 'مستخدم',
                  membershipType: ad.profiles?.membership_type || 'free',
                  phone: ad.profiles?.phone,
                  whatsapp: ad.profiles?.whatsapp,
                  city: ad.profiles?.city
                }}
                showSellerInfo={true}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="text-center">
              <CardHeader>
                <Car className="h-8 w-8 mx-auto mb-2 text-primary" />
                <CardTitle>1000+</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">سيارة معروضة</p>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardHeader>
                <Users className="h-8 w-8 mx-auto mb-2 text-primary" />
                <CardTitle>500+</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">مستخدم نشط</p>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardHeader>
                <TrendingUp className="h-8 w-8 mx-auto mb-2 text-primary" />
                <CardTitle>250+</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">صفقة ناجحة</p>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardHeader>
                <Shield className="h-8 w-8 mx-auto mb-2 text-primary" />
                <CardTitle>100%</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">آمان وثقة</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
