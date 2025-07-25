
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Trash2, Star, TrendingUp, Eye } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

interface Ad {
  id: string;
  title: string;
  brand: string;
  model: string;
  price: number;
  city: string;
  status: string;
  created_at: string;
  is_featured: boolean;
  is_premium: boolean;
  view_count: number;
  profiles: {
    display_name: string;
    membership_type: string;
  } | null;
}

interface AdminAdsTabProps {
  onStatsUpdate: () => void;
}

const AdminAdsTab: React.FC<AdminAdsTabProps> = ({ onStatsUpdate }) => {
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    fetchAds();
  }, []);

  const fetchAds = async () => {
    try {
      const { data, error } = await supabase
        .from('ads')
        .select(`
          id,
          title,
          brand,
          model,
          price,
          city,
          status,
          created_at,
          is_featured,
          is_premium,
          view_count,
          profiles!inner(display_name, membership_type)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAds(data || []);
    } catch (error) {
      console.error('Error fetching ads:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء جلب بيانات الإعلانات",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteAd = async (adId: string, adTitle: string) => {
    try {
      const { error } = await supabase
        .from('ads')
        .update({ status: 'deleted' })
        .eq('id', adId);

      if (error) throw error;

      // إرسال إشعار لصاحب الإعلان
      const ad = ads.find(a => a.id === adId);
      if (ad) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('user_id')
          .eq('display_name', ad.profiles?.display_name)
          .single();

        if (profile) {
          await supabase
            .from('notifications')
            .insert({
              user_id: profile.user_id,
              title: 'تم حذف إعلانك',
              message: `تم حذف إعلان "${adTitle}" من قبل الإدارة`,
              type: 'admin_action'
            });
        }
      }

      toast({
        title: "تم الحذف",
        description: "تم حذف الإعلان بنجاح"
      });
      
      await fetchAds();
      onStatsUpdate();
    } catch (error) {
      console.error('Error deleting ad:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء حذف الإعلان",
        variant: "destructive"
      });
    }
  };

  const toggleFeatured = async (adId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('ads')
        .update({ is_featured: !currentStatus })
        .eq('id', adId);

      if (error) throw error;

      toast({
        title: "تم التحديث",
        description: `تم ${!currentStatus ? 'إضافة' : 'إزالة'} التمييز للإعلان`
      });
      
      await fetchAds();
    } catch (error) {
      console.error('Error toggling featured:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تحديث الإعلان",
        variant: "destructive"
      });
    }
  };

  const boostAd = async (adId: string) => {
    try {
      const { error } = await supabase
        .from('ads')
        .update({ 
          top_spot: true,
          top_spot_until: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        })
        .eq('id', adId);

      if (error) throw error;

      toast({
        title: "تم التعزيز",
        description: "تم تعزيز الإعلان لمدة 24 ساعة"
      });
      
      await fetchAds();
    } catch (error) {
      console.error('Error boosting ad:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تعزيز الإعلان",
        variant: "destructive"
      });
    }
  };

  const filteredAds = ads.filter(ad => {
    const matchesSearch = ad.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ad.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ad.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ad.city.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterStatus === 'all' || ad.status === filterStatus;
    
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>إدارة الإعلانات</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2">جاري التحميل...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>إدارة الإعلانات</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="البحث في الإعلانات..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant={filterStatus === 'all' ? 'default' : 'outline'}
              onClick={() => setFilterStatus('all')}
            >
              الكل
            </Button>
            <Button
              variant={filterStatus === 'active' ? 'default' : 'outline'}
              onClick={() => setFilterStatus('active')}
            >
              نشط
            </Button>
            <Button
              variant={filterStatus === 'deleted' ? 'default' : 'outline'}
              onClick={() => setFilterStatus('deleted')}
            >
              محذوف
            </Button>
          </div>
        </div>

        {/* Ads Table */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>العنوان</TableHead>
                <TableHead>السيارة</TableHead>
                <TableHead>السعر</TableHead>
                <TableHead>المدينة</TableHead>
                <TableHead>المالك</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead>المشاهدات</TableHead>
                <TableHead>الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAds.map((ad) => (
                <TableRow key={ad.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {ad.is_featured && <Star className="h-4 w-4 text-yellow-500" />}
                      <span className="font-medium">{ad.title}</span>
                    </div>
                  </TableCell>
                  <TableCell>{ad.brand} {ad.model}</TableCell>
                  <TableCell>{ad.price.toLocaleString()} ر.س</TableCell>
                  <TableCell>{ad.city}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span>{ad.profiles?.display_name || 'غير محدد'}</span>
                      {ad.profiles?.membership_type === 'premium' && (
                        <Badge variant="default" className="text-xs">مميز</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={ad.status === 'active' ? 'default' : 'destructive'}>
                      {ad.status === 'active' ? 'نشط' : 'محذوف'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Eye className="h-4 w-4 text-gray-400" />
                      {ad.view_count}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggleFeatured(ad.id, ad.is_featured)}
                        className={ad.is_featured ? 'text-yellow-600' : ''}
                      >
                        <Star className="h-4 w-4 ml-1" />
                        {ad.is_featured ? 'إلغاء التمييز' : 'تمييز'}
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => boostAd(ad.id)}
                        className="text-blue-600"
                      >
                        <TrendingUp className="h-4 w-4 ml-1" />
                        تعزيز
                      </Button>
                      
                      {ad.status === 'active' && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="outline" className="text-red-600">
                              <Trash2 className="h-4 w-4 ml-1" />
                              حذف
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
                              <AlertDialogDescription>
                                هل أنت متأكد من حذف الإعلان "{ad.title}"؟ لا يمكن التراجع عن هذا الإجراء.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>إلغاء</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deleteAd(ad.id, ad.title)}>
                                تأكيد الحذف
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {filteredAds.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            لا توجد إعلانات
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AdminAdsTab;
