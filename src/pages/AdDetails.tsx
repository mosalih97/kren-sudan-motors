import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { PointsConfirmDialog } from "@/components/PointsConfirmDialog";
import { 
  ArrowRight, 
  Phone, 
  MessageCircle, 
  Heart, 
  Share2, 
  MapPin, 
  Calendar, 
  Fuel, 
  Settings, 
  Eye,
  Car,
  AlertTriangle,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

const WhatsAppIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.51 3.516"/>
  </svg>
);

const AdDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [ad, setAd] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showPointsDialog, setShowPointsDialog] = useState(false);
  const [actionType, setActionType] = useState<'phone' | 'whatsapp'>('phone');
  const [revealedContacts, setRevealedContacts] = useState({
    phone: false,
    whatsapp: false
  });
  const [interactions, setInteractions] = useState<any[]>([]);

  useEffect(() => {
    if (id && isValidUUID(id)) {
      fetchAdDetails();
    } else {
      navigate("/cars");
    }
    
    if (user) {
      fetchUserProfile();
      fetchUserInteractions();
    }
  }, [id, navigate, user]);

  // Function to validate UUID format
  const isValidUUID = (uuid: string) => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  };

  // دالة لتنسيق رقم الهاتف للعرض (تحويل من +249XXXXXXXXX إلى 09XXXXXXXX)
  const formatPhoneForDisplay = (phone: string) => {
    if (!phone) return '';
    // إذا كان الرقم يبدأ بـ +249، إزالة كود الدولة وإضافة 0
    if (phone.startsWith('+249')) {
      return '0' + phone.substring(4);
    }
    return phone;
  };

  const fetchUserProfile = async () => {
    if (!user) return;
    
    try {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();
      setUserProfile(data);
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const fetchUserInteractions = async () => {
    if (!user || !id) return;
    
    try {
      const { data } = await supabase
        .from('ad_interactions')
        .select('*')
        .eq('user_id', user.id)
        .eq('ad_id', id);
      
      setInteractions(data || []);
      
      // Set revealed contacts based on interactions
      const phoneInteraction = data?.find(i => i.interaction_type === 'phone_view');
      const whatsappInteraction = data?.find(i => i.interaction_type === 'whatsapp_view');
      
      setRevealedContacts({
        phone: !!phoneInteraction,
        whatsapp: !!whatsappInteraction
      });
    } catch (error) {
      console.error('Error fetching interactions:', error);
    }
  };

  const handleContactRequest = (type: 'phone' | 'whatsapp') => {
    if (!user) {
      toast({
        title: "تسجيل دخول مطلوب",
        description: "يجب تسجيل الدخول أولاً لعرض معلومات التواصل",
        variant: "destructive"
      });
      navigate('/auth');
      return;
    }

    // إذا كان المستخدم صاحب الإعلان
    if (user.id === ad.user_id) {
      return;
    }

    // إذا كان الرقم مكشوف بالفعل
    if (revealedContacts[type]) {
      return;
    }

    // إذا كان مستخدم مميز، لا يحتاج نقاط
    if (userProfile?.membership_type === 'premium') {
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
        toast({
          title: "نقاط غير كافية",
          description: "ليس لديك نقاط كافية لهذا الإجراء",
          variant: "destructive"
        });
        return;
      }

      // تسجيل التفاعل
      await supabase
        .from('ad_interactions')
        .insert({
          user_id: user.id,
          ad_id: id,
          interaction_type: actionType === 'phone' ? 'phone_view' : 'whatsapp_view',
          points_spent: 1
        });

      // كشف الرقم
      revealContact(actionType);

      // تحديث النقاط
      fetchUserProfile();

      toast({
        title: "تم بنجاح",
        description: `تم خصم نقطة واحدة وكشف ${actionType === 'phone' ? 'رقم الهاتف' : 'رقم واتساب'}`,
        variant: "default"
      });

    } catch (error) {
      console.error('Error deducting points:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء العملية",
        variant: "destructive"
      });
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

  const fetchAdDetails = async () => {
    setLoading(true);
    try {
      // Validate UUID format first
      if (!isValidUUID(id)) {
        toast({
          title: "رابط غير صحيح",
          description: "الرابط المُستخدم غير صحيح",
          variant: "destructive"
        });
        navigate("/cars");
        return;
      }

      // Fetch ad details
      const { data: adData, error: adError } = await supabase
        .from("ads")
        .select("*")
        .eq("id", id)
        .eq("status", "active")
        .single();

      if (adError) throw adError;

      if (!adData) {
        toast({
          title: "الإعلان غير موجود",
          description: "الإعلان المطلوب غير متاح أو تم حذفه",
          variant: "destructive"
        });
        navigate("/cars");
        return;
      }

      setAd(adData);

      // Fetch seller profile
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", adData.user_id)
        .single();

      if (profileError) {
        console.error("Error fetching profile:", profileError);
      } else {
        setProfile(profileData);
      }

      // Increment view count
      await supabase
        .from("ads")
        .update({ view_count: (adData.view_count || 0) + 1 })
        .eq("id", id);

    } catch (error) {
      console.error("Error fetching ad details:", error);
      toast({
        title: "خطأ في التحميل",
        description: "حدث خطأ أثناء تحميل تفاصيل الإعلان",
        variant: "destructive"
      });
      navigate("/cars");
    } finally {
      setLoading(false);
    }
  };

  const handlePrevImage = () => {
    if (ad?.images?.length > 1) {
      setCurrentImageIndex((prev) => 
        prev === 0 ? ad.images.length - 1 : prev - 1
      );
    }
  };

  const handleNextImage = () => {
    if (ad?.images?.length > 1) {
      setCurrentImageIndex((prev) => 
        prev === ad.images.length - 1 ? 0 : prev + 1
      );
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: ad.title,
          text: `${ad.title} - ${ad.price.toLocaleString('ar-SD')} جنيه`,
          url: window.location.href
        });
      } catch (error) {
        console.error("Error sharing:", error);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: "تم النسخ",
        description: "تم نسخ رابط الإعلان إلى الحافظة"
      });
    }
  };

  const handleShareWhatsApp = () => {
    const text = `${ad.title} - ${ad.price.toLocaleString('ar-SD')} جنيه`;
    const url = window.location.href;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${text}\n${url}`)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleShareFacebook = () => {
    const url = window.location.href;
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
    window.open(facebookUrl, '_blank');
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast({
      title: "تم النسخ",
      description: "تم نسخ رابط الإعلان إلى الحافظة"
    });
  };

  const handleMessage = () => {
    if (!user) {
      toast({
        title: "تسجيل دخول مطلوب",
        description: "يجب تسجيل الدخول أولاً لإرسال رسالة",
        variant: "destructive"
      });
      navigate('/auth');
      return;
    }
    
    // Navigate to messages with seller and ad info
    navigate(`/messages?seller=${ad.user_id}&ad=${ad.id}`);
  };

  const handleSave = async () => {
    if (!user) {
      toast({
        title: "تسجيل دخول مطلوب",
        description: "يجب تسجيل الدخول أولاً لحفظ الإعلان",
        variant: "destructive"
      });
      navigate('/auth');
      return;
    }

    try {
      // Check if already saved
      const { data: existing } = await supabase
        .from('favorites')
        .select('id')
        .eq('user_id', user.id)
        .eq('ad_id', id)
        .single();

      if (existing) {
        // Remove from favorites
        await supabase
          .from('favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('ad_id', id);
        
        toast({
          title: "تم الإلغاء",
          description: "تم إزالة الإعلان من المفضلة"
        });
      } else {
        // Add to favorites
        await supabase
          .from('favorites')
          .insert({
            user_id: user.id,
            ad_id: id
          });
        
        toast({
          title: "تم الحفظ",
          description: "تم إضافة الإعلان إلى المفضلة"
        });
      }
    } catch (error) {
      console.error('Error saving ad:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء حفظ الإعلان",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">جاري التحميل...</div>
        </div>
      </div>
    );
  }

  if (!ad) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <Card className="card-gradient border-0 shadow-lg">
            <CardContent className="p-12 text-center">
              <AlertTriangle className="h-16 w-16 mx-auto text-warning mb-4" />
              <h3 className="text-xl font-bold mb-2">الإعلان غير موجود</h3>
              <p className="text-muted-foreground mb-4">
                الإعلان المطلوب غير متاح أو تم حذفه
              </p>
              <Button onClick={() => navigate("/cars")}>
                العودة للسيارات
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const images = ad.images && ad.images.length > 0 
    ? ad.images 
    : ["https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=800&h=600&fit=crop"];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-6">
        {/* Back Button */}
        <Button 
          variant="ghost" 
          onClick={() => navigate(-1)}
          className="mb-6 hover:bg-muted"
        >
          <ArrowRight className="h-4 w-4 ml-2" />
          العودة
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Images and Description */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image Gallery */}
            <Card className="card-gradient border-0 shadow-lg overflow-hidden">
              <div className="relative h-96 bg-muted">
                <img
                  src={images[currentImageIndex]}
                  alt={ad.title}
                  className="w-full h-full object-cover"
                />
                
                {/* Image Navigation */}
                {images.length > 1 && (
                  <>
                    <Button
                      variant="secondary"
                      size="icon"
                      className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white"
                      onClick={handlePrevImage}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="secondary"
                      size="icon"
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white"
                      onClick={handleNextImage}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    
                    {/* Image Indicators */}
                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
                      {images.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentImageIndex(index)}
                          className={`w-2 h-2 rounded-full transition-smooth ${
                            index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                          }`}
                        />
                      ))}
                    </div>
                  </>
                )}

                {/* Badges */}
                <div className="absolute top-4 right-4 flex flex-col gap-2">
                  {ad.is_premium && <Badge variant="premium">مميز</Badge>}
                  {ad.is_featured && <Badge variant="featured">مُوصى</Badge>}
                  {ad.condition === "جديدة" && <Badge variant="new">جديد</Badge>}
                </div>
              </div>
            </Card>

            {/* Description */}
            <Card className="card-gradient border-0 shadow-lg">
              <CardContent className="p-6">
                <h2 className="text-xl font-bold mb-4 text-foreground">الوصف</h2>
                {ad.description ? (
                  <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                    {ad.description}
                  </p>
                ) : (
                  <p className="text-muted-foreground italic">
                    لم يتم إضافة وصف لهذا الإعلان
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Details and Actions */}
          <div className="space-y-6">
            {/* Main Details */}
            <Card className="card-gradient border-0 shadow-lg">
              <CardContent className="p-6 space-y-6">
                {/* Title and Price */}
                <div>
                  <h1 className="text-2xl font-bold text-foreground mb-2">
                    {ad.title}
                  </h1>
                  <div className="text-3xl font-bold primary-gradient bg-clip-text text-transparent">
                    {ad.price.toLocaleString('ar-SD')} جنيه
                  </div>
                </div>

                <Separator />

                {/* Car Details */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2 text-sm">
                    <Car className="h-4 w-4 text-primary" />
                    <span className="text-muted-foreground">العلامة:</span>
                    <span className="font-medium">{ad.brand}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Car className="h-4 w-4 text-primary" />
                    <span className="text-muted-foreground">الموديل:</span>
                    <span className="font-medium">{ad.model}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-primary" />
                    <span className="text-muted-foreground">السنة:</span>
                    <span className="font-medium">{ad.year}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Settings className="h-4 w-4 text-primary" />
                    <span className="text-muted-foreground">النقل:</span>
                    <span className="font-medium">{ad.transmission}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Fuel className="h-4 w-4 text-primary" />
                    <span className="text-muted-foreground">الوقود:</span>
                    <span className="font-medium">{ad.fuel_type}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Eye className="h-4 w-4 text-primary" />
                    <span className="text-muted-foreground">المشاهدات:</span>
                    <span className="font-medium">{ad.view_count}</span>
                  </div>
                </div>

                {ad.mileage && (
                  <>
                    <Separator />
                    <div className="flex items-center gap-2 text-sm">
                      <Car className="h-4 w-4 text-primary" />
                      <span className="text-muted-foreground">المسافة المقطوعة:</span>
                      <span className="font-medium">{ad.mileage}</span>
                    </div>
                  </>
                )}

                <Separator />

                {/* Location */}
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-accent" />
                  <span className="text-muted-foreground">الموقع:</span>
                  <span className="font-medium">{ad.city}</span>
                </div>

                <Separator />

                {/* Action Buttons */}
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <Button 
                      className="flex-1"
                      onClick={() => handleContactRequest('phone')}
                      disabled={user?.id === ad.user_id}
                    >
                      <Phone className="h-4 w-4 ml-2" />
                      {revealedContacts.phone && ad.phone ? formatPhoneForDisplay(ad.phone) : 'اتصال'}
                    </Button>
                    <Button 
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                      onClick={() => handleContactRequest('whatsapp')}
                      disabled={user?.id === ad.user_id}
                    >
                      <WhatsAppIcon />
                      <span className="ml-2">
                        {revealedContacts.whatsapp && ad.whatsapp ? formatPhoneForDisplay(ad.whatsapp) : 'واتساب'}
                      </span>
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" onClick={handleMessage}>
                      <MessageCircle className="h-4 w-4 ml-2" />
                      رسالة
                    </Button>
                    <Button variant="outline" onClick={handleSave}>
                      <Heart className="h-4 w-4 ml-2" />
                      حفظ
                    </Button>
                  </div>
                  
                  {/* أزرار المشاركة */}
                  <div className="space-y-2">
                    <div className="grid grid-cols-3 gap-2">
                      <Button variant="outline" size="sm" onClick={handleShareWhatsApp} className="bg-green-50 hover:bg-green-100 text-green-700">
                        <WhatsAppIcon />
                        <span className="ml-1">واتساب</span>
                      </Button>
                      <Button variant="outline" size="sm" onClick={handleShareFacebook} className="bg-blue-50 hover:bg-blue-100 text-blue-700">
                        <svg className="w-4 h-4 ml-1" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                        </svg>
                        فيسبوك
                      </Button>
                      <Button variant="outline" size="sm" onClick={handleCopyLink}>
                        <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        نسخ
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Seller Info */}
            {profile && (
              <Card className="card-gradient border-0 shadow-lg">
                <CardContent className="p-6">
                  <h3 className="text-lg font-bold mb-4">معلومات البائع</h3>
                  <div className="space-y-3">
                    <div>
                      <span className="text-muted-foreground">الاسم:</span>
                      <p className="font-medium">{profile.display_name || "غير محدد"}</p>
                    </div>
                    {profile.city && (
                      <div>
                        <span className="text-muted-foreground">المدينة:</span>
                        <p className="font-medium">{profile.city}</p>
                      </div>
                    )}
                    {profile.membership_type === 'premium' && (
                      <Badge variant="premium" className="w-fit">
                        عضو مميز
                      </Badge>
                    )}
                  </div>
                  
                  <Separator className="my-4" />
                  
                  {/* زر تصفح إعلانات البائع */}
                  <Button 
                    variant="outline" 
                    className="w-full bg-primary/10 hover:bg-primary/20 border-primary text-primary font-medium"
                    onClick={() => navigate(`/seller/${profile.user_id}`)}
                  >
                    تصفح إعلانات البائع
                  </Button>
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
        userPoints={userProfile?.points || 0}
      />
    </div>
  );
};

export default AdDetails;
