
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface SearchFilters {
  searchQuery: string;
  brand: string;
  price: string;
  minPrice: string;
  maxPrice: string;
  minYear: string;
  maxYear: string;
  fuelType: string;
  transmission: string;
  city: string;
}

export const useSearchFilters = () => {
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({
    searchQuery: '',
    brand: '',
    price: '',
    minPrice: '',
    maxPrice: '',
    minYear: '',
    maxYear: '',
    fuelType: '',
    transmission: '',
    city: ''
  });

  const performSearch = async () => {
    await searchCars(filters);
  };

  const searchCars = async (searchFilters: Partial<SearchFilters>) => {
    setLoading(true);
    setHasSearched(true);
    
    try {
      let query = supabase
        .from('ads')
        .select(`
          *,
          profiles!ads_user_id_fkey(
            user_id,
            display_name,
            avatar_url,
            membership_type
          )
        `)
        .eq('status', 'active');

      // Apply filters
      if (searchFilters.searchQuery) {
        query = query.or(`title.ilike.%${searchFilters.searchQuery}%,description.ilike.%${searchFilters.searchQuery}%`);
      }
      
      if (searchFilters.brand) {
        query = query.eq('brand', searchFilters.brand);
      }
      
      if (searchFilters.minPrice) {
        query = query.gte('price', parseInt(searchFilters.minPrice));
      }
      
      if (searchFilters.maxPrice) {
        query = query.lte('price', parseInt(searchFilters.maxPrice));
      }

      if (searchFilters.price) {
        query = query.lte('price', parseInt(searchFilters.price));
      }
      
      if (searchFilters.minYear) {
        query = query.gte('year', parseInt(searchFilters.minYear));
      }
      
      if (searchFilters.maxYear) {
        query = query.lte('year', parseInt(searchFilters.maxYear));
      }
      
      if (searchFilters.fuelType) {
        query = query.eq('fuel_type', searchFilters.fuelType);
      }
      
      if (searchFilters.transmission) {
        query = query.eq('transmission', searchFilters.transmission);
      }
      
      if (searchFilters.city) {
        query = query.ilike('city', `%${searchFilters.city}%`);
      }

      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) throw error;
      
      setSearchResults(data || []);
      setFilters(prev => ({ ...prev, ...searchFilters }));
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setSearchResults([]);
    setHasSearched(false);
    setFilters({
      searchQuery: '',
      brand: '',
      price: '',
      minPrice: '',
      maxPrice: '',
      minYear: '',
      maxYear: '',
      fuelType: '',
      transmission: '',
      city: ''
    });
  };

  const clearSearch = clearFilters;

  return {
    searchResults,
    loading,
    hasSearched,
    filters,
    setFilters,
    performSearch,
    searchCars,
    clearFilters,
    clearSearch
  };
};
