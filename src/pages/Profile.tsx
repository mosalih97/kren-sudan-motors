
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/Header';
import { BackButton } from '@/components/BackButton';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { 
  User, 
  Settings, 
  Car, 
  Crown, 
  Star, 
  Phone, 
  Mail, 
  MapPin,
  Edit3,
  Save,
  X
} from 'lucide-react';

export default function Profile() {
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [userAds, setUserAds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({
    display_name: '',
    phone: '',
    city: ''
  });

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchUserAds();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (error) throw error;
      
      setProfile(data);
      setEditData({
        display_name: data.display_name || '',
        phone: data.phone || '',
        city: data.city || ''
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast({
        title: "خطأ في جلب البيانات",
        description: "حدث خطأ أثناء جلب بيانات الملف الشخصي",
        variant: "destructive"
      });
    }
  };

  const fetchUserAds = async () => {
    try {
      const { data, error } = await supabase
        .from('ads')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUserAds(data || []);
    } catch (error) {
      console.error('Error fetching ads:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: editData.display_name,
          phone: editData.phone,
          city: editData.city
        })
        .eq('user_id', user?.id);

      if (error) throw error;

      await fetchProfile();
      setEditing(false);
      toast({
        title: "تم حفظ التغييرات",
        description: "تم تحديث بياناتك الشخصية بنجاح"
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "خطأ في الحفظ",
        description: "حدث خطأ أثناء حفظ التغييرات",
        variant: "destructive"
      });
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
        <div className="max-w-4xl mx-auto">
          {/* Profile Header */}
          <Card className="card-gradient border-0 shadow-lg mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                    <User className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl">{profile?.display_name || 'مستخدم جديد'}</CardTitle>
                    <CardDescription className="flex items-center gap-2">
                      <Badge variant={profile?.membership_type === 'premium' ? 'default' : 'secondary'}>
                        {profile?.membership_type === 'premium' ? (
                          <><Crown className="h-3 w-3 ml-1" /> عضوية مميزة</>
                        ) : (
                          'عضوية عادية'
                        )}
                      </Badge>
                      {profile?.user_id_display && (
                        <span className="text-sm text-muted-foreground">
                          ID: {profile.user_id_display}
                        </span>
                      )}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex gap-2">
                  {!editing ? (
                    <Button variant="outline" onClick={() => setEditing(true)}>
                      <Edit3 className="h-4 w-4 ml-2" />
                      تعديل
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button onClick={handleSaveProfile}>
                        <Save className="h-4 w-4 ml-2" />
                        حفظ
                      </Button>
                      <Button variant="outline" onClick={() => setEditing(false)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </CardHeader>
            
            {editing && (
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="display_name">الاسم الكامل</Label>
                    <Input
                      id="display_name"
                      value={editData.display_name}
                      onChange={(e) => setEditData({...editData, display_name: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">رقم الهاتف</Label>
                    <Input
                      id="phone"
                      value={editData.phone}
                      onChange={(e) => setEditData({...editData, phone: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city">المدينة</Label>
                    <Input
                      id="city"
                      value={editData.city}
                      onChange={(e) => setEditData({...editData, city: e.target.value})}
                    />
                  </div>
                </div>
              </CardContent>
            )}
          </Card>

          {/* Profile Tabs */}
          <Tabs defaultValue="info" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="info">المعلومات</TabsTrigger>
              <TabsTrigger value="ads">إعلاناتي ({userAds.length})</TabsTrigger>
              <TabsTrigger value="membership">العضوية</TabsTrigger>
              <TabsTrigger value="settings">الإعدادات</TabsTrigger>
            </TabsList>

            <TabsContent value="info" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>المعلومات الشخصية</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-3">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{user?.email}</span>
                    </div>
                    {profile?.phone && (
                      <div className="flex items-center gap-3">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{profile.phone}</span>
                      </div>
                    )}
                    {profile?.city && (
                      <div className="flex items-center gap-3">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{profile.city}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-3">
                      <Star className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">النقاط: {profile?.points || 0}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="ads" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {userAds.length === 0 ? (
                  <Card className="col-span-full">
                    <CardContent className="p-8 text-center">
                      <Car className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-bold mb-2">لا توجد إعلانات</h3>
                      <p className="text-muted-foreground mb-4">
                        لم تقم بإضافة أي إعلانات بعد
                      </p>
                      <Button>إضافة إعلان جديد</Button>
                    </CardContent>
                  </Card>
                ) : (
                  userAds.map((ad) => (
                    <Card key={ad.id}>
                      <CardHeader>
                        <CardTitle className="text-lg">{ad.title}</CardTitle>
                        <CardDescription>
                          {ad.brand} {ad.model} - {ad.year}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">السعر:</span>
                            <span className="font-bold">
                              {parseInt(ad.price).toLocaleString('ar-SD')} جنيه
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">المشاهدات:</span>
                            <span>{ad.view_count || 0}</span>
                          </div>
                          <Badge variant={ad.status === 'active' ? 'default' : 'secondary'}>
                            {ad.status === 'active' ? 'نشط' : 'غير نشط'}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="membership" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Crown className="h-5 w-5" />
                    معلومات العضوية
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                      <div>
                        <h4 className="font-medium">نوع العضوية الحالي</h4>
                        <p className="text-sm text-muted-foreground">
                          {profile?.membership_type === 'premium' ? 'عضوية مميزة' : 'عضوية عادية'}
                        </p>
                      </div>
                      <Badge variant={profile?.membership_type === 'premium' ? 'default' : 'secondary'}>
                        {profile?.membership_type === 'premium' ? 'مميز' : 'عادي'}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 bg-muted/30 rounded-lg">
                        <div className="text-2xl font-bold text-primary">{profile?.points || 0}</div>
                        <div className="text-sm text-muted-foreground">النقاط المتاحة</div>
                      </div>
                      <div className="text-center p-4 bg-muted/30 rounded-lg">
                        <div className="text-2xl font-bold text-primary">{profile?.credits || 0}</div>
                        <div className="text-sm text-muted-foreground">كريديت العضوية</div>
                      </div>
                    </div>

                    {profile?.membership_type !== 'premium' && (
                      <div className="p-4 bg-primary/10 rounded-lg">
                        <h4 className="font-medium mb-2">ترقية للعضوية المميزة</h4>
                        <p className="text-sm text-muted-foreground mb-3">
                          احصل على مزايا إضافية مع العضوية المميزة
                        </p>
                        <Button>ترقية الآن</Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="settings" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    إعدادات الحساب
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button variant="destructive" onClick={signOut}>
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
