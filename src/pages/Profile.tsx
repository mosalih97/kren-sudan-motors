import { useState, useEffect } from "react";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { User, Session } from "@supabase/supabase-js";
import { Edit, Star, Car, Heart, Settings, LogOut, Crown, Coins } from "lucide-react";
import { CarCard } from "@/components/CarCard";

const Profile = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [userAds, setUserAds] = useState<any[]>([]);
  const [favorites, setFavorites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Profile form state
  const [profileData, setProfileData] = useState({
    displayName: "",
    phone: "",
    city: ""
  });

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (!session?.user) {
          navigate("/auth");
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (!session?.user) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchUserAds();
      fetchFavorites();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error) throw error;

      setProfile(data);
      setProfileData({
        displayName: data.display_name || "",
        phone: data.phone || "",
        city: data.city || ""
      });
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserAds = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from("ads")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setUserAds(data || []);
    } catch (error) {
      console.error("Error fetching user ads:", error);
    }
  };

  const fetchFavorites = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from("favorites")
        .select(`
          *,
          ads (*)
        `)
        .eq("user_id", user.id);

      if (error) throw error;
      setFavorites(data || []);
    } catch (error) {
      console.error("Error fetching favorites:", error);
    }
  };

  const updateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setUpdating(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          display_name: profileData.displayName,
          phone: profileData.phone,
          city: profileData.city
        })
        .eq("user_id", user.id);

      if (error) throw error;

      toast({
        title: "تم تحديث الملف الشخصي",
        description: "تم حفظ التغييرات بنجاح"
      });

      fetchProfile();
    } catch (error) {
      toast({
        title: "خطأ في التحديث",
        description: "حدث خطأ أثناء حفظ التغييرات",
        variant: "destructive"
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate("/");
    } catch (error) {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تسجيل الخروج",
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

  if (!user || !profile) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Profile Header */}
          <Card className="card-gradient border-0 shadow-lg mb-8">
            <CardContent className="p-8">
              <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="w-24 h-24 rounded-full primary-gradient flex items-center justify-center">
                  <span className="text-white text-3xl font-bold">
                    {profile.display_name?.charAt(0) || user.email?.charAt(0)}
                  </span>
                </div>
                
                <div className="flex-1 text-center md:text-right">
                  <h1 className="text-3xl font-bold text-foreground">
                    {profile.display_name || "مستخدم جديد"}
                  </h1>
                  <p className="text-muted-foreground text-lg">ID: {profile.user_id_display}</p>
                  {profile.city && (
                    <p className="text-muted-foreground">{profile.city}</p>
                  )}
                  
                  <div className="flex flex-wrap gap-3 mt-4 justify-center md:justify-start">
                    {profile.membership_type === 'premium' ? (
                      <Badge variant="premium" className="gap-1 text-sm">
                        <Crown className="h-4 w-4" />
                        عضو مميز
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="gap-1 text-sm">
                        عضو عادي
                      </Badge>
                    )}
                    <Badge variant="accent" className="gap-1 text-sm">
                      <Coins className="h-4 w-4" />
                      {profile.points || 0} نقطة
                    </Badge>
                    <Badge variant="outline" className="gap-1 text-sm">
                      <Car className="h-4 w-4" />
                      إعلانات شهرية: {profile.monthly_ads_count || 0}/5
                    </Badge>
                  </div>
                </div>

                <Button variant="outline" onClick={handleLogout} className="gap-2">
                  <LogOut className="h-4 w-4" />
                  تسجيل الخروج
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Profile Tabs */}
          <Tabs defaultValue="settings" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="settings" className="gap-2">
                <Settings className="h-4 w-4" />
                الإعدادات
              </TabsTrigger>
              <TabsTrigger value="ads" className="gap-2">
                <Car className="h-4 w-4" />
                إعلاناتي ({userAds.length})
              </TabsTrigger>
              <TabsTrigger value="favorites" className="gap-2">
                <Heart className="h-4 w-4" />
                المفضلة ({favorites.length})
              </TabsTrigger>
              <TabsTrigger value="reviews" className="gap-2">
                <Star className="h-4 w-4" />
                التقييمات
              </TabsTrigger>
            </TabsList>

            <TabsContent value="settings" className="mt-6">
              <Card className="card-gradient border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Edit className="h-5 w-5" />
                    تحديث الملف الشخصي
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={updateProfile} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="display-name">الاسم الكامل</Label>
                      <Input
                        id="display-name"
                        value={profileData.displayName}
                        onChange={(e) => setProfileData({...profileData, displayName: e.target.value})}
                        placeholder="أدخل اسمك الكامل"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">رقم الهاتف</Label>
                      <Input
                        id="phone"
                        value={profileData.phone}
                        onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                        placeholder="أدخل رقم هاتفك"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="city">المدينة</Label>
                      <Input
                        id="city"
                        value={profileData.city}
                        onChange={(e) => setProfileData({...profileData, city: e.target.value})}
                        placeholder="أدخل مدينتك"
                      />
                    </div>

                    <Button type="submit" disabled={updating} className="w-full">
                      {updating ? "جاري الحفظ..." : "حفظ التغييرات"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="ads" className="mt-6">
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold">إعلاناتي</h2>
                  <Button onClick={() => navigate("/add-ad")}>
                    إضافة إعلان جديد
                  </Button>
                </div>

                {userAds.length === 0 ? (
                  <Card className="card-gradient border-0 shadow-lg">
                    <CardContent className="p-8 text-center">
                      <Car className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-xl font-bold mb-2">لا توجد إعلانات</h3>
                      <p className="text-muted-foreground mb-4">لم تقم بإضافة أي إعلانات بعد</p>
                      <Button onClick={() => navigate("/add-ad")}>
                        أضف إعلانك الأول
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {userAds.map((ad) => (
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
            </TabsContent>

            <TabsContent value="favorites" className="mt-6">
              <div className="space-y-6">
                <h2 className="text-2xl font-bold">السيارات المفضلة</h2>

                {favorites.length === 0 ? (
                  <Card className="card-gradient border-0 shadow-lg">
                    <CardContent className="p-8 text-center">
                      <Heart className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-xl font-bold mb-2">لا توجد مفضلات</h3>
                      <p className="text-muted-foreground mb-4">لم تقم بإضافة أي سيارات للمفضلة</p>
                      <Button onClick={() => navigate("/")}>
                        تصفح السيارات
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {favorites.map((favorite) => (
                      <CarCard
                        key={favorite.ads.id}
                        id={favorite.ads.id}
                        title={favorite.ads.title}
                        price={favorite.ads.price}
                        location={favorite.ads.city}
                        year={favorite.ads.year}
                        mileage={favorite.ads.mileage}
                        fuelType={favorite.ads.fuel_type}
                        transmission={favorite.ads.transmission}
                        image={favorite.ads.images?.[0] || "https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=400&h=300&fit=crop"}
                        isPremium={favorite.ads.is_premium}
                        isFeatured={favorite.ads.is_featured}
                        viewCount={favorite.ads.view_count}
                        creditsRequired={1}
                      />
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="reviews" className="mt-6">
              <Card className="card-gradient border-0 shadow-lg">
                <CardContent className="p-8 text-center">
                  <Star className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-xl font-bold mb-2">التقييمات</h3>
                  <p className="text-muted-foreground">سيتم إضافة نظام التقييمات قريباً</p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Profile;
