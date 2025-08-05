
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';

export interface SearchFilters {
  searchQuery: string;
  city: string;
  price: string;
}

export const useSearchFilters = () => {
  const [filters, setFilters] = useState<SearchFilters>({
    searchQuery: '',
    city: '',
    price: ''
  });
  
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const performSearch = async () => {
    // Check if at least one filter is provided and has valid content
    const hasSearchQuery = filters.searchQuery && filters.searchQuery.trim();
    const hasCity = filters.city && filters.city.trim();
    const hasPrice = filters.price && filters.price.trim() && !isNaN(parseInt(filters.price)) && parseInt(filters.price) > 0;

    if (!hasSearchQuery && !hasCity && !hasPrice) {
      toast({
        title: "تنبيه",
        description: "يرجى إدخال كلمة بحث أو تحديد مدينة أو سعر",
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

      // Apply search filters - each works independently
      if (hasSearchQuery) {
        query = query.or(`title.ilike.%${filters.searchQuery.trim()}%,brand.ilike.%${filters.searchQuery.trim()}%,model.ilike.%${filters.searchQuery.trim()}%,description.ilike.%${filters.searchQuery.trim()}%`);
      }

      if (hasCity) {
        query = query.ilike('city', `%${filters.city.trim()}%`);
      }

      if (hasPrice) {
        const priceNum = parseInt(filters.price.trim());
        query = query.lte('price', priceNum);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        console.error('Search error:', error);
        toast({
          title: "خطأ في البحث",
          description: "حدث خطأ أثناء البحث، يرجى المحاولة مرة أخرى",
          variant: "destructive"
        });
        setSearchResults([]);
        return;
      }

      setSearchResults(data || []);
      
      // Navigate to search results page with search params
      const searchParams = new URLSearchParams();
      if (hasSearchQuery) searchParams.set('q', filters.searchQuery.trim());
      if (hasCity) searchParams.set('city', filters.city.trim());
      if (hasPrice) searchParams.set('price', filters.price.trim());
      
      navigate(`/search-results?${searchParams.toString()}`);
      
    } catch (error) {
      console.error('Search error:', error);
      toast({
        title: "خطأ في البحث",
        description: "حدث خطأ أثناء البحث، يرجى المحاولة مرة أخرى",
        variant: "destructive"
      });
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setFilters({
      searchQuery: '',
      city: '',
      price: ''
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
