
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Clock, Star, Zap, CreditCard, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import Header from '@/components/Header';
import { useQuery } from '@tanstack/react-query';

interface Ad {
  id: string;
  created_at: string;
  updated_at: string;
  title: string;
  description: string;
  price: number;
  year: number;
  condition: string;
  city: string;
  phone: string;
  whatsapp: string;
  images: string[];
  status: string;
  brand: string;
  model: string;
  mileage: string;
  fuel_type: string;
  transmission: string;
  user_id: string;
  is_featured: boolean;
  is_premium: boolean;
  is_new: boolean;
  view_count: number;
  top_spot: boolean;
  top_spot_until: string | null;
  times_shown_top: number;
  last_top_spot_viewed: string | null;
  priority_score: number;
}

const BoostAd = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const { data: ad, isLoading, isError } = useQuery({
    queryKey: ['ad', id],
    queryFn: async () => {
      if (!id) {
        throw new Error('Ad ID is required');
      }

      const { data, error } = await supabase
        .from('ads')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return data as Ad;
    }
  });

  useEffect(() => {
    if (!user) {
      navigate('/auth');
    }
  }, [user, navigate]);

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <Header />
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">جاري تحميل الإعلان...</span>
        </div>
      </div>
    );
  }

  if (isError || !ad) {
    return (
      <div className="container mx-auto py-8">
        <Header />
        <div className="text-center">
          <p className="text-red-500">خطأ في تحميل الإعلان</p>
        </div>
      </div>
    );
  }

  const isBoosted = ad.top_spot && ad.top_spot_until !== null && new Date(ad.top_spot_until) > new Date();

  const handleBoost = async () => {
    if (!id) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('boost-ad', {
        body: { 
          ad_id: id,
          hours_duration: 72 // 3 أيام
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data?.success) {
        toast({
          title: "تم تعزيز الإعلان بنجاح",
          description: "سيظهر إعلانك في أعلى القائمة لمدة 3 أيام.",
        });
        navigate(`/ad/${id}`);
      } else {
        throw new Error(data?.message || 'فشل في تعزيز الإعلان');
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "فشل تعزيز الإعلان",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <Header />
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl">تعزيز الإعلان</CardTitle>
          <CardDescription>اجعل إعلانك يظهر في أعلى القائمة لمدة 3 أيام.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">
              {ad.title}
            </h3>
            <p className="text-gray-500">
              {ad.description}
            </p>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Zap className="h-4 w-4 text-yellow-500" />
              <p className="text-sm">
                السعر: <Badge>{ad.price.toLocaleString()} جنيه</Badge>
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-gray-500" />
              <p className="text-sm">
                تاريخ الإنشاء: {new Date(ad.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>

          {isBoosted ? (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                إعلانك مُعزز ويظهر في أعلى القائمة حتى: {new Date(ad.top_spot_until!).toLocaleDateString()}
              </AlertDescription>
            </Alert>
          ) : (
            <>
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  هل أنت متأكد أنك تريد تعزيز الإعلان؟ سيتم خصم 60 نقطة من رصيدك وسيظهر إعلانك في أعلى القائمة لمدة 3 أيام.
                </AlertDescription>
              </Alert>
              <Button
                className="w-full"
                onClick={handleBoost}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    جاري تعزيز الإعلان...
                  </>
                ) : (
                  <>
                    <Zap className="mr-2 h-4 w-4" />
                    تعزيز الإعلان (60 نقطة)
                  </>
                )}
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default BoostAd;
