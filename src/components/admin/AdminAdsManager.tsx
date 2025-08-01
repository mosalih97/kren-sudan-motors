
import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Search, Trash2, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAdminAuth } from '@/contexts/AdminAuthContext';

interface AdInfo {
  id: string;
  title: string;
  description: string;
  price: number;
  brand: string;
  model: string;
  user_id: string;
  created_at: string;
  status: string;
}

export const AdminAdsManager: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [adInfo, setAdInfo] = useState<AdInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { sessionToken } = useAdminAuth();

  const searchAd = async () => {
    if (!searchQuery.trim()) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال رابط الإعلان أو ID للبحث",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      let adId = searchQuery.trim();
      
      // Extract ID from URL if it's a URL
      if (searchQuery.includes('/ad/') || searchQuery.includes('/ads/')) {
        const matches = searchQuery.match(/\/ads?\/([a-f0-9-]{36})/);
        if (matches) {
          adId = matches[1];
        }
      }

      const { data, error } = await supabase
        .from('ads')
        .select('*')
        .eq('id', adId)
        .single();

      if (error || !data) {
        toast({
          title: "لم يتم العثور على الإعلان",
          description: "تأكد من صحة الرابط أو ID",
          variant: "destructive",
        });
        setAdInfo(null);
      } else {
        setAdInfo(data as AdInfo);
        toast({
          title: "تم العثور على الإعلان",
          description: `إعلان: ${data.title}`,
        });
      }
    } catch (error) {
      console.error('Search error:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء البحث",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteAd = async () => {
    if (!adInfo || !sessionToken) return;

    const confirmDelete = window.confirm(
      `هل أنت متأكد من حذف الإعلان "${adInfo.title}" نهائياً؟ هذا الإجراء لا يمكن التراجع عنه.`
    );

    if (!confirmDelete) return;

    try {
      const { data, error } = await supabase.rpc('delete_ad_permanently', {
        ad_id_param: adInfo.id,
        admin_user_id: 'current_admin_id' // This should be the actual admin ID
      });

      const result = data as any;
      if (error || !result?.success) {
        toast({
          title: "فشل الحذف",
          description: result?.message || "حدث خطأ أثناء حذف الإعلان",
          variant: "destructive",
        });
      } else {
        toast({
          title: "تم الحذف",
          description: "تم حذف الإعلان نهائياً",
        });
        setAdInfo(null);
        setSearchQuery('');
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast({
        title: "خطأ",
        description: "فشل في حذف الإعلان",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-SA');
  };

  const formatPrice = (price: number) => {
    return price.toLocaleString('ar-SA') + ' جنيه';
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>إدارة الإعلانات</CardTitle>
          <CardDescription>
            البحث عن الإعلانات وحذفها نهائياً من النظام
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4 rtl:space-x-reverse mb-6">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="أدخل رابط الإعلان أو ID"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10"
                onKeyPress={(e) => e.key === 'Enter' && searchAd()}
              />
            </div>
            <Button onClick={searchAd} disabled={loading}>
              {loading ? 'جاري البحث...' : 'بحث'}
            </Button>
          </div>

          {adInfo && (
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{adInfo.title}</CardTitle>
                    <CardDescription>ID: {adInfo.id}</CardDescription>
                  </div>
                  <div className="flex items-center space-x-2 rtl:space-x-reverse">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(`/ad/${adInfo.id}`, '_blank')}
                    >
                      <ExternalLink className="h-4 w-4 ml-1" />
                      عرض الإعلان
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={deleteAd}
                    >
                      <Trash2 className="h-4 w-4 ml-1" />
                      حذف نهائياً
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold mb-2">تفاصيل الإعلان</h4>
                    <div className="space-y-2 text-sm">
                      <p><span className="font-medium">العلامة التجارية:</span> {adInfo.brand}</p>
                      <p><span className="font-medium">الموديل:</span> {adInfo.model}</p>
                      <p><span className="font-medium">السعر:</span> {formatPrice(adInfo.price)}</p>
                      <p><span className="font-medium">تاريخ النشر:</span> {formatDate(adInfo.created_at)}</p>
                      <p><span className="font-medium">الحالة:</span> {adInfo.status}</p>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">الوصف</h4>
                    <Textarea
                      value={adInfo.description || 'لا يوجد وصف'}
                      readOnly
                      className="min-h-[100px] resize-none"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
