
import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { SearchFilters } from "@/components/SearchFilters";
import { CarCard } from "@/components/CarCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { SlidersHorizontal, Grid, List, Car } from "lucide-react";
import { useSearchFilters, CarData } from "@/hooks/useSearchFilters";

const Cars = () => {
  const [allCars, setAllCars] = useState<CarData[]>([]);
  const [displayedCars, setDisplayedCars] = useState<CarData[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState("newest");
  const { toast } = useToast();
  const { performSearch } = useSearchFilters();

  useEffect(() => {
    fetchCars();
  }, []);

  useEffect(() => {
    applySorting();
  }, [sortBy, allCars]);

  const fetchCars = async () => {
    setLoading(true);
    try {
      const { data: response, error } = await supabase.functions.invoke('get-prioritized-ads', {
        method: 'GET'
      });

      if (error) {
        console.error("Error fetching cars:", error);
        toast({
          title: "خطأ في التحميل",
          description: "حدث خطأ أثناء تحميل السيارات",
          variant: "destructive"
        });
        return;
      }

      const cars = response?.ads || [];
      setAllCars(cars);
      setDisplayedCars(cars);
    } catch (error) {
      console.error("Error fetching cars:", error);
      toast({
        title: "خطأ في التحميل",
        description: "حدث خطأ أثناء تحميل السيارات",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const applySorting = () => {
    let sorted = [...allCars];

    switch (sortBy) {
      case "newest":
        sorted = sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
      case "oldest":
        sorted = sorted.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        break;
      case "price_low":
        sorted = sorted.sort((a, b) => a.price - b.price);
        break;
      case "price_high":
        sorted = sorted.sort((a, b) => b.price - a.price);
        break;
      case "year_new":
        sorted = sorted.sort((a, b) => (b.year || 0) - (a.year || 0));
        break;
      case "year_old":
        sorted = sorted.sort((a, b) => (a.year || 0) - (b.year || 0));
        break;
      default:
        break;
    }

    setDisplayedCars(sorted);
  };

  const handleSearch = (filters: any) => {
    if (Object.keys(filters).length === 0) {
      setDisplayedCars(allCars);
      return;
    }

    const filtered = performSearch(allCars);
    setDisplayedCars(filtered);
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

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-8">
            <h1 className="text-4xl font-bold text-foreground mb-4">
              تصفح السيارات
            </h1>
            <p className="text-lg text-muted-foreground">
              اكتشف آلاف السيارات المتاحة للبيع في جميع أنحاء السودان
            </p>
          </div>
          
          <div className="max-w-6xl mx-auto">
            <SearchFilters onSearch={handleSearch} />
          </div>
        </div>
      </section>

      {/* Results Section */}
      <section className="py-8">
        <div className="container mx-auto px-4">
          {/* Results Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-bold text-foreground">
                النتائج ({displayedCars.length} سيارة)
              </h2>
              <p className="text-muted-foreground">
                عرض السيارات المتاحة
              </p>
            </div>

            <div className="flex items-center gap-4">
              {/* Sort Options */}
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[180px]">
                  <SlidersHorizontal className="h-4 w-4 ml-2" />
                  <SelectValue placeholder="ترتيب حسب" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">الأحدث</SelectItem>
                  <SelectItem value="oldest">الأقدم</SelectItem>
                  <SelectItem value="price_low">السعر: الأقل</SelectItem>
                  <SelectItem value="price_high">السعر: الأعلى</SelectItem>
                  <SelectItem value="year_new">السنة: الأحدث</SelectItem>
                  <SelectItem value="year_old">السنة: الأقدم</SelectItem>
                </SelectContent>
              </Select>

              {/* View Mode Toggle */}
              <div className="flex rounded-lg border p-1">
                <Button
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                  className="px-3"
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                  className="px-3"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Results */}
          {displayedCars.length === 0 ? (
            <Card className="card-gradient border-0 shadow-lg">
              <CardContent className="p-12 text-center">
                <Car className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-bold mb-2">لا توجد سيارات</h3>
                <p className="text-muted-foreground mb-4">
                  لم نجد أي سيارات تطابق معايير البحث الخاصة بك
                </p>
                <Button onClick={() => window.location.reload()}>
                  إعادة المحاولة
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className={
              viewMode === "grid" 
                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                : "space-y-4"
            }>
              {displayedCars.map((car) => (
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
                  topSpot={car.top_spot}
                  topSpotUntil={car.top_spot_until}
                  displayTier={car.display_tier}
                  userId={car.user_id}
                  showBoostButton={true}
                  seller={car.profiles ? {
                    id: car.profiles.user_id,
                    display_name: car.profiles.display_name,
                    avatar_url: car.profiles.avatar_url,
                    membership_type: car.profiles.membership_type
                  } : undefined}
                />
              ))}
            </div>
          )}

          {/* Load More Button */}
          {displayedCars.length > 0 && allCars.length > displayedCars.length && (
            <div className="text-center mt-8">
              <Button variant="outline" size="lg">
                عرض المزيد من السيارات
              </Button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Cars;
