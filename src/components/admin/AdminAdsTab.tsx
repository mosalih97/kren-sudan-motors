
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Car, Search, Filter, Star, Trash2, Eye, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";

interface Ad {
  id: string;
  title: string;
  price: number;
  city: string;
  status: string;
  is_featured: boolean;
  is_premium: boolean;
  created_at: string;
  user_id: string;
  view_count: number;
  profiles?: {
    display_name: string;
  };
}

interface AdminAdsTabProps {
  onStatsUpdate: () => void;
}

export const AdminAdsTab = ({ onStatsUpdate }: AdminAdsTabProps) => {
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchAds();
  }, []);

  const fetchAds = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("ads")
        .select(`
          *,
          profiles!ads_user_id_fkey(display_name)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setAds(data || []);
    } catch (error) {
      console.error("Error fetching ads:", error);
      toast.error("فشل في جلب الإعلانات");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAd = async (adId: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا الإعلان؟")) return;
    
    setActionLoading(adId);
    try {
      const { error } = await supabase
        .from("ads")
        .delete()
        .eq("id", adId);

      if (error) throw error;

      toast.success("تم حذف الإعلان بنجاح");
      fetchAds();
      onStatsUpdate();
    } catch (error) {
      console.error("Error deleting ad:", error);
      toast.error("فشل في حذف الإعلان");
    } finally {
      setActionLoading(null);
    }
  };

  const handleFeatureAd = async (adId: string, isFeatured: boolean) => {
    setActionLoading(adId);
    try {
      const { error } = await supabase
        .from("ads")
        .update({ is_featured: !isFeatured })
        .eq("id", adId);

      if (error) throw error;

      toast.success(isFeatured ? "تم إلغاء تمييز الإعلان" : "تم تمييز الإعلان");
      fetchAds();
    } catch (error) {
      console.error("Error updating ad:", error);
      toast.error("فشل في تحديث الإعلان");
    } finally {
      setActionLoading(null);
    }
  };

  const filteredAds = ads.filter(ad => {
    const matchesSearch = ad.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ad.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ad.profiles?.display_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || ad.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge variant="default">نشط</Badge>;
      case "inactive":
        return <Badge variant="secondary">غير نشط</Badge>;
      case "sold":
        return <Badge variant="outline">مباع</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Car className="h-5 w-5" />
          إدارة الإعلانات
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="البحث في الإعلانات..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-[200px]">
              <Filter className="h-4 w-4 ml-2" />
              <SelectValue placeholder="حالة الإعلان" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الإعلانات</SelectItem>
              <SelectItem value="active">النشطة</SelectItem>
              <SelectItem value="inactive">غير النشطة</SelectItem>
              <SelectItem value="sold">المباعة</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Ads Table */}
        {loading ? (
          <div className="text-center py-8">جاري التحميل...</div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>العنوان</TableHead>
                  <TableHead>البائع</TableHead>
                  <TableHead>السعر</TableHead>
                  <TableHead>المدينة</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>المشاهدات</TableHead>
                  <TableHead>التاريخ</TableHead>
                  <TableHead className="text-center">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAds.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      لا توجد إعلانات
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAds.map((ad) => (
                    <TableRow key={ad.id}>
                      <TableCell className="max-w-[200px]">
                        <div className="flex items-center gap-2">
                          <div className="truncate font-medium">{ad.title}</div>
                          <div className="flex gap-1">
                            {ad.is_featured && <Star className="h-3 w-3 text-yellow-500" />}
                            {ad.is_premium && <Zap className="h-3 w-3 text-blue-500" />}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {ad.profiles?.display_name || "مستخدم محذوف"}
                      </TableCell>
                      <TableCell>
                        {ad.price.toLocaleString()} ج.س
                      </TableCell>
                      <TableCell>{ad.city}</TableCell>
                      <TableCell>
                        {getStatusBadge(ad.status)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Eye className="h-3 w-3 text-muted-foreground" />
                          {ad.view_count}
                        </div>
                      </TableCell>
                      <TableCell>
                        {format(new Date(ad.created_at), "yyyy/MM/dd")}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex gap-1 justify-center">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleFeatureAd(ad.id, ad.is_featured)}
                            disabled={actionLoading === ad.id}
                          >
                            <Star className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(`/ad/${ad.id}`, '_blank')}
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteAd(ad.id)}
                            disabled={actionLoading === ad.id}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
