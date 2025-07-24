
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface SearchFilters {
  searchTerm: string;
  searchQuery: string;
  brand: string;
  type: string;
  carType: string;
  location: string;
  state: string;
  yearFrom: string;
  yearTo: string;
  priceFrom: string;
  priceTo: string;
  minPrice: string;
  maxPrice: string;
}

const hasActiveFilters = (currentFilters: SearchFilters): boolean => {
  return Object.values(currentFilters).some(value => value.trim() !== '');
};

export const useSearchFilters = () => {
  const [filters, setFilters] = useState<SearchFilters>({
    searchTerm: '',
    searchQuery: '',
    brand: '',
    type: '',
    carType: '',
    location: '',
    state: '',
    yearFrom: '',
    yearTo: '',
    priceFrom: '',
    priceTo: '',
    minPrice: '',
    maxPrice: ''
  });

  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

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
      if (filters.searchTerm || filters.searchQuery) {
        const searchTerm = filters.searchTerm || filters.searchQuery;
        query = query.or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
      }

      // Apply brand filter
      if (filters.brand && filters.brand !== 'all') {
        query = query.eq('brand', filters.brand);
      }

      // Apply type filter
      if (filters.type && filters.type !== 'all') {
        query = query.eq('type', filters.type);
      }

      if (filters.carType && filters.carType !== 'all') {
        query = query.eq('type', filters.carType);
      }

      // Apply location filter
      if (filters.location) {
        query = query.eq('location', filters.location);
      }

      if (filters.state && filters.state !== 'all') {
        query = query.eq('city', filters.state);
      }

      // Apply year range filter
      if (filters.yearFrom) {
        query = query.gte('year', parseInt(filters.yearFrom));
      }
      if (filters.yearTo) {
        query = query.lte('year', parseInt(filters.yearTo));
      }

      // Apply price range filter
      const minPrice = filters.priceFrom || filters.minPrice;
      const maxPrice = filters.priceTo || filters.maxPrice;
      
      if (minPrice) {
        query = query.gte('price', parseFloat(minPrice));
      }
      if (maxPrice) {
        query = query.lte('price', parseFloat(maxPrice));
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

  const updateFilter = (key: keyof SearchFilters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      searchTerm: '',
      searchQuery: '',
      brand: '',
      type: '',
      carType: '',
      location: '',
      state: '',
      yearFrom: '',
      yearTo: '',
      priceFrom: '',
      priceTo: '',
      minPrice: '',
      maxPrice: ''
    });
    setHasSearched(false);
  };

  const performSearch = async () => {
    setIsSearching(true);
    setHasSearched(true);
  };

  const startSearch = () => {
    setIsSearching(true);
    setHasSearched(true);
  };

  const stopSearch = () => {
    setIsSearching(false);
  };

  useEffect(() => {
    if (hasActiveFilters(filters)) {
      setIsSearching(true);
      setHasSearched(true);
    } else {
      setIsSearching(false);
    }
  }, [filters]);

  return {
    filters,
    setFilters,
    updateFilter,
    clearFilters,
    searchResults,
    isLoading,
    loading: isLoading,
    error,
    isSearching,
    hasSearched,
    startSearch,
    stopSearch,
    performSearch,
    hasActiveFilters: hasActiveFilters(filters)
  };
};
