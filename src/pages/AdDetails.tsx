
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { BackButton } from "@/components/BackButton";
import { ContactRevealButtons } from "@/components/ContactRevealButtons";
import { ImageGallery } from "@/components/ImageGallery";
import { CarCard } from "@/components/CarCard";
import { Badge } from "@/components/ui/badge";
import { Calendar, Gauge, Fuel, Settings, MapPin, Phone, MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

const AdDetails = () => {
  const { id } = useParams<{ id: string }>();
  const [ad, setAd] = useState<any>(null);
  const [sellerAds, setSellerAds] = useState<any[]>([]);
  const [sellerProfile, setSellerProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (id) {
      fetchAdDetails(id);
    }
  }, [id]);

  const fetchAdDetails = async (adId: string) => {
    setLoading(true);
    try {
      // Fetch ad details
      const { data: adData, error: adError } = await supabase
        .from("ads")
        .select("*")
        .eq("id", adId)
        .single();

      if (adError) throw adError;
      if (!adData) {
        toast({
          title: "الإعلان غير موجود",
          description: "الإعلان الذي تحاول الوصول إليه غير موجود",
          variant: "destructive",
        });
        navigate("/");
        return;
      }
      setAd(adData);

      // Increment view count
      await supabase
        .from("ads")
        .update({ view_count: (adData.view_count || 0) + 1 })
        .eq("id", adId);

      // Fetch seller's other ads (excluding current ad)
      const { data: sellerAdsData, error: sellerAdsError } = await supabase
        .from("ads")
        .select("*")
        .eq("user_id", adData.user_id)
        .neq("id", adId)
        .limit(6);

      if (sellerAdsError) throw sellerAdsError;
      setSellerAds(sellerAdsData || []);

      // Fetch seller's profile
      const { data: sellerProfileData, error: sellerProfileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", adData.user_id)
        .single();

      if (sellerProfileError) throw sellerProfileError;
      setSellerProfile(sellerProfileData);
    } catch (error) {
      console.error("Error fetching ad details:", error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء جلب تفاصيل الإعلان",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <BackButton />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">جاري التحميل...</div>
        </div>
      </div>
    );
  }

  if (!ad) {
    return null;
  }

  // Filter out current ad from seller's other ads
  const otherSellerAds = sellerAds.filter(otherAd => otherAd.id !== ad.id);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <BackButton />
      
      <div className="container mx-auto px-4 py-8">
        {/* Ad Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Image Gallery */}
          <div>
            <ImageGallery 
              images={ad.images || []} 
              title={ad.title} 
            />
          </div>

          {/* Ad Information */}
          <div>
            <h1 className="text-3xl font-bold mb-4">{ad.title}</h1>
            <div className="flex items-center gap-3 mb-4">
              <Badge variant="secondary" className="gap-1">
                <Calendar className="h-3 w-3" />
                {ad.year}
              </Badge>
              <Badge variant="outline" className="gap-1">
                <MapPin className="h-3 w-3" />
                {ad.city}
              </Badge>
              <span className="text-muted-foreground">
                {ad.view_count || 0} مشاهدة
              </span>
            </div>

            <div className="space-y-2 mb-6">
              <div className="flex items-center gap-2">
                <Gauge className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {ad.mileage} كيلومتر
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Fuel className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {ad.fuel_type}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Settings className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {ad.transmission}
                </span>
              </div>
            </div>

            <div className="text-2xl font-bold text-primary mb-4">
              {ad.price} جنيه سوداني
            </div>

            <p className="text-muted-foreground mb-6">{ad.description}</p>
          </div>
        </div>
        
        {/* Contact Information */}
        <div className="mt-8">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">معلومات البائع</h3>
            <div className="flex flex-wrap gap-3">
              {ad.phone && (
                <a 
                  href={`tel:${ad.phone}`}
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                >
                  <Phone className="h-4 w-4" />
                  الهاتف
                </a>
              )}
              {ad.whatsapp && (
                <a 
                  href={`https://wa.me/${ad.whatsapp.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                >
                  <MessageCircle className="h-4 w-4" />
                  واتساب
                </a>
              )}
            </div>
          </div>

          {/* Owner/Broker, Papers and License info */}
          {(ad.seller_role === 'مالك' || (ad.seller_role === 'وسيط' && ad.broker_commission_requested && (ad.broker_commission_amount || 0) > 0) || ad.papers_type || ad.license_status) && (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              {ad.seller_role === 'وسيط' && ad.broker_commission_requested && (ad.broker_commission_amount || 0) > 0 && (
                <Badge variant="outline" className="text-xs">عمولة وسيط: {ad.broker_commission_amount} جنيه سوداني</Badge>
              )}
              {ad.seller_role === 'مالك' && (
                <Badge variant="outline" className="text-xs">من المالك</Badge>
              )}
              {ad.papers_type && (
                <Badge variant="secondary" className="text-xs">{ad.papers_type}</Badge>
              )}
              {ad.license_status && (
                <Badge variant="outline" className="text-xs">{ad.license_status}</Badge>
              )}
            </div>
          )}

          {/* Safety notices */}
          <section className="mt-6">
            <h2 className="text-lg font-semibold mb-2">تنويهات هامة قبل الشراء</h2>
            <ul className="list-disc pr-5 space-y-1 text-sm text-muted-foreground">
              <li>قم بمقابلة البائع في مكان عام</li>
              <li>عملية الدفع والتسليم والتسلم تتم على مسؤولية الطرفين الشخصية (البائع/المشتري) والتطبيق غير مسؤول عنها تماماً</li>
              <li>قم بمراجعة المستندات بعناية وتأكد من صحتها</li>
              <li>قم بفحص السيارة بعناية ضمن الفترات النهارية</li>
              <li>لا تقم بدفع عمولة غير التي تم تحديدها من البائع الوسيط أو السمسار إذا كان الإعلان لا يخص المالك</li>
            </ul>
          </section>
        </div>

        {/* Seller's Other Ads */}
        {otherSellerAds.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold mb-6">إعلانات أخرى للبائع</h2>
            <div className="grid grid-cols-1 xs:grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 sm:gap-4 lg:gap-6">
              {otherSellerAds.map((otherAd: any) => (
                <CarCard
                  key={otherAd.id}
                  id={otherAd.id}
                  title={otherAd.title}
                  price={otherAd.price}
                  location={otherAd.city}
                  year={otherAd.year}
                  mileage={otherAd.mileage}
                  fuelType={otherAd.fuel_type}
                  transmission={otherAd.transmission}
                  image={
                    otherAd.images?.[0] ||
                    "https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=400&h=300&fit=crop"
                  }
                  isPremium={otherAd.is_premium}
                  isFeatured={otherAd.is_featured}
                  viewCount={otherAd.view_count}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdDetails;
