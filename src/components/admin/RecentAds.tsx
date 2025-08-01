
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Car, Eye, Star } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

export const RecentAds = () => {
  const { data: recentAds, isLoading } = useQuery({
    queryKey: ['recent-ads'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ads')
        .select(`
          *,
          profiles!inner(display_name)
        `)
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Car className="h-5 w-5" />
            الإعلانات الحديثة
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="space-y-2 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/4"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Car className="h-5 w-5" />
          الإعلانات الحديثة
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recentAds?.map((ad) => (
            <div key={ad.id} className="border-b border-gray-100 pb-4 last:border-b-0">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-medium text-sm mb-1">{ad.title}</h4>
                  <p className="text-xs text-gray-600">
                    {ad.brand} {ad.model} - {ad.year}
                  </p>
                  <div className="flex items-center gap-4 mt-2">
                    <span className="text-xs text-gray-500">
                      بواسطة: {ad.profiles?.display_name || 'غير محدد'}
                    </span>
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      {ad.view_count}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {formatDistanceToNow(new Date(ad.created_at), {
                      addSuffix: true,
                      locale: ar,
                    })}
                  </p>
                </div>
                <div className="flex flex-col gap-1">
                  <div className="text-sm font-bold text-green-600">
                    {ad.price.toLocaleString('ar-SA')} ريال
                  </div>
                  <div className="flex gap-1">
                    {ad.is_premium && (
                      <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 text-xs">
                        <Star className="h-3 w-3" />
                      </Badge>
                    )}
                    <Badge 
                      variant={ad.status === 'active' ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {ad.status === 'active' ? 'نشط' : 'غير نشط'}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
