
import React from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Car, MapPin, Eye, DollarSign, User } from "lucide-react";

interface AdData {
  id: string;
  title: string;
  brand: string;
  model: string;
  price: number;
  city: string;
  status: string;
  view_count: number;
  created_at: string;
  user_display_name: string;
}

export const AdsList = () => {
  const { data: ads, isLoading } = useQuery({
    queryKey: ["adminAdsList"],
    queryFn: async (): Promise<AdData[]> => {
      const { data: adsData } = await supabase
        .from("ads")
        .select(`
          id,
          title,
          brand,
          model,
          price,
          city,
          status,
          view_count,
          created_at,
          profiles!inner(display_name)
        `)
        .order("created_at", { ascending: false })
        .limit(100);

      if (!adsData) return [];

      return adsData.map((ad) => ({
        id: ad.id,
        title: ad.title || "",
        brand: ad.brand || "",
        model: ad.model || "",
        price: ad.price || 0,
        city: ad.city || "",
        status: ad.status || "",
        view_count: ad.view_count || 0,
        created_at: ad.created_at,
        user_display_name: (ad.profiles as any)?.display_name || "مجهول",
      }));
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>قائمة الإعلانات</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="p-4 border rounded-lg">
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4 animate-pulse"></div>
                  <div className="h-3 bg-muted rounded w-1/2 animate-pulse"></div>
                  <div className="h-3 bg-muted rounded w-1/4 animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "default";
      case "pending":
        return "secondary";
      case "rejected":
        return "destructive";
      default:
        return "outline";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "active":
        return "نشط";
      case "pending":
        return "قيد المراجعة";
      case "rejected":
        return "مرفوض";
      default:
        return status;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Car className="h-5 w-5" />
          قائمة الإعلانات ({ads?.length || 0})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {ads?.map((ad) => (
            <div
              key={ad.id}
              className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground text-lg mb-1">
                    {ad.title}
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    {ad.brand} {ad.model}
                  </p>
                </div>
                <Badge variant={getStatusColor(ad.status)}>
                  {getStatusText(ad.status)}
                </Badge>
              </div>

              <div className="flex items-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <DollarSign className="h-4 w-4" />
                  {ad.price?.toLocaleString()} ر.س
                </div>
                {ad.city && (
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {ad.city}
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Eye className="h-4 w-4" />
                  {ad.view_count} مشاهدة
                </div>
                {ad.user_display_name && (
                  <div className="flex items-center gap-1">
                    <User className="h-4 w-4" />
                    {ad.user_display_name}
                  </div>
                )}
              </div>

              <div className="mt-2 text-xs text-muted-foreground">
                تاريخ النشر: {new Date(ad.created_at).toLocaleDateString("ar-SA")}
              </div>
            </div>
          ))}

          {ads?.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              لا توجد إعلانات
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
