
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CarCard } from "@/components/CarCard";
import { UserPointsDisplay } from "@/components/UserPointsDisplay";
import { Header } from "@/components/Header";
import { useUserPoints } from "@/hooks/useUserPoints";
import { 
  Heart, 
  Plus, 
  MapPin, 
  Eye, 
  ExternalLink, 
  LogOut,
  Crown,
  Zap
} from "lucide-react";
import { toast } from "sonner";

interface Ad {
  id: string;
  title: string;
  price: number;
  brand: string;
  model: string;
  year: number;
  city: string;
  view_count: number;
  images: string[];
  status: string;
  top_spot: boolean;
  top_spot_until: string;
}

interface Favorite {
  ad_id: string;
  ads: Ad;
}

export default function Profile() {
  const [profile, setProfile] = useState<any>(null);
  const [userAds, setUserAds] = useState<Ad[]>([]);
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [city, setCity] = useState('');
  const [updating, setUpdating] = useState(false);
  const { user, signOut } = useAuth();
  const { data: pointsData } = useUserPoints();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    fetchProfile();
    fetchUserAds();
    fetchFavorites();
  }, [user, navigate]);

  const fetchProfile = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user?.id)
      .single();

    if (error) {
      console.error('Error fetching profile:', error);
      return;
    }

    setProfile(data);
    setDisplayName(data?.display_name || '');
    setPhone(data?.phone || '');
    setWhatsapp(data?.whatsapp || '');
    setCity(data?.city || '');
  };

  const fetchUserAds = async () => {
    const { data, error } = await supabase
      .from('ads')
      .select('*')
      .eq('user_id', user?.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user ads:', error);
      return;
    }

    setUserAds(data || []);
  };

  const fetchFavorites = async () => {
    const { data, error } = await supabase
      .from('favorites')
      .select('ad_id, ads(*)')
      .eq('user_id', user?.id);

    if (error) {
      console.error('Error fetching favorites:', error);
      return;
    }

    setFavorites(data || []);
  };

  const handleUpdateProfile = async (e: any) => {
    e.preventDefault();
    setUpdating(true);

    const updates = {
      display_name: displayName,
      phone: phone,
      whatsapp: whatsapp,
      city: city,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('user_id', user?.id);

    if (error) {
      toast.error('Failed to update profile.');
      console.error('Update profile error:', error);
    } else {
      toast.success('Profile updated successfully!');
      fetchProfile();
    }

    setUpdating(false);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const adsUsed = pointsData?.monthly_ads_count || 0;
  const adsLimit = pointsData?.monthly_ads_limit || 5;
  const remainingAds = adsLimit - adsUsed;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-6">
              <Avatar className="w-20 h-20">
                <AvatarImage src={profile?.avatar_url} />
                <AvatarFallback className="text-2xl">
                  {profile?.display_name?.charAt(0) || 'م'}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-3xl font-bold">{profile?.display_name}</h1>
                <p className="text-muted-foreground">{profile?.city}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant={profile?.membership_type === 'premium' ? 'default' : 'secondary'}>
                    {profile?.membership_type === 'premium' ? 'مميز' : 'عادي'}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    ID: {profile?.user_id_display}
                  </span>
                </div>
              </div>
            </div>

            {/* عرض النقاط المجمعة */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>النقاط المتاحة</CardTitle>
              </CardHeader>
              <CardContent>
                <UserPointsDisplay variant="full" />
              </CardContent>
            </Card>

            {/* عرض حالة الإعلانات */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>حالة الإعلانات الشهرية</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">الإعلانات المستخدمة</p>
                    <p className="text-2xl font-bold">{adsUsed}/{adsLimit}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">الإعلانات المتبقية</p>
                    <p className="text-2xl font-bold text-primary">{remainingAds}</p>
                  </div>
                </div>
                <div className="mt-4 bg-muted rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(adsUsed / adsLimit) * 100}%` }}
                  />
                </div>
              </CardContent>
            </Card>

            {/* معلومات الحساب */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>معلومات الحساب</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">رقم الهاتف</label>
                    <p className="text-muted-foreground">{profile?.phone || 'غير محدد'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">رقم الواتساب</label>
                    <p className="text-muted-foreground">{profile?.whatsapp || 'غير محدد'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">المدينة</label>
                    <p className="text-muted-foreground">{profile?.city || 'غير محددة'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">تاريخ الانضمام</label>
                    <p className="text-muted-foreground">
                      {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('ar-SA') : 'غير محدد'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="ads" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="ads">إعلاناتي ({userAds.length})</TabsTrigger>
              <TabsTrigger value="favorites">المفضلة ({favorites.length})</TabsTrigger>
              <TabsTrigger value="settings">الإعدادات</TabsTrigger>
            </TabsList>

            <TabsContent value="ads" className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <h2 className="text-2xl font-bold">إعلاناتي</h2>
                <Button asChild disabled={remainingAds <= 0}>
                  <Link to="/add-ad">
                    <Plus className="w-4 h-4 mr-2" />
                    إضافة إعلان جديد ({remainingAds} متبقي)
                  </Link>
                </Button>
              </div>

              {userAds.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center">
                    <p className="text-muted-foreground">لم تقم بإنشاء أي إعلانات بعد</p>
                    <Button asChild className="mt-4" disabled={remainingAds <= 0}>
                      <Link to="/add-ad">إنشاء إعلان جديد</Link>
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {userAds.map((ad) => (
                    <Card key={ad.id} className="overflow-hidden">
                      <div className="relative">
                        <img
                          src={ad.images?.[0] || '/placeholder.svg'}
                          alt={ad.title}
                          className="w-full h-48 object-cover"
                        />
                        <div className="absolute top-2 right-2">
                          <Badge variant={ad.status === 'active' ? 'default' : 'secondary'}>
                            {ad.status === 'active' ? 'نشط' : 'غير نشط'}
                          </Badge>
                        </div>
                        {ad.top_spot && ad.top_spot_until && new Date(ad.top_spot_until) > new Date() && (
                          <div className="absolute top-2 left-2">
                            <Badge className="bg-yellow-500 text-white">
                              <Crown className="w-3 h-3 mr-1" />
                              معزز
                            </Badge>
                          </div>
                        )}
                      </div>
                      <CardContent className="p-4">
                        <h3 className="font-semibold mb-2">{ad.title}</h3>
                        <p className="text-2xl font-bold text-primary mb-2">
                          {ad.price?.toLocaleString()} جنيه
                        </p>
                        <p className="text-sm text-muted-foreground mb-4">
                          {ad.brand} {ad.model} - {ad.year}
                        </p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                          <MapPin className="w-4 h-4" />
                          {ad.city}
                          <Eye className="w-4 h-4 ml-4" />
                          {ad.view_count} مشاهدة
                        </div>
                        <div className="flex gap-2">
                          <Button asChild size="sm" variant="outline" className="flex-1">
                            <Link to={`/ad/${ad.id}`}>
                              <ExternalLink className="w-4 h-4 mr-2" />
                              عرض
                            </Link>
                          </Button>
                          <Button asChild size="sm" className="flex-1">
                            <Link to={`/boost/${ad.id}`}>
                              <Zap className="w-4 h-4 mr-2" />
                              تعزيز
                            </Link>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="favorites" className="space-y-4">
              <h2 className="text-2xl font-bold mb-6">المفضلة</h2>
              {favorites.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center">
                    <Heart className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">لم تقم بإضافة أي إعلانات للمفضلة</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {favorites.map((favorite) => (
                    <CarCard key={favorite.ad_id} {...favorite.ads} />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="settings" className="space-y-4">
              <h2 className="text-2xl font-bold mb-6">الإعدادات</h2>
              <Card>
                <CardHeader>
                  <CardTitle>تحديث الملف الشخصي</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleUpdateProfile} className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">اسم العرض</label>
                      <Input
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="اسم العرض"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">رقم الهاتف</label>
                      <Input
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="رقم الهاتف"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">رقم الواتساب</label>
                      <Input
                        value={whatsapp}
                        onChange={(e) => setWhatsapp(e.target.value)}
                        placeholder="رقم الواتساب"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">المدينة</label>
                      <Input
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="المدينة"
                      />
                    </div>
                    <Button type="submit" disabled={updating}>
                      {updating ? 'جاري التحديث...' : 'حفظ التغييرات'}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-destructive">منطقة الخطر</CardTitle>
                </CardHeader>
                <CardContent>
                  <Button 
                    variant="destructive" 
                    onClick={handleSignOut}
                    className="w-full"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    تسجيل الخروج
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
