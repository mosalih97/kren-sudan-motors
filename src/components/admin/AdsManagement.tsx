
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Search, Trash2, ExternalLink, Eye } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface Ad {
  id: string;
  title: string;
  brand: string;
  model: string;
  price: number;
  year: number;
  city: string;
  status: string;
  is_premium: boolean;
  is_featured: boolean;
  view_count: number;
  created_at: string;
  user_id: string;
  display_name: string;
  phone: string;
}

const AdsManagement: React.FC = () => {
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredAds, setFilteredAds] = useState<Ad[]>([]);

  useEffect(() => {
    fetchAds();
  }, []);

  useEffect(() => {
    if (searchTerm.trim()) {
      const filtered = ads.filter(ad => 
        ad.id.includes(searchTerm.trim()) ||
        ad.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ad.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ad.model.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredAds(filtered);
    } else {
      setFilteredAds(ads);
    }
  }, [searchTerm, ads]);

  const fetchAds = async () => {
    try {
      const { data, error } = await supabase
        .from('ads')
        .select(`
          *,
          profiles!ads_user_id_fkey (
            display_name,
            phone
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedAds = data?.map(ad => ({
        ...ad,
        display_name: ad.profiles?.display_name || 'غير محدد',
        phone: ad.profiles?.phone || 'غير محدد'
      })) || [];

      setAds(formattedAds);
    } catch (error) {
      console.error('Error fetching ads:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في تحميل الإعلانات',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteAd = async (adId: string) => {
    try {
      const { data: currentAdmin } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('membership_type', 'admin')
        .single();

      if (!currentAdmin) {
        throw new Error('لم يتم العثور على بيانات المدير');
      }

      const { data, error } = await supabase.rpc('delete_ad_permanently', {
        ad_id_param: adId,
        admin_user_id: currentAdmin.user_id
      });

      if (error) throw error;

      if (data?.success) {
        toast({
          title: 'تم بنجاح',
          description: 'تم حذف الإعلان نهائياً',
        });
        fetchAds();
      } else {
        throw new Error(data?.message || 'فشل في حذف الإعلان');
      }
    } catch (error) {
      console.error('Error deleting ad:', error);
      toast({
        title: 'خطأ',
        description: error instanceof Error ? error.message : 'فشل في حذف الإعلان',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return <div className="text-center py-8">جاري تحميل الإعلانات...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">إدارة الإعلانات</h2>
          <p className="text-gray-600 mt-1">عرض وحذف الإعلانات</p>
        </div>
        <Badge variant="secondary">
          إجمالي الإعلانات: {ads.length}
        </Badge>
      </div>

      {/* مربع البحث */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            البحث في الإعلانات
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Input
              placeholder="ابحث برقم الإعلان، العنوان، الماركة أو الموديل"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-md"
            />
            {searchTerm && (
              <Badge variant="outline">
                عدد النتائج: {filteredAds.length}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* جدول الإعلانات */}
      <Card>
        <CardHeader>
          <CardTitle>قائمة الإعلانات</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>العنوان</TableHead>
                  <TableHead>المركبة</TableHead>
                  <TableHead>السعر</TableHead>
                  <TableHead>المدينة</TableHead>
                  <TableHead>المالك</TableHead>
                  <TableHead>النوع</TableHead>
                  <TableHead>المشاهدات</TableHead>
                  <TableHead>تاريخ النشر</TableHead>
                  <TableHead>الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAds.map((ad) => (
                  <TableRow key={ad.id}>
                    <TableCell className="max-w-xs">
                      <div className="truncate" title={ad.title}>
                        {ad.title}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="font-medium">{ad.brand} {ad.model}</div>
                        <div className="text-gray-500">{ad.year}</div>
                      </div>
                    </TableCell>
                    <TableCell className="font-semibold">
                      {ad.price?.toLocaleString()} ر.س
                    </TableCell>
                    <TableCell>{ad.city}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{ad.display_name}</div>
                        <div className="text-gray-500">{ad.phone}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        {ad.is_premium && (
                          <Badge variant="default" className="bg-yellow-500 hover:bg-yellow-600 text-xs">
                            مميز
                          </Badge>
                        )}
                        {ad.is_featured && (
                          <Badge variant="secondary" className="text-xs">
                            مُروّج
                          </Badge>
                        )}
                        <Badge 
                          variant={ad.status === 'active' ? 'default' : 'outline'}
                          className="text-xs"
                        >
                          {ad.status === 'active' ? 'نشط' : 'محذوف'}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Eye className="h-4 w-4 text-gray-400" />
                        {ad.view_count}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {new Date(ad.created_at).toLocaleDateString('ar-SA')}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(`/ad/${ad.id}`, '_blank')}
                        >
                          <ExternalLink className="h-4 w-4 ml-1" />
                          عرض
                        </Button>
                        
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="destructive"
                            >
                              <Trash2 className="h-4 w-4 ml-1" />
                              حذف
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
                              <AlertDialogDescription>
                                هل أنت متأكد من حذف هذا الإعلان نهائياً؟ لا يمكن التراجع عن هذا الإجراء.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>إلغاء</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteAd(ad.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                حذف نهائي
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          {filteredAds.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              {searchTerm ? 'لا توجد نتائج للبحث' : 'لا توجد إعلانات'}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdsManagement;
