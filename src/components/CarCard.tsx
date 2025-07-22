import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Heart, MapPin, Calendar, Fuel, Settings, Phone, MessageCircle, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface CarCardProps {
  id: string;
  title: string;
  price: number;
  location: string;
  year: number;
  mileage: string;
  fuelType: string;
  transmission: string;
  image: string;
  isPremium?: boolean;
  isFeatured?: boolean;
  isNew?: boolean;
  viewCount: number;
  creditsRequired?: number;
}

export function CarCard({
  id,
  title,
  price,
  location,
  year,
  mileage,
  fuelType,
  transmission,
  image,
  isPremium = false,
  isFeatured = false,
  isNew = false,
  viewCount,
  creditsRequired = 1
}: CarCardProps) {
  const navigate = useNavigate();
  return (
    <Card className={`group relative overflow-hidden rounded-xl border-0 shadow-lg hover:shadow-xl transition-smooth hover:-translate-y-1 ${isPremium ? 'premium-card shadow-premium' : 'card-gradient'}`}>
      {/* الشارات */}
      <div className="absolute top-3 right-3 z-10 flex flex-col gap-2">
        {isPremium && <Badge variant="premium">مميز</Badge>}
        {isFeatured && <Badge variant="featured">مُوصى</Badge>}
        {isNew && <Badge variant="new">جديد</Badge>}
      </div>

      {/* أيقونة الحفظ */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-3 left-3 z-10 bg-white/80 hover:bg-white hover:scale-110 transition-bounce"
      >
        <Heart className="h-4 w-4" />
      </Button>

      {/* صورة السيارة */}
      <div className="relative h-48 overflow-hidden">
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-105 transition-smooth"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-smooth" />
      </div>

      <CardContent className="p-4 space-y-4">
        {/* العنوان والسعر */}
        <div className="space-y-2">
          <h3 className="font-bold text-lg text-foreground group-hover:text-primary transition-smooth line-clamp-2">
            {title}
          </h3>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold primary-gradient bg-clip-text text-transparent">
              {price.toLocaleString('ar-SD')} جنيه
            </span>
          </div>
        </div>

        {/* تفاصيل السيارة */}
        <div className="grid grid-cols-2 gap-3 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" />
            <span>{year}</span>
          </div>
          <div className="flex items-center gap-2">
            <Settings className="h-4 w-4 text-primary" />
            <span>{transmission}</span>
          </div>
          <div className="flex items-center gap-2">
            <Fuel className="h-4 w-4 text-primary" />
            <span>{fuelType}</span>
          </div>
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4 text-primary" />
            <span>{viewCount} مشاهدة</span>
          </div>
        </div>

        {/* الموقع */}
        <div className="flex items-center gap-2 text-muted-foreground">
          <MapPin className="h-4 w-4 text-accent" />
          <span className="text-sm">{location}</span>
        </div>

        {/* أزرار التفاعل */}
        <div className="flex gap-2 pt-2">
          <Button 
            variant="default" 
            size="sm" 
            className="flex-1"
            onClick={() => {
              console.log("CarCard: Navigating to ad ID:", id);
              navigate(`/ads/${id}`);
            }}
          >
            عرض التفاصيل
          </Button>
          <Button variant="outline" size="sm" className="px-3">
            <Phone className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" className="px-3">
            <MessageCircle className="h-4 w-4" />
          </Button>
        </div>

        {/* عدد الكريديت المطلوب */}
        {creditsRequired > 0 && (
          <div className="text-xs text-center text-muted-foreground bg-muted rounded-lg py-2">
            مطلوب {creditsRequired} كريديت لعرض رقم الهاتف
          </div>
        )}
      </CardContent>
    </Card>
  );
}