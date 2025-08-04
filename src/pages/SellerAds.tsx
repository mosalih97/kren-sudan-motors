
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Header } from "@/components/Header";
import { BackButton } from "@/components/BackButton";
import { CarCard } from "@/components/CarCard";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { User, Car, Calendar } from "lucide-react";

const SellerAds = () => {
  const { userId } = useParams<{ userId: string }>();
  const [sellerAds, setSellerAds] = useState<any[]>([]);
  const [sellerProfile, setSellerProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (userId) {
      fetchSellerData();
    }
  }, [userId]);

  const fetchSellerData = async () => {
    if (!userId) return;

    try {
      // Fetch seller profile
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        throw profileError;
      }

      setSellerProfile(profileData);

      // Fetch seller ads
      const { data: adsData, error: adsError } = await supabase
        .from("ads")
        .select("*")
        .eq("user_id", userId)
        .eq("status", "active")
        .order("created_at", { ascending: false });

      if (adsError) throw adsError;
      setSellerAds(adsData || []);
    } catch (error) {
      console.error("Error fetching seller data:", error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء جلب بيانات البائع",
        variant: "destructive"
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

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <BackButton />
      
      <div className="container mx-auto px-4 py-8">
        {/* Seller Profile */}
        <Card className="card-gradient border-0 shadow-xl mb-8">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full primary-gradient flex items-center justify-center">
                <User className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">
                  {sellerProfile?.display_name || "بائع"}
                </h1>
                <div className="flex items-center gap-4 mt-2">
                  <Badge variant="secondary" className="gap-1">
                    <Car className="h-3 w-3" />
                    {sellerAds.length} إعلان
                  </Badge>
                  <Badge variant="outline" className="gap-1">
                    <Calendar className="h-3 w-3" />
                    عضو منذ {sellerProfile?.created_at ? new Date(sellerProfile.created_at).getFullYear() : "غير محدد"}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Seller Ads */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold">إعلانات البائع</h2>
          
          {sellerAds.length === 0 ? (
            <Card className="card-gradient border-0 shadow-lg">
              <CardContent className="p-12 text-center">
                <Car className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-bold mb-2">لا توجد إعلانات</h3>
                <p className="text-muted-foreground">
                  لم ينشر هذا البائع أي إعلانات حالياً
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
