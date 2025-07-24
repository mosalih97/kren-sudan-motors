
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Search, MapPin, DollarSign, Filter } from "lucide-react";
import { useSearchFilters } from "@/hooks/useSearchFilters";

interface SearchFiltersProps {
  onSearch?: (results: any[]) => void;
}

export function SearchFilters({ onSearch }: SearchFiltersProps) {
  const { filters, setFilters, performSearch, clearFilters, loading } = useSearchFilters();

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSearch = async () => {
    await performSearch();
  };

  return (
    <Card className="card-gradient border-0 shadow-lg">
      <CardContent className="p-6 space-y-6">
        {/* شريط البحث الرئيسي */}
        <div className="relative">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
          <Input
            placeholder="ابحث عن سيارة... (مثال: تويوتا كامري 2020)"
            className="pr-12 h-14 text-lg rounded-xl border-2 border-primary/20 focus:border-primary/50 transition-smooth"
            value={filters.searchQuery}
            onChange={(e) => handleFilterChange('searchQuery', e.target.value)}
          />
        </div>

        {/* الفلاتر */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* المدينة */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground flex items-center gap-2">
              <MapPin className="h-4 w-4 text-accent" />
              المدينة
            </label>
            <Input
              placeholder="اكتب اسم المدينة"
              className="h-12 rounded-lg border-2 border-border/50 hover:border-accent/30 focus:border-accent/50 transition-smooth"
              value={filters.city}
              onChange={(e) => handleFilterChange('city', e.target.value)}
            />
          </div>

          {/* السعر الأدنى */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-success" />
              السعر الأدنى
            </label>
            <Input
              type="number"
              placeholder="السعر الأدنى (جنيه سوداني)"
              className="h-12 rounded-lg border-2 border-border/50 hover:border-success/30 focus:border-success/50 transition-smooth"
              value={filters.minPrice}
              onChange={(e) => handleFilterChange('minPrice', e.target.value)}
            />
          </div>

          {/* السعر الأعلى */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-success" />
              السعر الأعلى
            </label>
            <Input
              type="number"
              placeholder="السعر الأعلى (جنيه سوداني)"
              className="h-12 rounded-lg border-2 border-border/50 hover:border-success/30 focus:border-success/50 transition-smooth"
              value={filters.maxPrice}
              onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
            />
          </div>
        </div>

        {/* أزرار البحث */}
        <div className="flex gap-4 pt-2">
          <Button 
            variant="hero" 
            size="lg" 
            className="flex-1" 
            onClick={handleSearch}
            disabled={loading}
          >
            <Search className="h-5 w-5 ml-2" />
            {loading ? 'جاري البحث...' : 'بحث متقدم'}
          </Button>
          <Button 
            variant="outline" 
            size="lg" 
            className="px-8"
            onClick={clearFilters}
            disabled={loading}
          >
            <Filter className="h-5 w-5 ml-2" />
            مسح الفلاتر
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
