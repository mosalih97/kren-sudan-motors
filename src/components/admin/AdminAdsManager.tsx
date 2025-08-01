
import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, Trash2, ExternalLink, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface AdDetails {
  id: string;
  title: string;
  brand: string;
  model: string;
  year: number;
  price: number;
  city: string;
  status: string;
  created_at: string;
  user_id: string;
  is_premium: boolean;
  view_count: number;
  user: {
    display_name: string;
    user_id_display: string;
  };
}

export const AdminAdsManager: React.FC = () => {
  const [searchInput, setSearchInput] = useState('');
  const [adDetails, setAdDetails] = useState<AdDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { toast } = useToast();

  const searchAd = async () => {
    if (!searchInput.trim()) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال رابط الإعلان أو ID",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      let adId = searchInput.trim();

      // Extract ID from URL if it's a full URL
      if (adId.includes('/ad/') || adId.includes('/ads/')) {
        const urlParts = adId.split('/');
        const idIndex = urlParts.findIndex(part => part === 'ad' || part === 'ads');
        if (idIndex !== -1 && urlParts[idIndex + 1]) {
          adId = urlParts[idIndex + 1];
        }
      }

      const { data, error } = await supabase
        .from('ads')
        .select(`
          id,
          title,
          brand,
          model,
          year,
          price,
          city,
          status,
          created_at,
          user_id,
          is_premium,
          view_count,
          profiles:user_id (
            display_name,
            user_id_display
          )
        `)
        .eq('id', adId)
        .single();

      if (error || !data) {
        toast({
          title: "لم يتم العثور على الإعلان",
          description: "تأكد من صحة رابط الإعلان أو ID",
          variant: "destructive",
        });
        setAdDetails(null);
      } else {
        setAdDetails({
          ...data,
          user: data.profiles as any
        });
      }
    } catch (error) {
      console.error('Search error:', error);
      toast({
        title: "خطأ في البحث",
        description: "حدث خطأ أثناء البحث عن الإعلان",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteAd = async () => {
    if (!adDetails) return;

    setDeleting(true);
    try {
      // Get admin user ID from session
      const { data: sessionData } = await supabase.auth.getUser();
      const adminUserId = sessionData?.user?.id;

      if (!adminUserId) {
        toast({
          title: "خطأ",
          description: "فشل في التحقق من هوية المدير",
          variant: "destructive",
        });
        return;
      }

      const { data, error } = await supabase.rpc('delete_ad_permanently', {
        ad_id_param: adDetails.id,
        admin_user_id: adminUserId
      });

      if (error || !data?.success) {
        toast({
          title: "فشل الحذف",
          description: data?.message || "فشل في حذف الإعلان",
          variant: "destructive",
        });
      } else {
        toast({
          title: "تم الحذف بنجاح",
          description: "تم حذف الإعلان نهائياً من قاعدة البيانات",
        });
        setAdDetails(null);
        setSearchInput('');
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء حذف الإعلان",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  const formatPrice = (price: number) => {
    return price.toLocaleString('ar-SA') + ' ريال';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            البحث عن إعلان
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Input
              placeholder="أدخل رابط الإعلان أو ID"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="flex-1"
              dir="ltr"
            />
            <Button onClick={searchAd} disabled={loading}>
              <Search className="w-4 h-4 ml-1" />
              {loading ? 'جاري البحث...' : 'بحث'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {adDetails && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>تفاصيل الإعلان</span>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => window.open(`/ad/${adDetails.id}`, '_blank')}
                >
                  <ExternalLink className="w-4 h-4 ml-1" />
                  عرض الإعلان
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="sm" variant="destructive">
                      <Trash2 className="w-4 h-4 ml-1" />
                      حذف نهائي
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle className="flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-red-500" />
                        تأكيد الحذف النهائي
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        هل أنت متأكد من حذف هذا الإعلان نهائياً؟ 
                        <br />
                        <strong>هذا الإجراء لا يمكن التراجع عنه!</strong>
                        <br />
                        <br />
                        <strong>الإعلان:</strong> {adDetails.title}
                        <br />
                        <strong>المالك:</strong> {adDetails.user?.display_name} (ID: {adDetails.user?.user_id_display})
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>إلغاء</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={deleteAd}
                        disabled={deleting}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        {deleting ? 'جاري الحذف...' : 'حذف نهائي'}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-lg">{adDetails.title}</h3>
                  <p className="text-2xl font-bold text-green-600">{formatPrice(adDetails.price)}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-gray-500">الماركة:</span>
                    <p className="font-medium">{adDetails.brand}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">الموديل:</span>
                    <p className="font-medium">{adDetails.model}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">السنة:</span>
                    <p className="font-medium">{adDetails.year}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">المدينة:</span>
                    <p className="font-medium">{adDetails.city}</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Badge variant={adDetails.status === 'active' ? 'default' : 'secondary'}>
                    {adDetails.status === 'active' ? 'نشط' : adDetails.status}
                  </Badge>
                  {adDetails.is_premium && (
                    <Badge variant="outline" className="border-yellow-500 text-yellow-600">
                      مميز
                    </Badge>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <span className="text-sm text-gray-500">صاحب الإعلان:</span>
                  <p className="font-medium">{adDetails.user?.display_name || 'غير محدد'}</p>
                  <p className="text-sm text-gray-500">ID: {adDetails.user?.user_id_display}</p>
                </div>

                <div>
                  <span className="text-sm text-gray-500">تاريخ النشر:</span>
                  <p className="font-medium">{formatDate(adDetails.created_at)}</p>
                </div>

                <div>
                  <span className="text-sm text-gray-500">عدد المشاهدات:</span>
                  <p className="font-medium">{adDetails.view_count.toLocaleString()}</p>
                </div>

                <div>
                  <span className="text-sm text-gray-500">ID الإعلان:</span>
                  <p className="font-mono text-sm bg-gray-100 p-2 rounded">{adDetails.id}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
