
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

export interface SearchFilters {
  searchQuery: string;
  brand: string;
  carType: string;
  state: string;
  yearFrom: string;
  yearTo: string;
  minPrice: string;
  maxPrice: string;
}

export const useSearchFilters = () => {
  const [filters, setFilters] = useState<SearchFilters>({
    searchQuery: '',
    brand: '',
    carType: '',
    state: '',
    yearFrom: '',
    yearTo: '',
    minPrice: '',
    maxPrice: ''
  });
  
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const { toast } = useToast();

  const performSearch = async () => {
    if (!filters.searchQuery && !filters.brand && !filters.carType && !filters.state && !filters.yearFrom && !filters.yearTo && !filters.minPrice && !filters.maxPrice) {
      toast({
        title: "تنبيه",
        description: "يرجى إدخال معايير البحث",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    setHasSearched(true);

    try {
      let query = supabase
        .from('ads')
        .select(`
          *,
          profiles!ads_user_id_fkey(
            display_name,
            avatar_url,
            membership_type,
            user_id_display
          )
        `)
        .eq('status', 'active');

      // Apply filters
      if (filters.searchQuery) {
        query = query.or(`title.ilike.%${filters.searchQuery}%,brand.ilike.%${filters.searchQuery}%,model.ilike.%${filters.searchQuery}%,description.ilike.%${filters.searchQuery}%`);
      }

      if (filters.brand && filters.brand !== 'all') {
        query = query.eq('brand', filters.brand);
      }

      if (filters.carType && filters.carType !== 'all') {
        // Assuming car type is stored in a field, adjust as needed
        query = query.eq('car_type', filters.carType);
      }

      if (filters.state && filters.state !== 'all') {
        query = query.eq('city', filters.state);
      }

      if (filters.yearFrom) {
        query = query.gte('year', parseInt(filters.yearFrom));
      }

      if (filters.yearTo) {
        query = query.lte('year', parseInt(filters.yearTo));
      }

      if (filters.minPrice) {
        query = query.gte('price', parseInt(filters.minPrice));
      }

      if (filters.maxPrice) {
        query = query.lte('price', parseInt(filters.maxPrice));
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        console.error('Search error:', error);
        toast({
          title: "خطأ في البحث",
          description: "حدث خطأ أثناء البحث، يرجى المحاولة مرة أخرى",
          variant: "destructive"
        });
        return;
      }

      setSearchResults(data || []);
      
      toast({
        title: "نتائج البحث",
        description: `تم العثور على ${data?.length || 0} نتيجة`,
        variant: "default"
      });

    } catch (error) {
      console.error('Search error:', error);
      toast({
        title: "خطأ في البحث",
        description: "حدث خطأ أثناء البحث، يرجى المحاولة مرة أخرى",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setFilters({
      searchQuery: '',
      brand: '',
      carType: '',
      state: '',
      yearFrom: '',
      yearTo: '',
      minPrice: '',
      maxPrice: ''
    });
    setSearchResults([]);
    setHasSearched(false);
  };

  return {
    filters,
    setFilters,
    searchResults,
    loading,
    hasSearched,
    performSearch,
    clearFilters
  };
};
