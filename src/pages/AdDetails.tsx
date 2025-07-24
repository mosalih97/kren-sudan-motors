
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, MapPin, Calendar, Fuel, Settings, Phone, MessageCircle, Eye, Heart, Crown, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Header } from "@/components/Header";
import { Link } from "react-router-dom";

export default function AdDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [ad, setAd] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    if (id) {
      fetchAdDetails();
      if (user) {
        checkIfFavorite();
      }
    }
  }, [id, user]);

  const fetchAdDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching ad details for ID:', id);

      // جلب تفاصيل الإعلان مع معلومات البائع
      const { data: adData, error: adError } = await supabase
        .from('ads')
        .select(`
          *,
          profiles!ads_user_id_fkey (
            user_id,
            display_name,
            phone,
            whatsapp,
            city,
            avatar_url,
            membership_type
          )
        `)
        .eq('id', id)
        .single();

      console.log('Ad data received:', adData);
      console.log('Ad error:', adError);

      if (adError) {
        console.error('Error fetching ad:', adError);
        if (adError.code === 'PGRST116') {
          setError('الإعلان غير موجود أو تم حذفه');
        } else {
          setError('حدث خطأ في جلب تفاصيل الإعلان');
        }
        return;
      }

      if (!adData) {
        setError('الإعلان غير موجود');
        return;
      }

      // التحقق من حالة الإعلان
      if (adData.status !== 'active') {
        setError('هذا الإعلان غير متاح حالياً');
        return;
      }

      setAd(adData);
      setIsOwner(user?.id === adData.user_id);

      // تسجيل مشاهدة الإعلان فقط إذا لم يكن المستخدم هو صاحب الإعلان
      if (user?.id !== adData.user_id) {
        try {
          await supabase.rpc('record_ad_view', {
            ad_id_param: id,
            viewer_user_id: user?.id || null
          });
        } catch (viewError) {
          console.error('Error recording view:', viewError);
          // لا نعرض خطأ للمستخدم هنا لأن هذا ليس حرجاً
        }
      }

    } catch (error) {
      console.error('Error fetching ad details:', error);
      setError('حدث خطأ في جلب تفاصيل الإعلان');
    } finally {
      setLoading(false);
    }
  };

  const checkIfFavorite = async () => {
    if (!user || !id) return;

    try {
      const { data, error } = await supabase
        .from('favorites')
        .select('id')
        .eq('user_id', user.id)
        .eq('ad_id', id)
        .maybeSingle();

      if (error) {
        console.error('Error checking favorite:', error);
        return;
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

    try {
      if (isFavorite) {
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('ad_id', id);

        if (error) throw error;
        setIsFavorite(false);
        toast.success('تم حذف الإعلان من المفضلة');
      } else {
        const { error } = await supabase
          .from('favorites')
          .insert([{ user_id: user.id, ad_id: id }]);

        if (error) throw error;
        setIsFavorite(true);
        toast.success('تم حفظ الإعلان في المفضلة');
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast.error('حدث خطأ في حفظ الإعلان');
    }
  };

  const formatPrice = (price: number) => {
    return price.toLocaleString('ar-SD');
  };

  const handleContactClick = (type: 'phone' | 'whatsapp') => {
    if (!ad?.profiles) {
      toast.error('معلومات البائع غير متوفرة');
      return;
    }

    if (type === 'phone') {
      if (ad.profiles.phone) {
        window.open(`tel:${ad.profiles.phone}`, '_self');
      } else {
        toast.error('رقم الهاتف غير متوفر');
      }
    } else if (type === 'whatsapp') {
      if (ad.profiles.whatsapp) {
        window.open(`https://wa.me/${ad.profiles.whatsapp}`, '_blank');
      } else {
        toast.error('رقم الواتساب غير متوفر');
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">جاري تحميل تفاصيل الإعلان...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <Card className="max-w-md mx-auto">
              <CardContent className="p-8 text-center">
                <AlertTriangle className="h-16 w-16 mx-auto text-destructive mb-4" />
                <h2 className="text-xl font-semibold mb-2">خطأ في تحميل الإعلان</h2>
                <p className="text-muted-foreground mb-6">{error}</p>
                <div className="flex gap-2 justify-center">
                  <Button onClick={() => navigate(-1)} variant="outline">
                    <ArrowLeft className="ml-2 h-4 w-4" />
                    العودة
                  </Button>
                  <Button onClick={fetchAdDetails}>
                    إعادة المحاولة
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (!ad) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <Card className="max-w-md mx-auto">
              <CardContent className="p-8 text-center">
                <h2 className="text-xl font-semibold mb-2">الإعلان غير موجود</h2>
                <p className="text-muted-foreground mb-6">
                  لا يمكن العثور على الإعلان المطلوب
                </p>
                <Button onClick={() => navigate(-1)}>
                  <ArrowLeft className="ml-2 h-4 w-4" />
                  العودة
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  const images = ad.images && ad.images.length > 0 ? ad.images : ['/placeholder.svg'];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-6">
        {/* زر العودة */}
        <Button 
          variant="ghost" 
          onClick={() => navigate(-1)}
          className="mb-4"
        >
          <ArrowLeft className="ml-2 h-4 w-4" />
          العودة
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* معرض الصور */}
          <div className="space-y-4">
            <div className="relative">
              <img
                src={images[currentImageIndex] || '/placeholder.svg'}
                alt={ad.title}
                className="w-full h-96 object-cover rounded-lg"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = '/placeholder.svg';
                }}
              />
              
              {/* الشارات */}
              <div className="absolute top-4 right-4 flex flex-col gap-2">
                {ad.is_new && (
                  <Badge className="bg-green-500 hover:bg-green-600">
                    جديد
                  </Badge>
                )}
                {(ad.is_featured || ad.is_premium) && (
                  <Badge className="bg-blue-500 hover:bg-blue-600 flex items-center gap-1">
                    <Crown className="w-3 h-3" />
                    مميز
                  </Badge>
                )}
              </div>

              {/* عداد المشاهدات */}
              <div className="absolute bottom-4 left-4 flex items-center gap-1 bg-black/60 text-white px-3 py-1 rounded-full">
                <Eye className="h-4 w-4" />
                <span>{ad.view_count || 0} مشاهدة</span>
              </div>
            </div>

            {/* صور مصغرة */}
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto">
                {images.map((image, index) => (
                  <img
                    key={index}
                    src={image || '/placeholder.svg'}
                    alt={`${ad.title} - ${index + 1}`}
                    className={`w-20 h-20 object-cover rounded cursor-pointer ${
                      index === currentImageIndex ? 'ring-2 ring-primary' : ''
                    }`}
                    onClick={() => setCurrentImageIndex(index)}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = '/placeholder.svg';
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* تفاصيل الإعلان */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">{ad.title}</h1>
              <div className="flex items-center gap-2 text-muted-foreground mb-4">
                <MapPin className="h-4 w-4" />
                <span>{ad.city || 'غير محدد'}</span>
              </div>
              <div className="text-4xl font-bold text-primary">
                {formatPrice(ad.price)} جنيه سوداني
              </div>
            </div>

            {/* معلومات السيارة */}
            <Card>
              <CardHeader>
                <CardTitle>معلومات السيارة</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">السنة: {ad.year}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Fuel className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">نوع الوقود: {ad.fuel_type || 'غير محدد'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Settings className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">ناقل الحركة: {ad.transmission}</span>
                  </div>
                  {ad.mileage && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm">المسافة المقطوعة: {ad.mileage} كم</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <span className="text-sm">العلامة التجارية: {ad.brand}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">الموديل: {ad.model}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* الوصف */}
            {ad.description && (
              <Card>
                <CardHeader>
                  <CardTitle>الوصف</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground whitespace-pre-wrap">
                    {ad.description}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* معلومات البائع */}
            {ad.profiles && (
              <Card>
                <CardHeader>
                  <CardTitle>معلومات البائع</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 mb-4">
                    <img
                      src={ad.profiles.avatar_url || '/placeholder.svg'}
                      alt={ad.profiles.display_name}
                      className="w-12 h-12 rounded-full"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = '/placeholder.svg';
                      }}
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{ad.profiles.display_name}</h3>
                        {ad.profiles.membership_type === 'premium' && (
                          <Crown className="w-4 h-4 text-primary" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {ad.profiles.city || 'غير محدد'}
                      </p>
                    </div>
                  </div>
                  <Link to={`/seller/${ad.profiles.user_id}`}>
                    <Button variant="outline" className="w-full">
                      عرض جميع إعلانات البائع
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}

            {/* أزرار الإجراءات */}
            <div className="flex flex-col gap-3">
              {user && !isOwner && (
                <>
                  <Button 
                    size="lg" 
                    className="w-full"
                    onClick={() => handleContactClick('phone')}
                  >
                    <Phone className="ml-2 h-4 w-4" />
                    اتصل بالبائع
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    size="lg" 
                    className="w-full"
                    onClick={() => handleContactClick('whatsapp')}
                  >
                    <MessageCircle className="ml-2 h-4 w-4" />
                    محادثة واتساب
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    size="lg" 
                    className="w-full"
                    onClick={toggleFavorite}
                  >
                    <Heart className={`ml-2 h-4 w-4 ${isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
                    {isFavorite ? 'إزالة من المفضلة' : 'إضافة للمفضلة'}
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
