
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Header } from "@/components/Header";
import { BackButton } from "@/components/BackButton";
import { CarCard } from "@/components/CarCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { SlidersHorizontal, Grid, List, Car, Search, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const SearchResults = () => {
  const [searchParams] = useSearchParams();
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState("newest");
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const searchQuery = searchParams.get('q') || '';
  const city = searchParams.get('city') || '';
  const price = searchParams.get('price') || '';

  useEffect(() => {
    performSearch();
  }, [searchQuery, city, price, sortBy]);

  const performSearch = async () => {
    setLoading(true);
    setError(null);
    
    try {
      let query = supabase
        .from('ads')
        .select(`
          *,
          profiles!ads_user_id_fkey(
            display_name,
            avatar_url,
            membership_type,
            user_id
          )
        `)
        .eq('status', 'active');

      // Apply search filters
      if (searchQuery) {
        query = query.or(`title.ilike.%${searchQuery}%,brand.ilike.%${searchQuery}%,model.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
      }

      if (city) {
        query = query.ilike('city', `%${city}%`);
      }

      if (price) {
        const priceNum = parseInt(price);
        if (!isNaN(priceNum)) {
          query = query.lte('price', priceNum);
        }
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        console.error('Search error:', error);
        setError('حدث خطأ أثناء البحث');
        toast({
          title: "خطأ في البحث",
          description: "حدث خطأ أثناء البحث، يرجى المحاولة مرة أخرى",
          variant: "destructive"
        });
        return;
      }

      let searchResults = data || [];

      // Apply sorting
      switch (sortBy) {
        case "newest":
          searchResults = searchResults.sort((a: any, b: any) => 
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
          break;
        case "oldest":
          searchResults = searchResults.sort((a: any, b: any) => 
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          );
          break;
        case "price_low":
          searchResults = searchResults.sort((a: any, b: any) => a.price - b.price);
          break;
        case "price_high":
          searchResults = searchResults.sort((a: any, b: any) => b.price - a.price);
          break;
        default:
          break;
      }

      setResults(searchResults);
      
    } catch (error) {
      console.error('Search error:', error);
      setError('حدث خطأ أثناء البحث');
      toast({
        title: "خطأ في البحث",
        description: "حدث خطأ أثناء البحث، يرجى المحاولة مرة أخرى",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getSearchSummary = () => {
    const parts = [];
    if (searchQuery) parts.push(`"${searchQuery}"`);
    if (city) parts.push(`في ${city}`);
    if (price) parts.push(`بسعر أقل من ${parseInt(price).toLocaleString('ar-SD')} جنيه`);
    
    return parts.length > 0 ? `البحث عن: ${parts.join(' - ')}` : 'نتائج البحث';
  };

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <BackButton />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-4 text-destructive">خطأ في البحث</h2>
              <p className="text-muted-foreground mb-4">{error}</p>
              <Link to="/">
                <Button>العودة للرئيسية</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <BackButton />
      
      {/* Header Section */}
      <section className="py-8 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-4 mb-6">
            <Link to="/" className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors">
              <ArrowRight className="h-5 w-5" />
              العودة للرئيسية
            </Link>
          </div>
          
          <div className="flex items-center gap-3 mb-4">
            <Search className="h-6 w-6 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">
              نتائج البحث
            </h1>
          </div>
          
          <p className="text-lg text-muted-foreground">
            {getSearchSummary()} - {loading ? 'جاري البحث...' : `تم العثور على ${results.length} نتيجة`}
          </p>
        </div>
      </section>

      {/* Results Section */}
      <section className="py-8">
        <div className="container mx-auto px-4">
          {/* Results Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-bold text-foreground">
                نتائج البحث ({loading ? '...' : results.length} سيارة)
              </h2>
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
          {loading ? (
            <div className="text-center py-8">
              <div className="inline-flex items-center gap-2 text-lg font-medium">
                <Search className="h-5 w-5 animate-spin" />
                جاري البحث...
              </div>
            </div>
          ) : results.length === 0 ? (
            <Card className="card-gradient border-0 shadow-lg">
              <CardContent className="p-12 text-center">
                <Car className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-bold mb-2">لا توجد نتائج</h3>
                <p className="text-muted-foreground mb-4">
                  لم نجد أي سيارات تطابق معايير البحث الخاصة بك
                </p>
                <p className="text-sm text-muted-foreground mb-6">
                  جرب تعديل معايير البحث أو إزالة بعض الفلاتر
                </p>
                <Link to="/">
                  <Button variant="outline">
                    العودة للبحث
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className={
              viewMode === "grid" 
                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                : "space-y-4"
            }>
              {results.map((car) => (
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
        </div>
      </section>
    </div>
  );
};

export default SearchResults;
