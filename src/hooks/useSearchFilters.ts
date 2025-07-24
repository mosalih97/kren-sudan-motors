
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface SearchFilters {
  searchTerm: string;
  brand: string;
  type: string;
  location: string;
  yearFrom: string;
  yearTo: string;
  priceFrom: string;
  priceTo: string;
}

export const useSearchFilters = () => {
  const [filters, setFilters] = useState<SearchFilters>({
    searchTerm: '',
    brand: '',
    type: '',
    location: '',
    yearFrom: '',
    yearTo: '',
    priceFrom: '',
    priceTo: ''
  });

  const [isSearching, setIsSearching] = useState(false);

  const { data: searchResults = [], isLoading, error } = useQuery({
    queryKey: ['searchAds', filters],
    queryFn: async () => {
      if (!hasActiveFilters(filters)) {
        return [];
      }

      let query = supabase
        .from('ads')
        .select(`
          *,
          profiles!ads_user_id_fkey(display_name, phone, whatsapp)
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      // Apply search term filter
      if (filters.searchTerm) {
        query = query.or(`title.ilike.%${filters.searchTerm}%,description.ilike.%${filters.searchTerm}%`);
      }

      // Apply brand filter
      if (filters.brand) {
        query = query.eq('brand', filters.brand);
      }

      // Apply type filter
      if (filters.type) {
        query = query.eq('type', filters.type);
      }

      // Apply location filter
      if (filters.location) {
        query = query.eq('location', filters.location);
      }

      // Apply year range filter
      if (filters.yearFrom) {
        query = query.gte('year', parseInt(filters.yearFrom));
      }
      if (filters.yearTo) {
        query = query.lte('year', parseInt(filters.yearTo));
      }

      // Apply price range filter
      if (filters.priceFrom) {
        query = query.gte('price', parseFloat(filters.priceFrom));
      }
      if (filters.priceTo) {
        query = query.lte('price', parseFloat(filters.priceTo));
      }

      const { data, error } = await query;
      
      if (error) {
        console.error('خطأ في البحث:', error);
        throw error;
      }

      return data || [];
    },
    enabled: hasActiveFilters(filters)
  });

  const hasActiveFilters = (currentFilters: SearchFilters): boolean => {
    return Object.values(currentFilters).some(value => value.trim() !== '');
  };

  const updateFilter = (key: keyof SearchFilters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      searchTerm: '',
      brand: '',
      type: '',
      location: '',
      yearFrom: '',
      yearTo: '',
      priceFrom: '',
      priceTo: ''
    });
  };

  const startSearch = () => {
    setIsSearching(true);
  };

  const stopSearch = () => {
    setIsSearching(false);
  };

  useEffect(() => {
    if (hasActiveFilters(filters)) {
      setIsSearching(true);
    } else {
      setIsSearching(false);
    }
  }, [filters]);

  return {
    filters,
    updateFilter,
    clearFilters,
    searchResults,
    isLoading,
    error,
    isSearching,
    startSearch,
    stopSearch,
    hasActiveFilters: hasActiveFilters(filters)
  };
};
