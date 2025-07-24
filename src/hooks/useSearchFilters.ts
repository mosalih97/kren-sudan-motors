
import { useState, useEffect } from "react";

export interface SearchFilters {
  searchQuery: string;
  brand: string;
  carType: string;
  state: string;
  minYear: string;
  maxYear: string;
  minPrice: string;
  maxPrice: string;
}

export interface CarData {
  id: string;
  title: string;
  brand: string;
  model: string;
  year: number;
  price: number;
  city: string;
  state: string;
  fuel_type: string;
  transmission: string;
  mileage: number;
  condition: string;
  car_type: string;
  images: string[];
  user_id: string;
  created_at: string;
  is_premium: boolean;
  is_featured: boolean;
  view_count: number;
  top_spot: boolean;
  top_spot_until: string;
  display_tier: number;
}

export const useSearchFilters = () => {
  const [filters, setFilters] = useState<SearchFilters>({
    searchQuery: "",
    brand: "",
    carType: "",
    state: "",
    minYear: "",
    maxYear: "",
    minPrice: "",
    maxPrice: "",
  });

  const [filteredCars, setFilteredCars] = useState<CarData[]>([]);
  const [hasActiveFilters, setHasActiveFilters] = useState(false);

  // تحديث حالة الفلاتر النشطة
  useEffect(() => {
    const isActive = Object.entries(filters).some(([key, value]) => 
      value !== "" && key !== "searchQuery"
    ) || filters.searchQuery.trim() !== "";
    setHasActiveFilters(isActive);
  }, [filters]);

  const updateFilter = (key: keyof SearchFilters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      searchQuery: "",
      brand: "",
      carType: "",
      state: "",
      minYear: "",
      maxYear: "",
      minPrice: "",
      maxPrice: "",
    });
    setFilteredCars([]);
  };

  const performSearch = (cars: CarData[]) => {
    let filtered = [...cars];

    // البحث النصي
    if (filters.searchQuery.trim()) {
      const query = filters.searchQuery.toLowerCase().trim();
      filtered = filtered.filter(car => 
        car.title.toLowerCase().includes(query) ||
        car.brand.toLowerCase().includes(query) ||
        car.model.toLowerCase().includes(query) ||
        car.city.toLowerCase().includes(query)
      );
    }

    // فلترة حسب الماركة
    if (filters.brand && filters.brand !== "all") {
      filtered = filtered.filter(car => car.brand === filters.brand);
    }

    // فلترة حسب نوع السيارة
    if (filters.carType && filters.carType !== "all") {
      filtered = filtered.filter(car => car.car_type === filters.carType);
    }

    // فلترة حسب الولاية
    if (filters.state && filters.state !== "all") {
      filtered = filtered.filter(car => car.state === filters.state);
    }

    // فلترة حسب السنة
    if (filters.minYear) {
      filtered = filtered.filter(car => car.year >= parseInt(filters.minYear));
    }
    if (filters.maxYear) {
      filtered = filtered.filter(car => car.year <= parseInt(filters.maxYear));
    }

    // فلترة حسب السعر
    if (filters.minPrice) {
      filtered = filtered.filter(car => car.price >= parseInt(filters.minPrice));
    }
    if (filters.maxPrice) {
      filtered = filtered.filter(car => car.price <= parseInt(filters.maxPrice));
    }

    setFilteredCars(filtered);
    return filtered;
  };

  return {
    filters,
    filteredCars,
    hasActiveFilters,
    updateFilter,
    clearFilters,
    performSearch,
  };
};
