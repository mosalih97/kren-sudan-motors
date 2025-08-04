
import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { User, Car, Settings, Star, Eye } from "lucide-react";
import { Link } from "react-router-dom";

const Profile = () => {
  const [userAds, setUserAds] = useState<any[]>([]);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { user, signOut } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchUserData();
    }
  }, [user]);

  const fetchUserData = async () => {
    if (!user) return;

    try {
      // Fetch user profile
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        throw profileError;
      }

      setUserProfile(profileData);

      // Fetch user ads
      const { data: adsData, error: adsError } = await supabase
        .from("ads")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (adsError) throw adsError;
      setUserAds(adsData || []);
    } catch (error) {
      console.error("Error fetching user data:", error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء جلب البيانات",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
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

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        {/* Profile Header */}
        <Card className="card-gradient border-0 shadow-xl mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full primary-gradient flex items-center justify-center">
                  <User className="h-8 w-8 text-white" />
                </div>
                <div>
                  <CardTitle className="text-2xl">
                    {userProfile?.display_name || user?.email || "مستخدم"}
                  </CardTitle>
                  <p className="text-muted-foreground">{user?.email}</p>
                  <Badge variant="secondary" className="mt-2">
                    عضو منذ {new Date(user?.created_at || "").toLocaleDateString('ar-SA')}
                  </Badge>
                </div>
              </div>
              <Button variant="outline" onClick={handleSignOut}>
                تسجيل الخروج
              </Button>
            </div>
          </CardHeader>
        </Card>

        <Tabs defaultValue="ads" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="ads">إعلاناتي ({userAds.length})</TabsTrigger>
            <TabsTrigger value="settings">الإعدادات</TabsTrigger>
          </TabsList>
          
          <TabsContent value="ads">
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">إعلاناتي</h2>
                <Link to="/add-ad">
                  <Button>
                    <Car className="mr-2 h-4 w-4" />
                    إضافة إعلان جديد
                  </Button>
                </Link>
              </div>
              
              {userAds.length === 0 ? (
                <Card className="card-gradient border-0 shadow-lg">
                  <CardContent className="p-12 text-center">
                    <Car className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-xl font-bold mb-2">لا توجد إعلانات</h3>
                    <p className="text-muted-foreground mb-4">
                      لم تنشر أي إعلانات بعد
                    </p>
                    <Link to="/add-ad">
                      <Button>
                        أضف أول إعلان
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-6">
                  {userAds.map((ad) => (
                    <Card key={ad.id} className="card-gradient border-0 shadow-lg">
                      <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex-1">
                            <h3 className="text-lg font-bold mb-2">{ad.title}</h3>
                            <p className="text-muted-foreground mb-2">{ad.description}</p>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Eye className="h-4 w-4" />
                                {ad.view_count || 0} مشاهدة
                              </span>
                              <span>{ad.city}</span>
                              <span>{ad.year}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-primary mb-2">
                              {ad.price} ج.س
                            </div>
                            <Badge variant={ad.status === 'active' ? 'default' : 'secondary'}>
                              {ad.status === 'active' ? 'نشط' : 'غير نشط'}
                            </Badge>
                          </div>
                        </div>
                        
                        <div className="flex justify-between items-center pt-4 border-t">
                          <span className="text-sm text-muted-foreground">
                            نُشر في {new Date(ad.created_at).toLocaleDateString('ar-SA')}
                          </span>
                          <div className="flex gap-2">
                            <Link to={`/ad/${ad.id}`}>
                              <Button variant="outline" size="sm">
                                عرض
                              </Button>
                            </Link>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="settings">
            <Card className="card-gradient border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  إعدادات الحساب
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    ستتوفر إعدادات إضافية قريباً
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Profile;
