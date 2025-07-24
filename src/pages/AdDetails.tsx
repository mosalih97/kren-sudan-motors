
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, MapPin, Calendar, Fuel, Settings, Phone, MessageCircle, Eye, Heart, Crown, AlertTriangle, Share2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Header } from "@/components/Header";
import { Link } from "react-router-dom";
import { PointsConfirmDialog } from "@/components/PointsConfirmDialog";
import { useUserPoints } from "@/hooks/useUserPoints";

const WhatsAppIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.51 3.516"/>
  </svg>
);

export default function AdDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: userPoints } = useUserPoints();
  const [ad, setAd] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showPointsDialog, setShowPointsDialog] = useState(false);
  const [actionType, setActionType] = useState<'phone' | 'whatsapp'>('phone');
  const [revealedContacts, setRevealedContacts] = useState({
    phone: false,
    whatsapp: false
  });

  useEffect(() => {
    if (id) {
      fetchAdDetails();
      if (user) {
        checkIfFavorite();
        fetchUserInteractions();
      }
    }
  }, [id, user]);

  const fetchUserInteractions = async () => {
    if (!user || !id) return;
    
    try {
      const { data } = await supabase
        .from('ad_interactions')
        .select('*')
        .eq('user_id', user.id)
        .eq('ad_id', id)
        .eq('interaction_type', 'contact_view');
      
      // Check if user has already revealed contacts
      const hasRevealedContacts = data && data.length > 0;
      setRevealedContacts({
        phone: hasRevealedContacts,
        whatsapp: hasRevealedContacts
      });
    } catch (error) {
      console.error('Error fetching interactions:', error);
    }
  };

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

  const handleContactRequest = (type: 'phone' | 'whatsapp') => {
    if (!user) {
      toast.error('يجب تسجيل الدخول أولاً لعرض معلومات التواصل');
      navigate('/auth');
      return;
    }

    // إذا كان المستخدم نفسه البائع
    if (user.id === ad.user_id) {
      return;
    }

    // إذا كان الرقم مكشوف بالفعل
    if (revealedContacts[type]) {
      return;
    }

    // إذا كان مستخدم مميز، لا يحتاج نقاط
    if (userPoints?.membership_type === 'premium') {
      revealContact(type);
      return;
    }

    // إظهار نافذة النقاط
    setActionType(type);
    setShowPointsDialog(true);
  };

  const handlePointsConfirm = async () => {
    try {
      // خصم النقاط
      const { data, error } = await supabase.rpc('deduct_points', {
        user_id_param: user.id,
        points_to_deduct: 1
      });

      if (error) throw error;

      if (!data) {
        toast.error('ليس لديك نقاط كافية لهذا الإجراء');
        return;
      }

      // تسجيل التفاعل
      await supabase
        .from('ad_interactions')
        .insert({
          user_id: user.id,
          ad_id: id,
          interaction_type: 'contact_view',
          points_spent: 1
        });

      // كشف الرقم
      revealContact(actionType);

      toast.success(`تم خصم نقطة واحدة وكشف ${actionType === 'phone' ? 'رقم الهاتف' : 'رقم واتساب'}`);

    } catch (error) {
      console.error('Error deducting points:', error);
      toast.error('حدث خطأ أثناء العملية');
    } finally {
      setShowPointsDialog(false);
    }
  };

  const revealContact = (type: 'phone' | 'whatsapp') => {
    setRevealedContacts(prev => ({
      ...prev,
      [type]: true
    }));
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

  const handleShare = async () => {
    const shareData = {
      title: ad.title,
      text: `شاهد هذا الإعلان: ${ad.title}`,
      url: window.location.href
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        // fallback للمتصفحات التي لا تدعم Web Share API
        await navigator.clipboard.writeText(window.location.href);
        toast.success('تم نسخ الرابط إلى الحافظة');
      }
    } catch (error) {
      console.error('Error sharing:', error);
      toast.error('حدث خطأ في المشاركة');
    }
  };

  const formatPrice = (price: number) => {
    return price.toLocaleString('ar-SD');
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
                  
                  {/* أزرار الاتصال */}
                  {user && !isOwner && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <Button 
                          variant="outline"
                          onClick={() => handleContactRequest('phone')}
                          disabled={!ad.profiles.phone}
                          className="flex items-center gap-2"
                        >
                          <Phone className="h-4 w-4" />
                          {revealedContacts.phone ? 
                            (ad.profiles.phone || 'غير متوفر') : 
                            'عرض الهاتف'
                          }
                        </Button>
                        
                        <Button 
                          variant="outline"
                          onClick={() => handleContactRequest('whatsapp')}
                          disabled={!ad.profiles.whatsapp}
                          className="flex items-center gap-2 text-green-600 border-green-600 hover:bg-green-50"
                        >
                          <WhatsAppIcon />
                          {revealedContacts.whatsapp ? 
                            (ad.profiles.whatsapp || 'غير متوفر') : 
                            'واتساب'
                          }
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <Button 
                          variant="outline"
                          onClick={() => {
                            window.open(`/messages?to=${ad.user_id}&ad=${id}`, '_blank');
                          }}
                          className="flex items-center gap-2"
                        >
                          <MessageCircle className="h-4 w-4" />
                          رسالة
                        </Button>
                        
                        <Button 
                          variant="outline"
                          onClick={toggleFavorite}
                          className="flex items-center gap-2"
                        >
                          <Heart className={`h-4 w-4 ${isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
                          {isFavorite ? 'حفظ' : 'حفظ'}
                        </Button>
                      </div>
                      
                      <Button 
                        variant="outline"
                        onClick={handleShare}
                        className="w-full flex items-center gap-2"
                      >
                        <Share2 className="h-4 w-4" />
                        مشاركة
                      </Button>
                    </div>
                  )}
                  
                  <Link to={`/seller/${ad.profiles.user_id}`}>
                    <Button variant="outline" className="w-full mt-4">
                      عرض جميع إعلانات البائع
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Points Confirmation Dialog */}
      <PointsConfirmDialog
        open={showPointsDialog}
        onOpenChange={setShowPointsDialog}
        onConfirm={handlePointsConfirm}
        actionType={actionType}
        userPoints={userPoints?.total_points || 0}
      />
    </div>
  );
}
