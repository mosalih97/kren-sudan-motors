
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Search, MapPin, Car, Calendar, DollarSign, Filter } from "lucide-react";
import { useSearchFilters } from "@/hooks/useSearchFilters";

const sudaneseStates = [
  "الخرطوم", "الجزيرة", "كسلا", "القضارف", "البحر الأحمر", "نهر النيل", 
  "شمال كردفان", "جنوب كردفان", "شمال دارفور", "جنوب دارفور", "غرب دارفور",
  "وسط دارفور", "شرق دارفور", "النيل الأزرق", "النيل الأبيض", "سنار",
  "الشمالية", "البحيرات"
];

const carBrands = [
  "تويوتا", "نيسان", "هوندا", "هيونداي", "كيا", "فورد", "شيفروليه", 
  "مرسيدس", "BMW", "أودي", "فولكس واجن", "بيجو", "رينو", "سوزوكي", "ميتسوبيشي"
];

const carTypes = [
  "صالون", "هاتشباك", "SUV", "بيك أب", "كوبيه", "حافلة صغيرة", "شاحنة"
];

interface SearchFiltersProps {
  onSearch?: (filters: any) => void;
}

export function SearchFilters({ onSearch }: SearchFiltersProps) {
  const { filters, updateFilter, clearFilters, hasActiveFilters } = useSearchFilters();

  const handleSearch = () => {
    if (onSearch) {
      onSearch(filters);
    }
  };

  const handleClearFilters = () => {
    clearFilters();
    if (onSearch) {
      onSearch({});
    }
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
            onChange={(e) => updateFilter('searchQuery', e.target.value)}
          />
        </div>

        {/* الفلاتر */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* الماركة */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Car className="h-4 w-4 text-primary" />
              الماركة
            </label>
            <Select value={filters.brand} onValueChange={(value) => updateFilter('brand', value)}>
              <SelectTrigger className="h-12 rounded-lg border-2 border-border/50 hover:border-primary/30 transition-smooth">
                <SelectValue placeholder="اختر الماركة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الماركات</SelectItem>
                {carBrands.map((brand) => (
                  <SelectItem key={brand} value={brand}>{brand}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* نوع السيارة */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Car className="h-4 w-4 text-secondary" />
              النوع
            </label>
            <Select value={filters.carType} onValueChange={(value) => updateFilter('carType', value)}>
              <SelectTrigger className="h-12 rounded-lg border-2 border-border/50 hover:border-secondary/30 transition-smooth">
                <SelectValue placeholder="نوع السيارة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الأنواع</SelectItem>
                {carTypes.map((type) => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* الولاية */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground flex items-center gap-2">
              <MapPin className="h-4 w-4 text-accent" />
              الولاية
            </label>
            <Select value={filters.state} onValueChange={(value) => updateFilter('state', value)}>
              <SelectTrigger className="h-12 rounded-lg border-2 border-border/50 hover:border-accent/30 transition-smooth">
                <SelectValue placeholder="اختر الولاية" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الولايات</SelectItem>
                {sudaneseStates.map((state) => (
                  <SelectItem key={state} value={state}>{state}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* سنة الصنع */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Calendar className="h-4 w-4 text-premium" />
              السنة
            </label>
            <div className="flex gap-2">
              <Select value={filters.minYear} onValueChange={(value) => updateFilter('minYear', value)}>
                <SelectTrigger className="h-12 rounded-lg border-2 border-border/50 hover:border-premium/30 transition-smooth">
                  <SelectValue placeholder="من" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 25 }, (_, i) => new Date().getFullYear() - i).map((year) => (
                    <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filters.maxYear} onValueChange={(value) => updateFilter('maxYear', value)}>
                <SelectTrigger className="h-12 rounded-lg border-2 border-border/50 hover:border-premium/30 transition-smooth">
                  <SelectValue placeholder="إلى" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 25 }, (_, i) => new Date().getFullYear() - i).map((year) => (
                    <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* نطاق السعر */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-foreground flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-success" />
            نطاق السعر (جنيه سوداني)
          </label>
          <div className="flex gap-2">
            <Input
              type="number"
              placeholder="السعر الأدنى"
              className="h-12 rounded-lg border-2 border-border/50 hover:border-success/30 focus:border-success/50 transition-smooth"
              value={filters.minPrice}
              onChange={(e) => updateFilter('minPrice', e.target.value)}
            />
            <Input
              type="number"
              placeholder="السعر الأعلى"
              className="h-12 rounded-lg border-2 border-border/50 hover:border-success/30 focus:border-success/50 transition-smooth"
              value={filters.maxPrice}
              onChange={(e) => updateFilter('maxPrice', e.target.value)}
            />
          </div>
        </div>

        {/* أزرار البحث */}
        <div className="flex gap-4 pt-2">
          <Button variant="hero" size="lg" className="flex-1" onClick={handleSearch}>
            <Search className="h-5 w-5 ml-2" />
            بحث متقدم
          </Button>
          <Button 
            variant="outline" 
            size="lg" 
            className="px-8" 
            onClick={handleClearFilters}
            disabled={!hasActiveFilters}
          >
            <Filter className="h-5 w-5 ml-2" />
            مسح الفلاتر
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
