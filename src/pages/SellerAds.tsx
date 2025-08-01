
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Header } from "@/components/Header";
import { BackButton } from "@/components/BackButton";
import { supabase } from "@/integrations/supabase/client";
import { CarCard } from "@/components/CarCard";
import { Car } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const SellerAds = () => {
  const { userId } = useParams<{ userId: string }>();
  const [sellerAds, setSellerAds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sellerProfile, setSellerProfile] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSellerAds = async () => {
      if (!userId) {
        setError("معرف البائع غير صحيح");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      
      try {
        // Fetch seller's ads
        const { data: ads, error: adsError } = await supabase
          .from("ads")
          .select("*")
          .eq("user_id", userId)
          .eq("status", "active")
          .order("created_at", { ascending: false });

        if (adsError) {
          console.error("Error fetching seller ads:", adsError);
          setError("فشل في جلب إعلانات البائع");
        } else {
          setSellerAds(ads || []);
        }

        // Fetch seller's profile
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", userId)
          .single();

        if (profileError) {
          console.error("Error fetching seller profile:", profileError);
        } else {
          setSellerProfile(profile);
        }
      } catch (error) {
        console.error("Error fetching seller data:", error);
        setError("حدث خطأ أثناء جلب بيانات البائع");
      } finally {
        setLoading(false);
      }
    };

    fetchSellerAds();
  }, [userId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <BackButton />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">جاري تحميل إعلانات البائع...</p>
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
        <BackButton />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-4">خطأ في تحميل الإعلانات</h2>
              <p className="text-muted-foreground mb-4">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <BackButton />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">
            إعلانات البائع: {sellerProfile?.display_name || "مستخدم"}
          </h1>

          {sellerAds.length === 0 ? (
            <Card className="card-gradient border-0 shadow-lg">
              <CardContent className="p-8 text-center">
                <Car className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-bold mb-2">لا توجد إعلانات</h3>
                <p className="text-muted-foreground mb-4">
                  ليس لدى هذا البائع أي إعلانات منشورة حتى الآن.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                  image={ad.images?.[0] || "https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=400&h=300&fit=crop"}
                  isPremium={ad.is_premium}
                  isFeatured={ad.is_featured}
                  viewCount={ad.view_count}
                  creditsRequired={1}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SellerAds;
