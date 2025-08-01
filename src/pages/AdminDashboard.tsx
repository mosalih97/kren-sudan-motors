
import React from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DashboardStats } from "@/components/admin/DashboardStats";
import { UsersList } from "@/components/admin/UsersList";
import { AdsList } from "@/components/admin/AdsList";
import { Shield, Users, Car, TrendingUp } from "lucide-react";

const AdminDashboard = () => {
  const { user } = useAuth();

  // التحقق من صلاحيات المدير مباشرة من جدول admin_users
  const { data: isAdmin, isLoading: isCheckingAdmin } = useQuery({
    queryKey: ["isAdmin", user?.email],
    queryFn: async () => {
      if (!user?.email) return false;
      
      // فحص مباشر من جدول admin_users
      const { data: adminData } = await supabase
        .from("admin_users")
        .select("email")
        .eq("email", user.email)
        .single();
      
      // فحص إضافي من جدول profiles
      const { data: profileData } = await supabase
        .from("profiles")
        .select("membership_type")
        .eq("user_id", user.id)
        .single();
      
      return adminData?.email === user.email || profileData?.membership_type === 'admin';
    },
    enabled: !!user?.email,
  });

  if (isCheckingAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-muted-foreground">جاري التحقق من الصلاحيات...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <Shield className="mx-auto h-12 w-12 text-destructive mb-4" />
              <h2 className="text-xl font-semibold mb-2">غير مخول</h2>
              <p className="text-muted-foreground mb-4">
                ليس لديك صلاحية للوصول إلى لوحة التحكم
              </p>
              <p className="text-sm text-muted-foreground">
                البريد الإلكتروني: {user?.email}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            لوحة التحكم الإدارية
          </h1>
          <p className="text-muted-foreground">
            إدارة المستخدمين والإعلانات ومراقبة الأداء
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            مرحباً {user?.email}
          </p>
        </div>

        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              الإحصائيات
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              المستخدمين
            </TabsTrigger>
            <TabsTrigger value="ads" className="flex items-center gap-2">
              <Car className="h-4 w-4" />
              الإعلانات
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              الإعدادات
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <DashboardStats />
          </TabsContent>

          <TabsContent value="users">
            <UsersList />
          </TabsContent>

          <TabsContent value="ads">
            <AdsList />
          </TabsContent>

          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>إعدادات النظام</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  إعدادات النظام ستكون متاحة قريباً
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;
