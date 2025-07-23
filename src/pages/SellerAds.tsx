import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { CarCard } from "@/components/CarCard";
import { PointsConfirmDialog } from "@/components/PointsConfirmDialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { 
  ArrowRight, 
  Phone, 
  MessageCircle, 
  MapPin, 
  Calendar,
  Crown,
  AlertTriangle
} from "lucide-react";

const WhatsAppIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.51 3.516"/>
  </svg>
);

const SellerAds = () => {
  const { sellerId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [sellerProfile, setSellerProfile] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [sellerAds, setSellerAds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPointsDialog, setShowPointsDialog] = useState(false);
  const [actionType, setActionType] = useState<'phone' | 'whatsapp'>('phone');
  const [revealedContacts, setRevealedContacts] = useState({
    phone: false,
    whatsapp: false
  });

  useEffect(() => {
    if (sellerId) {
      fetchSellerData();
    }
    
    if (user) {
      fetchUserProfile();
      fetchUserInteractions();
    }
  }, [sellerId, user]);

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
    if (!user || !sellerId) return;
    
    try {
      const { data } = await supabase
        .from('ad_interactions')
        .select('*')
        .eq('user_id', user.id)
        .eq('interaction_type', 'seller_contact');
      
      // Check if user has already revealed seller contacts
      const hasRevealedContacts = data && data.length > 0;
      setRevealedContacts({
        phone: hasRevealedContacts,
        whatsapp: hasRevealedContacts
      });
    } catch (error) {
      console.error('Error fetching interactions:', error);
    }
  };

  const fetchSellerData = async () => {
    setLoading(true);
    try {
      // Fetch seller profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', sellerId)
        .single();

      if (profileError) throw profileError;
      setSellerProfile(profileData);

      // Fetch seller ads
      const { data: adsData, error: adsError } = await supabase
        .from('ads')
        .select(`
          *,
          profiles!ads_user_id_fkey(
            user_id,
            display_name,
            avatar_url,
            membership_type
          )
        `)
        .eq('user_id', sellerId)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (adsError) throw adsError;
      setSellerAds(adsData || []);

    } catch (error) {
      console.error('Error fetching seller data:', error);
      toast({
        title: "خطأ في التحميل",
        description: "حدث خطأ أثناء تحميل بيانات البائع",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
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

    // إذا كان المستخدم نفسه البائع
    if (user.id === sellerId) {
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
          ad_id: null, // No specific ad since this is seller contact
          interaction_type: 'seller_contact',
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

  if (!sellerProfile) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <Card className="card-gradient border-0 shadow-lg">
            <CardContent className="p-12 text-center">
              <AlertTriangle className="h-16 w-16 mx-auto text-warning mb-4" />
              <h3 className="text-xl font-bold mb-2">البائع غير موجود</h3>
              <p className="text-muted-foreground mb-4">
                البائع المطلوب غير متاح
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

        {/* Seller Info Card */}
        <Card className="card-gradient border-0 shadow-lg mb-8">
          <CardContent className="p-6">
            <div className="flex items-start justify-between gap-6">
              {/* Profile Info */}
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={sellerProfile.avatar_url} alt={sellerProfile.display_name} />
                    <AvatarFallback className="text-xl bg-primary/10 text-primary">
                      {sellerProfile.display_name?.charAt(0) || 'ب'}
                    </AvatarFallback>
                  </Avatar>
                  {sellerProfile.membership_type === 'premium' && (
                    <Crown className="h-4 w-4 text-primary absolute -top-1 -right-1" />
                  )}
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-foreground">
                    {sellerProfile.display_name || "غير محدد"}
                  </h1>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                    <Calendar className="h-4 w-4" />
                    <span>انضم في {new Date(sellerProfile.created_at).toLocaleDateString('ar-SD')}</span>
                  </div>
                  {sellerProfile.membership_type === 'premium' && (
                    <Badge variant="premium" className="mt-2">
                      عضو مميز
                    </Badge>
                  )}
                </div>
              </div>

              {/* City */}
              {sellerProfile.city && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4 text-accent" />
                  <span>{sellerProfile.city}</span>
                </div>
              )}
            </div>

            <Separator className="my-6" />

            {/* Contact Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Button 
                className="flex-1"
                onClick={() => handleContactRequest('phone')}
                disabled={user?.id === sellerId}
              >
                <Phone className="h-4 w-4 ml-2" />
                {revealedContacts.phone && sellerProfile.phone ? sellerProfile.phone : 'اتصال'}
              </Button>
              <Button 
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                onClick={() => handleContactRequest('whatsapp')}
                disabled={user?.id === sellerId}
              >
                <WhatsAppIcon />
                <span className="ml-2">
                  {revealedContacts.whatsapp && sellerProfile.phone ? sellerProfile.phone : 'واتساب'}
                </span>
              </Button>
              <Button variant="outline" className="flex-1">
                <MessageCircle className="h-4 w-4 ml-2" />
                رسالة
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Seller Ads */}
        <div>
          <h2 className="text-2xl font-bold mb-6">
            إعلانات البائع ({sellerAds.length})
          </h2>
          
          {sellerAds.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {sellerAds.map((ad) => (
                <CarCard
                  key={ad.id}
                  id={ad.id}
                  title={ad.title}
                  price={ad.price}
                  location={ad.city}
                  year={ad.year}
                  mileage={ad.mileage}
                  fuelType={ad.fuel_type}
                  transmission={ad.transmission}
                  image={ad.images?.[0] || "https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=800&h=600&fit=crop"}
                  isPremium={ad.is_premium}
                  isFeatured={ad.is_featured}
                  isNew={ad.condition === "جديدة"}
                  viewCount={ad.view_count}
                  seller={{
                    id: ad.profiles?.user_id || "",
                    display_name: ad.profiles?.display_name || "",
                    avatar_url: ad.profiles?.avatar_url,
                    membership_type: ad.profiles?.membership_type
                  }}
                />
              ))}
            </div>
          ) : (
            <Card className="card-gradient border-0 shadow-lg">
              <CardContent className="p-12 text-center">
                <AlertTriangle className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-bold mb-2">لا توجد إعلانات</h3>
                <p className="text-muted-foreground">
                  لم يقم هذا البائع بنشر أي إعلانات بعد
                </p>
              </CardContent>
            </Card>
          )}
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

export default SellerAds;