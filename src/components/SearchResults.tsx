
import { CarCard } from "@/components/CarCard";
import { Card, CardContent } from "@/components/ui/card";
import { Car, Filter } from "lucide-react";

interface SearchResultsProps {
  results: any[];
  loading: boolean;
  hasSearched: boolean;
  searchQuery: string;
}

export function SearchResults({ results, loading, hasSearched, searchQuery }: SearchResultsProps) {
  if (!hasSearched && !loading) {
    return null;
  }

  if (loading) {
    return (
      <section className="py-8">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 text-lg font-medium">
              <Filter className="h-5 w-5 animate-spin" />
              جاري البحث...
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-8">
      <div className="container mx-auto px-4">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-foreground mb-2">
            نتائج البحث
          </h2>
          <p className="text-muted-foreground">
            {searchQuery ? `البحث عن: "${searchQuery}" - ` : ''}
            تم العثور على {results.length} نتيجة
          </p>
        </div>

        {results.length === 0 ? (
          <Card className="card-gradient border-0 shadow-lg">
            <CardContent className="p-12 text-center">
              <Car className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-bold mb-2">لا توجد نتائج</h3>
              <p className="text-muted-foreground mb-4">
                لم نجد أي سيارات تطابق معايير البحث الخاصة بك
              </p>
              <p className="text-sm text-muted-foreground">
                جرب تعديل معايير البحث أو تقليل عدد الفلاتر
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {results.map((car) => (
              <CarCard
                key={car.id}
                id={car.id}
                title={car.title}
                price={car.price}
                location={car.city}
                year={car.year}
                mileage={car.mileage}
                fuelType={car.fuel_type}
                transmission={car.transmission}
                image={car.images?.[0] || "https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=400&h=300&fit=crop"}
                isPremium={car.is_premium}
                isFeatured={car.is_featured}
                isNew={car.condition === "جديدة"}
                viewCount={car.view_count}
                creditsRequired={1}
                topSpot={car.top_spot}
                topSpotUntil={car.top_spot_until}
                userId={car.user_id}
                showBoostButton={true}
                seller={car.profiles ? {
                  id: car.profiles.user_id,
                  display_name: car.profiles.display_name,
                  avatar_url: car.profiles.avatar_url,
                  membership_type: car.profiles.membership_type
                } : undefined}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
