
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface SearchFilters {
  searchQuery: string;
  carType: string;
  state: string;
  minPrice: string;
  maxPrice: string;
  yearFrom: string;
  yearTo: string;
}

export const useSearchFilters = () => {
  const [filters, setFilters] = useState<SearchFilters>({
    searchQuery: '',
    carType: '',
    state: '',
    minPrice: '',
    maxPrice: '',
    yearFrom: '',
    yearTo: ''
  });

  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const hasActiveFilters = () => {
    return (
      filters.searchQuery.trim() !== '' ||
      filters.carType !== '' ||
      filters.state !== '' ||
      filters.minPrice !== '' ||
      filters.maxPrice !== '' ||
      filters.yearFrom !== '' ||
      filters.yearTo !== ''
    );
  };

  const updateFilter = (key: keyof SearchFilters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      searchQuery: '',
      carType: '',
      state: '',
      minPrice: '',
      maxPrice: '',
      yearFrom: '',
      yearTo: ''
    });
    setSearchResults([]);
    setHasSearched(false);
  };

  const performSearch = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('cars')
        .select('*')
        .eq('status', 'active');

      if (filters.searchQuery.trim()) {
        query = query.or(`title.ilike.%${filters.searchQuery}%,description.ilike.%${filters.searchQuery}%`);
      }

      if (filters.carType) {
        query = query.eq('type', filters.carType);
      }

      if (filters.state) {
        query = query.eq('state', filters.state);
      }

      if (filters.minPrice) {
        query = query.gte('price', parseInt(filters.minPrice));
      }

      if (filters.maxPrice) {
        query = query.lte('price', parseInt(filters.maxPrice));
      }

      if (filters.yearFrom) {
        query = query.gte('year', parseInt(filters.yearFrom));
      }

      if (filters.yearTo) {
        query = query.lte('year', parseInt(filters.yearTo));
      }

      const { data, error } = await query;

      if (error) {
        console.error('Search error:', error);
        setSearchResults([]);
      } else {
        setSearchResults(data || []);
      }
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setLoading(false);
      setHasSearched(true);
    }
  };

  const applyFilters = () => {
    performSearch();
  };

  return {
    filters,
    hasActiveFilters: hasActiveFilters(),
    hasSearched,
    searchResults,
    loading,
    updateFilter,
    clearFilters,
    applyFilters,
    performSearch
  };
};
