
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Search, Eye, Edit, Trash2, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface Ad {
  id: string;
  title: string;
  brand: string;
  model: string;
  year: number;
  price: number;
  city: string;
  status: string;
  is_premium: boolean;
  is_featured: boolean;
  view_count: number;
  created_at: string;
  profiles: {
    display_name: string;
    membership_type: string;
  };
}

interface AdminAdsTabProps {
  onStatsUpdate: () => void;
}

export const AdminAdsTab: React.FC<AdminAdsTabProps> = ({ onStatsUpdate }) => {
  const { toast } = useToast();
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchAds();
  }, []);

  const fetchAds = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('ads')
        .select(`
          *,
          profiles!ads_user_id_fkey(
            display_name,
            membership_type
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setAds(data || []);
    } catch (error) {
      console.error('Error fetching ads:', error);
      toast({
        title: "خطأ في جلب البيانات",
        description: "حدث خطأ أثناء جلب قائمة الإعلانات",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAd = async (adId: string) => {
    try {
      const { error } = await supabase
        .from('ads')
        .delete()
        .eq('id', adId);

      if (error) throw error;

      toast({
        title: "تم الحذف بنجاح",
        description: "تم حذف الإعلان بنجاح"
      });

      fetchAds();
      onStatsUpdate();
    } catch (error) {
      console.error('Error deleting ad:', error);
      toast({
        title: "خطأ في الحذف",
        description: "حدث خطأ أثناء حذف الإعلان",
        variant: "destructive"
      });
    }
  };

  const handleToggleAdStatus = async (adId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    
    try {
      const { error } = await supabase
        .from('ads')
        .update({ status: newStatus })
        .eq('id', adId);

      if (error) throw error;

      toast({
        title: "تم التحديث بنجاح",
        description: `تم ${newStatus === 'active' ? 'تفعيل' : 'إلغاء تفعيل'} الإعلان`
      });

      fetchAds();
      onStatsUpdate();
    } catch (error) {
      console.error('Error updating ad status:', error);
      toast({
        title: "خطأ في التحديث",
        description: "حدث خطأ أثناء تحديث حالة الإعلان",
        variant: "destructive"
      });
    }
  };

  const filteredAds = ads.filter(ad => {
    const matchesSearch = ad.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ad.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ad.model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ad.city?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = statusFilter === 'all' || ad.status === statusFilter;
    
    return matchesSearch && matchesFilter;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default">نشط</Badge>;
      case 'inactive':
        return <Badge variant="secondary">غير نشط</Badge>;
      case 'pending':
        return <Badge variant="outline">في الانتظار</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          إدارة الإعلانات
        </CardTitle>
        
        <div className="flex gap-4 mt-4">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="بحث بالعنوان أو الماركة أو المدينة..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-10"
            />
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="تصفية حسب الحالة" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الحالات</SelectItem>
              <SelectItem value="active">نشط</SelectItem>
              <SelectItem value="inactive">غير نشط</SelectItem>
              <SelectItem value="pending">في الانتظار</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>العنوان</TableHead>
                <TableHead>الماركة والموديل</TableHead>
                <TableHead>السنة</TableHead>
                <TableHead>السعر</TableHead>
                <TableHead>المدينة</TableHead>
                <TableHead>المالك</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead>المشاهدات</TableHead>
                <TableHead>تاريخ النشر</TableHead>
                <TableHead>الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAds.map((ad) => (
                <TableRow key={ad.id}>
                  <TableCell className="font-medium max-w-48 truncate">
                    {ad.title}
                  </TableCell>
                  <TableCell>{ad.brand} {ad.model}</TableCell>
                  <TableCell>{ad.year}</TableCell>
                  <TableCell>{ad.price?.toLocaleString()} ريال</TableCell>
                  <TableCell>{ad.city}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span>{ad.profiles?.display_name || 'غير محدد'}</span>
                      <Badge variant={ad.profiles?.membership_type === 'premium' ? 'default' : 'secondary'} className="w-fit">
                        {ad.profiles?.membership_type === 'premium' ? 'مميز' : 'عادي'}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(ad.status)}
                  </TableCell>
                  <TableCell>{ad.view_count || 0}</TableCell>
                  <TableCell>
                    {format(new Date(ad.created_at), 'dd/MM/yyyy', { locale: ar })}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(`/ads/${ad.id}`, '_blank')}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleToggleAdStatus(ad.id, ad.status)}
                      >
                        {ad.status === 'active' ? 'إلغاء تفعيل' : 'تفعيل'}
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteAd(ad.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        
        {filteredAds.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            لا توجد نتائج للبحث
          </div>
        )}
      </CardContent>
    </Card>
  );
};
