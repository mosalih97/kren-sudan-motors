
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Shield, Users, Car, Activity, Settings, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import Header from "@/components/Header";
import { AdminUsersTab } from "@/components/admin/AdminUsersTab";
import { AdminAdsTab } from "@/components/admin/AdminAdsTab";
import { AdminLogsTab } from "@/components/admin/AdminLogsTab";
import { AdminSettingsTab } from "@/components/admin/AdminSettingsTab";

const Admin = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [stats, setStats] = useState({
    totalUsers: 0,
    premiumUsers: 0,
    totalAds: 0,
    activeAds: 0
  });

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    
    checkAdminAccess();
    fetchStats();
  }, [user, navigate]);

  const checkAdminAccess = async () => {
    try {
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("user_id", user?.id)
        .single();

      if (error) throw error;
      
      if (profile?.role !== "admin") {
        toast.error("ليس لديك صلاحيات للوصول إلى هذه الصفحة");
        navigate("/");
        return;
      }
      
      setIsAdmin(true);
    } catch (error) {
      console.error("Error checking admin access:", error);
      toast.error("خطأ في التحقق من الصلاحيات");
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      // Get user stats
      const { data: users, error: usersError } = await supabase
        .from("profiles")
        .select("membership_type");

      if (usersError) throw usersError;

      // Get ads stats
      const { data: ads, error: adsError } = await supabase
        .from("ads")
        .select("status");

      if (adsError) throw adsError;

      const totalUsers = users?.length || 0;
      const premiumUsers = users?.filter(u => u.membership_type === "premium").length || 0;
      const totalAds = ads?.length || 0;
      const activeAds = ads?.filter(ad => ad.status === "active").length || 0;

      setStats({
        totalUsers,
        premiumUsers,
        totalAds,
        activeAds
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
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

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={() => navigate(-1)}
            className="mb-4"
          >
            <ArrowLeft className="ml-2 h-4 w-4" />
            العودة
          </Button>
          
          <div className="flex items-center gap-3 mb-6">
            <Shield className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">لوحة التحكم الإدارية</h1>
              <p className="text-muted-foreground">إدارة المستخدمين والإعلانات</p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">إجمالي المستخدمين</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">المستخدمين المميزين</CardTitle>
              <Badge variant="default" className="text-xs">مميز</Badge>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.premiumUsers}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">إجمالي الإعلانات</CardTitle>
              <Car className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalAds}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">الإعلانات النشطة</CardTitle>
              <Activity className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeAds}</div>
            </CardContent>
          </Card>
        </div>

        {/* Admin Tabs */}
        <Tabs defaultValue="users" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              المستخدمون
            </TabsTrigger>
            <TabsTrigger value="ads" className="flex items-center gap-2">
              <Car className="h-4 w-4" />
              الإعلانات
            </TabsTrigger>
            <TabsTrigger value="logs" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              سجل الترقيات
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              الإعدادات
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <AdminUsersTab onStatsUpdate={fetchStats} />
          </TabsContent>

          <TabsContent value="ads">
            <AdminAdsTab onStatsUpdate={fetchStats} />
          </TabsContent>

          <TabsContent value="logs">
            <AdminLogsTab />
          </TabsContent>

          <TabsContent value="settings">
            <AdminSettingsTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;
