
import { useState, useCallback } from 'react';

export interface SearchFilters {
  searchQuery: string;
  brand: string;
  model: string;
  city: string;
  condition: string;
  minPrice: string;
  maxPrice: string;
  fuelType: string;
  transmission: string;
  minYear: string;
  maxYear: string;
  carType: string;
  state: string;
}

export const useSearchFilters = () => {
  const [filters, setFilters] = useState<SearchFilters>({
    searchQuery: '',
    brand: '',
    model: '',
    city: '',
    condition: '',
    minPrice: '',
    maxPrice: '',
    fuelType: '',
    transmission: '',
    minYear: '',
    maxYear: '',
    carType: '',
    state: ''
  });

  const [hasSearched, setHasSearched] = useState(false);

  const updateFilter = useCallback((key: keyof SearchFilters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({
      searchQuery: '',
      brand: '',
      model: '',
      city: '',
      condition: '',
      minPrice: '',
      maxPrice: '',
      fuelType: '',
      transmission: '',
      minYear: '',
      maxYear: '',
      carType: '',
      state: ''
    });
    setHasSearched(false);
  }, []);

  const checkHasActiveFilters = useCallback(() => {
    return Object.values(filters).some(value => value.trim() !== '');
  }, [filters]);

  const applyFilters = useCallback(() => {
    setHasSearched(true);
  }, []);

  const hasActiveFilters = checkHasActiveFilters();

  return {
    filters,
    hasActiveFilters,
    hasSearched,
    updateFilter,
    clearFilters,
    applyFilters
  };
};
