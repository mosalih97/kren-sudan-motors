import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { BackButton } from "@/components/BackButton";
import { ContactRevealButtons } from "@/components/ContactRevealButtons";
import { CarCard } from "@/components/CarCard";
import { Badge } from "@/components/ui/badge";
import { Calendar, Gauge, Fuel, Settings, MapPin, Phone, MessageSquare } from "lucide-react";
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

      // Fetch seller's ads
      const { data: sellerAdsData, error: sellerAdsError } = await supabase
        .from("ads")
        .select("*")
        .eq("user_id", adData.user_id)
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

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <BackButton />
      
      <div className="container mx-auto px-4 py-8">
        {/* Ad Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Image Gallery */}
          <div>
            <div className="relative w-full h-96 rounded-lg overflow-hidden">
              <img
                src={ad.images?.[0] || "https://via.placeholder.com/600x400"}
                alt={ad.title}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="mt-4 flex gap-2 overflow-x-auto">
              {ad.images?.map((image: string, index: number) => (
                <div
                  key={index}
                  className="relative w-24 h-20 rounded-lg overflow-hidden flex-shrink-0"
                >
                  <img
                    src={image}
                    alt={`${ad.title} - ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
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
        
        {/* Replace the existing seller info section with ContactRevealButtons */}
        <ContactRevealButtons
          adId={ad.id}
          phone={ad.phone}
          whatsapp={ad.whatsapp}
          sellerId={ad.user_id}
          sellerName={sellerProfile?.display_name || "مستخدم"}
          adTitle={ad.title}
        />

        {/* Seller's Other Ads */}
        {sellerAds.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold mb-4">إعلانات أخرى للبائع</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sellerAds.map(
                (otherAd: { id: any; title: any; price: any; city: any; year: any; mileage: any; fuel_type: any; transmission: any; images: any; is_premium: any; is_featured: any; view_count: any; }, index: any) =>
                  otherAd.id !== ad.id && (
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
                      creditsRequired={1}
                    />
                  )
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdDetails;
