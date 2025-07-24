
import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { SearchFilters } from "@/components/SearchFilters";
import { SearchResults } from "@/components/SearchResults";
import { useSearch } from "@/hooks/useSearch";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Car, Users, Shield, Zap } from "lucide-react";
import { Link } from "react-router-dom";

const Index = () => {
  const { results, loading, hasSearched, handleSearch } = useSearch();
  const [featuredCars, setFeaturedCars] = useState<any[]>([]);

  useEffect(() => {
    const fetchFeaturedCars = async () => {
      const { data, error } = await supabase
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
        .limit(8);

      if (error) {
        console.error('Error fetching featured cars:', error);
      } else {
        setFeaturedCars(data || []);
      }
    };

    fetchFeaturedCars();
  }, []);

  const features = [
    {
      icon: Car,
      title: "أكبر تشكيلة",
      description: "آلاف السيارات من جميع الماركات والموديلات"
    },
    {
      icon: Users,
      title: "مجتمع موثوق",
      description: "تواصل مع بائعين معتمدين وموثوقين"
    },
    {
      icon: Shield,
      title: "أمان مضمون",
      description: "حماية كاملة لبياناتك ومعاملاتك"
    },
    {
      icon: Zap,
      title: "سرعة في التواصل",
      description: "تواصل فوري مع البائعين"
    }
  ];

  const displayResults = hasSearched ? results : featuredCars;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      <Header />
      
      {/* Hero Section */}
      <section className="hero-gradient py-20 text-center">
        <div className="container mx-auto px-4">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
            الكرين
          </h1>
          <p className="text-xl md:text-2xl text-white/90 mb-8 max-w-3xl mx-auto">
            منصة السيارات الأولى في السودان - اكتشف، اشتري، وبع بكل سهولة
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="bg-white text-primary hover:bg-white/90">
              <Link to="/cars">تصفح السيارات</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
              <Link to="/add-ad">أضف إعلانك</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Search Section */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              ابحث عن سيارتك المثالية
            </h2>
            <p className="text-lg text-muted-foreground">
              استخدم فلاتر البحث المتقدمة للعثور على السيارة التي تناسب احتياجاتك
            </p>
          </div>
          
          <SearchFilters onSearch={handleSearch} />
          
          {(hasSearched || featuredCars.length > 0) && (
            <SearchResults 
              results={displayResults}
              loading={loading}
              hasSearched={hasSearched}
              searchQuery=""
            />
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              لماذا تختار الكرين؟
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              نحن نقدم أفضل تجربة لبيع وشراء السيارات في السودان
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="card-gradient border-0 shadow-lg hover:shadow-xl transition-shadow">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
