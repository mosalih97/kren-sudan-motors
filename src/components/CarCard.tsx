
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Heart, Eye, MapPin, Calendar, Fuel, Settings, MessageCircle, Phone, Zap, Crown, Star } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";
import { toast } from "sonner";

interface CarCardProps {
  id: string;
  title: string;
  price: number;
  location?: string;
  year: number;
  mileage?: number;
  fuelType?: string;
  transmission: string;
  image: string;
  isPremium?: boolean;
  isFeatured?: boolean;
  isNew?: boolean;
  viewCount?: number;
  creditsRequired?: number;
  topSpot?: boolean;
  topSpotUntil?: string | null;
  displayTier?: number;
  userId: string;
  showBoostButton?: boolean;
  seller?: {
    id: string;
    display_name: string;
    avatar_url: string;
    membership_type: string;
  };
  showSellerInfo?: boolean;
  onFavoriteChange?: (adId: string, isFavorite: boolean) => void;
  showActions?: boolean;
  onContactClick?: () => void;
}

const formatPrice = (price: number) => {
  return price.toLocaleString('ar-SD');
};

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
  isPremium,
  isFeatured,
  isNew,
  viewCount,
  creditsRequired,
  topSpot,
  topSpotUntil,
  displayTier,
  userId,
  showBoostButton,
  seller,
  showSellerInfo = false,
  onFavoriteChange,
  showActions = true,
  onContactClick
}: CarCardProps) {
  const { user } = useAuth();
  const [isFavorite, setIsFavorite] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [boostInfo, setBoostInfo] = useState<any>(null);

  useEffect(() => {
    if (user) {
      checkIfFavorite();
      setIsOwner(user.id === userId);
      fetchBoostInfo();
    }
  }, [user, id, userId]);

  const fetchBoostInfo = async () => {
    try {
      const { data, error } = await supabase
        .from('ad_boosts')
        .select('boost_plan, expires_at, tier_priority')
        .eq('ad_id', id)
        .eq('status', 'active')
        .gt('expires_at', new Date().toISOString())
        .order('tier_priority', { ascending: false })
        .limit(1)
        .single();

      if (!error && data) {
        setBoostInfo(data);
      }
    } catch (error) {
      // تجاهل الخطأ إذا لم يكن هناك تعزيز نشط
    }
  };

  const checkIfFavorite = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('favorites')
        .select('*')
        .eq('user_id', user.id)
        .eq('ad_id', id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      setIsFavorite(!!data);
    } catch (error) {
      console.error('Error checking favorite:', error);
    }
  };

  const toggleFavorite = async () => {
    if (!user) {
      toast.error('يجب تسجيل الدخول لحفظ الإعلانات في المفضلة');
      return;
    }

    setIsLoading(true);
    try {
      if (isFavorite) {
        // Remove from favorites
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('ad_id', id);

        if (error) throw error;
        setIsFavorite(false);
        onFavoriteChange?.(id, false);
        toast.success('تم حذف الإعلان من المفضلة');
      } else {
        // Add to favorites
        const { error } = await supabase
          .from('favorites')
          .insert([{ user_id: user.id, ad_id: id }]);

        if (error) throw error;
        setIsFavorite(true);
        onFavoriteChange?.(id, true);
        toast.success('تم حفظ الإعلان في المفضلة');
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast.error('حدث خطأ أثناء حفظ الإعلان في المفضلة');
    } finally {
      setIsLoading(false);
    }
  };

  const handleContactClick = () => {
    if (onContactClick) {
      onContactClick();
    }
  };

  const getBoostIcon = (plan: string) => {
    switch (plan) {
      case 'basic': return <Zap className="w-3 h-3" />;
      case 'premium': return <Crown className="w-3 h-3" />;
      case 'ultimate': return <Star className="w-3 h-3" />;
      default: return <Zap className="w-3 h-3" />;
    }
  };

  const getBoostLabel = (plan: string) => {
    switch (plan) {
      case 'basic': return 'سريع';
      case 'premium': return 'مميز';
      case 'ultimate': return 'احترافي';
      default: return 'معزز';
    }
  };

  return (
    <Card className={`group hover:shadow-lg transition-all duration-200 ${
      topSpot ? 'ring-2 ring-primary/20 shadow-lg' : ''
    }`}>
      {/* صورة الإعلان */}
      <div className="relative overflow-hidden">
        <img 
          src={image || "/placeholder.svg"} 
          alt={title}
          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-200"
        />
        
        {/* الشارات */}
        <div className="absolute top-2 right-2 flex flex-col gap-1">
          {isNew && (
            <Badge className="bg-green-500 hover:bg-green-600">
              جديد
            </Badge>
          )}
          {(isFeatured || isPremium) && (
            <Badge className="bg-blue-500 hover:bg-blue-600">
              مميز
            </Badge>
          )}
          {boostInfo && (
            <Badge className="bg-primary/90 hover:bg-primary flex items-center gap-1">
              {getBoostIcon(boostInfo.boost_plan)}
              {getBoostLabel(boostInfo.boost_plan)}
            </Badge>
          )}
        </div>

        {/* زر المفضلة */}
        {user && !isOwner && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute top-2 left-2 bg-white/80 hover:bg-white"
            onClick={toggleFavorite}
            disabled={isLoading}
          >
            <Heart className={`h-4 w-4 ${isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
          </Button>
        )}

        {/* زر المشاهدة */}
        <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-black/60 text-white px-2 py-1 rounded text-xs">
          <Eye className="h-3 w-3" />
          <span>{viewCount || 0}</span>
        </div>
      </div>

      {/* محتوى البطاقة */}
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold mb-1 line-clamp-1">
              {title}
            </CardTitle>
            <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
              <MapPin className="h-4 w-4" />
              <span>{location || 'غير محدد'}</span>
            </div>
            {showSellerInfo && seller && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <img 
                  src={seller.avatar_url || "/placeholder.svg"} 
                  alt={seller.display_name}
                  className="w-6 h-6 rounded-full"
                />
                <span>{seller.display_name}</span>
                {seller.membership_type === 'premium' && (
                  <Crown className="w-4 h-4 text-primary" />
                )}
              </div>
            )}
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-primary">
              {formatPrice(price)}
            </div>
            <div className="text-xs text-muted-foreground">
              جنيه سوداني
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* معلومات السيارة */}
        <div className="grid grid-cols-3 gap-4 mb-4 text-sm">
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>{year}</span>
          </div>
          <div className="flex items-center gap-1">
            <Fuel className="h-4 w-4 text-muted-foreground" />
            <span>{fuelType || 'غير محدد'}</span>
          </div>
          <div className="flex items-center gap-1">
            <Settings className="h-4 w-4 text-muted-foreground" />
            <span>{transmission}</span>
          </div>
        </div>

        {/* إجراءات البطاقة */}
        {showActions && (
          <div className="flex gap-2">
            <Link to={`/ad/${id}`} className="flex-1">
              <Button variant="outline" className="w-full">
                عرض التفاصيل
              </Button>
            </Link>
            
            {user && !isOwner && (
              <Button 
                variant="accent" 
                onClick={handleContactClick}
                className="flex items-center gap-2"
              >
                <Phone className="h-4 w-4" />
                اتصل
              </Button>
            )}
            
            {user && !isOwner && (
              <Button 
                variant="outline"
                onClick={() => {
                  window.open(`/messages?to=${userId}&ad=${id}`, '_blank');
                }}
                className="flex items-center gap-2"
              >
                <MessageCircle className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
