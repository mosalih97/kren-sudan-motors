
import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface SearchFilters {
  brand: string;
  model: string;
  yearFrom: string;
  yearTo: string;
  priceFrom: string;
  priceTo: string;
  condition: string;
  transmission: string;
  location: string;
  searchTerm: string;
  searchQuery: string;
  carType: string;
  state: string;
  minPrice: string;
  maxPrice: string;
}

const initialFilters: SearchFilters = {
  brand: '',
  model: '',
  yearFrom: '',
  yearTo: '',
  priceFrom: '',
  priceTo: '',
  condition: '',
  transmission: '',
  location: '',
  searchTerm: '',
  searchQuery: '',
  carType: '',
  state: '',
  minPrice: '',
  maxPrice: '',
};

export const useSearchFilters = () => {
  const [filters, setFilters] = useState<SearchFilters>(initialFilters);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const updateFilter = (key: keyof SearchFilters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const resetFilters = () => {
    setFilters(initialFilters);
    setSearchResults([]);
    setHasSearched(false);
  };

  const clearFilters = () => {
    resetFilters();
  };

  const hasActiveFilters = useMemo(() => {
    return Object.entries(filters).some(([key, value]) => {
      if (key === 'searchTerm' || key === 'searchQuery') return false;
      return value !== '';
    });
  }, [filters]);

  const performSearch = async () => {
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

      // تطبيق الفلاتر
      if (filters.searchQuery || filters.searchTerm) {
        const searchTerm = filters.searchQuery || filters.searchTerm;
        query = query.or(`title.ilike.%${searchTerm}%,brand.ilike.%${searchTerm}%,model.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
      }

      if (filters.brand && filters.brand !== 'all') {
        query = query.eq('brand', filters.brand);
      }

      if (filters.carType && filters.carType !== 'all') {
        query = query.eq('car_type', filters.carType);
      }

      if (filters.state && filters.state !== 'all') {
        query = query.eq('state', filters.state);
      }

      if (filters.yearFrom) {
        query = query.gte('year', parseInt(filters.yearFrom));
      }

      if (filters.yearTo) {
        query = query.lte('year', parseInt(filters.yearTo));
      }

      if (filters.minPrice || filters.priceFrom) {
        const minPrice = filters.minPrice || filters.priceFrom;
        query = query.gte('price', parseFloat(minPrice));
      }

      if (filters.maxPrice || filters.priceTo) {
        const maxPrice = filters.maxPrice || filters.priceTo;
        query = query.lte('price', parseFloat(maxPrice));
      }

      if (filters.condition) {
        query = query.eq('condition', filters.condition);
      }

      if (filters.transmission) {
        query = query.eq('transmission', filters.transmission);
      }

      if (filters.location) {
        query = query.eq('city', filters.location);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      setSearchResults(data || []);
    } catch (error) {
      console.error('Error performing search:', error);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = (cars: any[]) => {
    return cars.filter(car => {
      // Search term filter
      if (filters.searchTerm || filters.searchQuery) {
        const searchLower = (filters.searchTerm || filters.searchQuery).toLowerCase();
        const matchesSearch = 
          car.title?.toLowerCase().includes(searchLower) ||
          car.brand?.toLowerCase().includes(searchLower) ||
          car.model?.toLowerCase().includes(searchLower) ||
          car.description?.toLowerCase().includes(searchLower);
        
        if (!matchesSearch) return false;
      }

      // Brand filter
      if (filters.brand && filters.brand !== 'all' && car.brand !== filters.brand) {
        return false;
      }

      // Model filter
      if (filters.model && car.model !== filters.model) {
        return false;
      }

      // Year range filter
      if (filters.yearFrom && car.year < parseInt(filters.yearFrom)) {
        return false;
      }
      if (filters.yearTo && car.year > parseInt(filters.yearTo)) {
        return false;
      }

      // Price range filter
      const minPrice = filters.priceFrom || filters.minPrice;
      const maxPrice = filters.priceTo || filters.maxPrice;
      
      if (minPrice && car.price < parseFloat(minPrice)) {
        return false;
      }
      if (maxPrice && car.price > parseFloat(maxPrice)) {
        return false;
      }

      // Condition filter
      if (filters.condition && car.condition !== filters.condition) {
        return false;
      }

      // Transmission filter
      if (filters.transmission && car.transmission !== filters.transmission) {
        return false;
      }

      // Location filter
      if (filters.location && car.location !== filters.location) {
        return false;
      }

      // Car type filter
      if (filters.carType && filters.carType !== 'all' && car.car_type !== filters.carType) {
        return false;
      }

      // State filter
      if (filters.state && filters.state !== 'all' && car.state !== filters.state) {
        return false;
      }

      return true;
    });
  };

  return {
    filters,
    updateFilter,
    resetFilters,
    clearFilters,
    hasActiveFilters,
    applyFilters,
    performSearch,
    searchResults,
    loading,
    hasSearched
  };
};
