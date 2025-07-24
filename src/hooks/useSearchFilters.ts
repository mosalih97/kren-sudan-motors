
import { useState, useEffect, useMemo } from 'react';

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
};

export const useSearchFilters = () => {
  const [filters, setFilters] = useState<SearchFilters>(initialFilters);

  const updateFilter = (key: keyof SearchFilters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const resetFilters = () => {
    setFilters(initialFilters);
  };

  const hasActiveFilters = useMemo(() => {
    return Object.entries(filters).some(([key, value]) => {
      if (key === 'searchTerm') return false;
      return value !== '';
    });
  }, [filters]);

  const applyFilters = (cars: any[]) => {
    return cars.filter(car => {
      // Search term filter
      if (filters.searchTerm) {
        const searchLower = filters.searchTerm.toLowerCase();
        const matchesSearch = 
          car.title?.toLowerCase().includes(searchLower) ||
          car.brand?.toLowerCase().includes(searchLower) ||
          car.model?.toLowerCase().includes(searchLower) ||
          car.description?.toLowerCase().includes(searchLower);
        
        if (!matchesSearch) return false;
      }

      // Brand filter
      if (filters.brand && car.brand !== filters.brand) {
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
      if (filters.priceFrom && car.price < parseFloat(filters.priceFrom)) {
        return false;
      }
      if (filters.priceTo && car.price > parseFloat(filters.priceTo)) {
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

      return true;
    });
  };

  return {
    filters,
    updateFilter,
    resetFilters,
    hasActiveFilters,
    applyFilters
  };
};
