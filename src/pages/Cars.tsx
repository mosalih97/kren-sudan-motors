import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CarCard } from "@/components/CarCard";
import { SearchFilters } from "@/components/SearchFilters";
import { Header } from "@/components/Header";
import { Loader2 } from "lucide-react";

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

export default function Cars() {
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: "",
    brand: "",
    city: "",
    minPrice: "",
    maxPrice: "",
    year: "",
    transmission: "",
    fuelType: ""
  });

  useEffect(() => {
    fetchAds();
  }, [filters]);

  const fetchAds = async () => {
    setLoading(true);
    
    let query = supabase
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
      .order('is_premium', { ascending: false })
      .order('created_at', { ascending: false });

    // Apply filters
    if (filters.search) {
      query = query.or(`title.ilike.%${filters.search}%,brand.ilike.%${filters.search}%,model.ilike.%${filters.search}%`);
    }
    
    if (filters.brand) {
      query = query.eq('brand', filters.brand);
    }
    
    if (filters.city) {
      query = query.eq('city', filters.city);
    }
    
    if (filters.minPrice) {
      query = query.gte('price', parseInt(filters.minPrice));
    }
    
    if (filters.maxPrice) {
      query = query.lte('price', parseInt(filters.maxPrice));
    }
    
    if (filters.year) {
      query = query.eq('year', parseInt(filters.year));
    }
    
    if (filters.transmission) {
      query = query.eq('transmission', filters.transmission);
    }
    
    if (filters.fuelType) {
      query = query.eq('fuel_type', filters.fuelType);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching ads:', error);
    } else {
      setAds(data || []);
    }
    
    setLoading(false);
  };

  const handleFilterChange = (newFilters: typeof filters) => {
    setFilters(newFilters);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">جميع السيارات</h1>
          <p className="text-muted-foreground">
            تصفح مجموعة واسعة من السيارات المعروضة للبيع
          </p>
        </div>

        <SearchFilters onFilterChange={handleFilterChange} />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {ads.map((ad) => (
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

        {ads.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">لا توجد إعلانات مطابقة للبحث</p>
          </div>
        )}
      </div>
    </div>
  );
}
