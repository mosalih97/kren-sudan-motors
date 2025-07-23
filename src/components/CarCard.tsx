import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Heart, MapPin, Calendar, Fuel, Settings, Phone, MessageCircle, Eye, Crown } from "lucide-react";
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
  seller?: {
    id: string;
    display_name: string;
    avatar_url?: string;
    membership_type?: string;
  };
  showSellerInfo?: boolean;
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
  creditsRequired = 1,
  seller,
  showSellerInfo = false
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
        {/* معلومات البائع أعلى العنوان */}
        {seller && showSellerInfo && (
          <div className="flex items-center gap-2 -mt-2 mb-3">
            <div className="relative">
              <Avatar className="h-6 w-6">
                <AvatarImage src={seller.avatar_url} alt={seller.display_name} />
                <AvatarFallback className="text-xs bg-primary/10 text-primary">
                  {seller.display_name?.charAt(0) || 'ب'}
                </AvatarFallback>
              </Avatar>
              {seller.membership_type === 'premium' && (
                <Crown className="h-2.5 w-2.5 text-primary absolute -top-0.5 -right-0.5" />
              )}
            </div>
            <span className="text-xs text-orange-500 font-medium">
              {seller.display_name}
            </span>
          </div>
        )}

        {/* العنوان والسعر */}
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-bold text-lg text-foreground group-hover:text-primary transition-smooth line-clamp-2 flex-1">
              {title}
            </h3>
          </div>
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
            onClick={() => navigate(`/ads/${id}`)}
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

      </CardContent>
    </Card>
  );
}