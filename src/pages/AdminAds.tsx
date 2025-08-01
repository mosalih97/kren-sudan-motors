
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Navigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Car, Eye, Star, Calendar } from 'lucide-react';
import { useAdminCheck } from '@/hooks/useAdminCheck';
import AdminLoadingScreen from '@/components/admin/AdminLoadingScreen';
import AccessDeniedScreen from '@/components/admin/AccessDeniedScreen';

interface AdData {
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
}

const AdminAds = () => {
  const { user } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdminCheck();
  const { toast } = useToast();
  const [ads, setAds] = useState<AdData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAdmin === true) {
      loadAds();
    }
  }, [isAdmin]);

  const loadAds = async () => {
    try {
      const { data, error } = await supabase
        .from('ads')
        .select(`
          id,
          title,
          brand,
          model,
          price,
          year,
          city,
          status,
          is_premium,
          is_featured,
          view_count,
          created_at,
          user_id
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAds(data || []);
    } catch (error) {
      console.error('خطأ في تحميل الإعلانات:', error);
      toast({
        title: "خطأ",
        description: "فشل في تحميل بيانات الإعلانات",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ar-SA').format(price) + ' ريال';
  };

  if (adminLoading) {
    return <AdminLoadingScreen />;
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (isAdmin === false) {
    return <AccessDeniedScreen userEmail={user.email} />;
  }

  if (loading) {
    return <AdminLoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex items-center gap-4">
          <Button 
            variant="outline" 
            onClick={() => window.location.href = '/admin'}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            العودة للوحة التحكم
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">إدارة الإعلانات</h1>
            <p className="text-gray-600 mt-2">عدد الإعلانات: {ads.length}</p>
          </div>
        </div>

        <div className="grid gap-6">
          {ads.map((ad) => (
            <Card key={ad.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <Car className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold mb-1">
                        {ad.title}
                      </h3>
                      <p className="text-gray-600">
                        {ad.brand} {ad.model} - {ad.year}
                      </p>
                      <p className="text-lg font-bold text-green-600 mt-1">
                        {formatPrice(ad.price)}
                      </p>
                      <p className="text-sm text-gray-500">{ad.city}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 items-center">
                    <Badge 
                      variant={ad.status === 'active' ? 'default' : 'destructive'}
                    >
                      {ad.status === 'active' ? 'نشط' : 'غير نشط'}
                    </Badge>
                    
                    {ad.is_premium && (
                      <Badge variant="default" className="flex items-center gap-1">
                        <Star className="w-3 h-3" />
                        مميز
                      </Badge>
                    )}
                    
                    {ad.is_featured && (
                      <Badge variant="secondary">
                        مثبت
                      </Badge>
                    )}
                    
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      {ad.view_count} مشاهدة
                    </Badge>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <div className="text-sm text-gray-500 flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {new Date(ad.created_at).toLocaleDateString('ar-SA')}
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => window.location.href = `/ad/${ad.id}`}
                    >
                      عرض التفاصيل
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {ads.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center">
                <Car className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">لا توجد إعلانات منشورة حالياً</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminAds;
