
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';

export interface SearchFilters {
  searchQuery: string;
  city: string;
  minPrice: string;
  maxPrice: string;
}

export const useSearchFilters = () => {
  const [filters, setFilters] = useState<SearchFilters>({
    searchQuery: '',
    city: '',
    minPrice: '',
    maxPrice: ''
  });
  
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const performSearch = async () => {
    // Check if at least one filter is provided
    if (!filters.searchQuery && !filters.city && !filters.minPrice && !filters.maxPrice) {
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

      // Apply search filters
      if (filters.searchQuery) {
        query = query.or(`title.ilike.%${filters.searchQuery}%,brand.ilike.%${filters.searchQuery}%,model.ilike.%${filters.searchQuery}%,description.ilike.%${filters.searchQuery}%`);
      }

      if (filters.city) {
        query = query.ilike('city', `%${filters.city}%`);
      }

      if (filters.minPrice) {
        const minPriceNum = parseInt(filters.minPrice);
        if (!isNaN(minPriceNum)) {
          query = query.gte('price', minPriceNum);
        }
      }

      if (filters.maxPrice) {
        const maxPriceNum = parseInt(filters.maxPrice);
        if (!isNaN(maxPriceNum)) {
          query = query.lte('price', maxPriceNum);
        }
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
      
      // Navigate to search results page
      navigate('/cars');
      
      // Don't show toast if no results, let the UI handle it
      
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
      city: '',
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
