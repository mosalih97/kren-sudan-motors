
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Eye, Car, MapPin, Calendar, User, Star } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface Ad {
  id: string;
  title: string;
  brand: string;
  model: string;
  price: number;
  city: string;
  view_count: number;
  is_premium: boolean;
  is_featured: boolean;
  top_spot: boolean;
  created_at: string;
  status: string;
  user_id: string;
  profiles: {
    display_name: string;
    phone: string;
    membership_type: string;
  };
}

export const AdminAdsTab = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // جلب الإعلانات مع بيانات المستخدمين
  const { data: ads, isLoading } = useQuery({
    queryKey: ['admin-ads-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ads')
        .select(`
          *,
          profiles (
            display_name,
            phone,
            membership_type
          )
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Ad[];
    },
  });

  // فلترة الإعلانات
  const filteredAds = ads?.filter(ad => {
    const matchesSearch = ad.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ad.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ad.model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ad.city?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || ad.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500">نشط</Badge>;
      case 'inactive':
        return <Badge variant="secondary">غير نشط</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500">قيد المراجعة</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ar-SD', {
      style: 'currency',
      currency: 'SDG',
      minimumFractionDigits: 0,
    }).format(price);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* البحث والفلترة */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            البحث والفلترة
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="البحث في الإعلانات..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={statusFilter === 'all' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('all')}
                size="sm"
              >
                الكل
              </Button>
              <Button
                variant={statusFilter === 'active' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('active')}
                size="sm"
              >
                نشط
              </Button>
              <Button
                variant={statusFilter === 'inactive' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('inactive')}
                size="sm"
              >
                غير نشط
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* جدول الإعلانات */}
      <Card>
        <CardHeader>
          <CardTitle>الإعلانات ({filteredAds?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>العنوان</TableHead>
                  <TableHead>السيارة</TableHead>
                  <TableHead>السعر</TableHead>
                  <TableHead>المدينة</TableHead>
                  <TableHead>المالك</TableHead>
                  <TableHead>المشاهدات</TableHead>
                  <TableHead>المميزات</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>التاريخ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAds?.map((ad) => (
                  <TableRow key={ad.id}>
                    <TableCell>
                      <div className="font-medium max-w-[200px] truncate">
                        {ad.title}
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Car className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm">{ad.brand} {ad.model}</span>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="font-medium text-green-600">
                        {formatPrice(ad.price)}
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-muted-foreground" />
                        {ad.city}
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="space-y-1">
                        <div className="text-sm font-medium">
                          {ad.profiles?.display_name || 'غير محدد'}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {ad.profiles?.membership_type === 'premium' ? 'مميز' : 'عادي'}
                        </div>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Eye className="h-3 w-3 text-muted-foreground" />
                        {ad.view_count}
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {ad.is_premium && (
                          <Badge variant="secondary" className="text-xs">
                            <Star className="h-2 w-2 mr-1" />
                            مميز
                          </Badge>
                        )}
                        {ad.is_featured && (
                          <Badge variant="outline" className="text-xs">
                            مُنتقى
                          </Badge>
                        )}
                        {ad.top_spot && (
                          <Badge className="bg-yellow-500 text-xs">
                            مُعزز
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      {getStatusBadge(ad.status)}
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        {format(new Date(ad.created_at), 'dd/MM/yyyy', { locale: ar })}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
