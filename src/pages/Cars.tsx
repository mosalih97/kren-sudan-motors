
import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { SearchFilters } from "@/components/SearchFilters";
import { SearchResults } from "@/components/SearchResults";
import { useSearch } from "@/hooks/useSearch";
import { supabase } from "@/integrations/supabase/client";

const Cars = () => {
  const { results, loading, hasSearched, handleSearch } = useSearch();
  const [allCars, setAllCars] = useState<any[]>([]);

  useEffect(() => {
    const fetchAllCars = async () => {
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
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching cars:', error);
      } else {
        setAllCars(data || []);
      }
    };

    fetchAllCars();
  }, []);

  const displayResults = hasSearched ? results : allCars;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            سوق السيارات السوداني
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            اكتشف أفضل السيارات المتاحة في السودان مع أدوات البحث المتقدمة
          </p>
        </div>

        <SearchFilters onSearch={handleSearch} />
        
        <SearchResults 
          results={displayResults}
          loading={loading}
          hasSearched={hasSearched}
          searchQuery=""
        />
      </main>
    </div>
  );
};

export default Cars;
