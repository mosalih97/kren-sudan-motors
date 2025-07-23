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
  title: string;
  description: string;
  price: number;
  location: string;
  category: string;
  image_urls: string[];
  user_id: string;
  expires_at: string;
  boost_expires_at: string | null;
  is_boosted: boolean;
}

const BoostAd = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const { data: ad, isLoading, isError } = useQuery(['ad', id], async () => {
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
  });

  useEffect(() => {
    if (!user) {
      navigate('/auth');
    }
  }, [user, navigate]);

  if (isLoading) {
    return <div>Loading ad...</div>;
  }

  if (isError || !ad) {
    return <div>Error loading ad.</div>;
  }

  const isBoosted = ad.is_boosted && ad.boost_expires_at !== null && new Date(ad.boost_expires_at) > new Date();

  const handleBoost = async () => {
    setLoading(true);
    try {
      const boostUntil = new Date();
      boostUntil.setDate(boostUntil.getDate() + 7);

      const { data, error } = await supabase
        .from('ads')
        .update({
          is_boosted: true,
          boost_expires_at: boostUntil.toISOString(),
        })
        .eq('id', id);

      if (error) {
        throw new Error(error.message);
      }

      toast({
        title: "تم تفعيل البوست بنجاح",
        description: "سيظهر إعلانك في أعلى القائمة لمدة 7 أيام.",
      });

      navigate(`/ad/${id}`);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "فشل تفعيل البوست",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl">تفعيل البوست للإعلان</CardTitle>
          <CardDescription>اجعل إعلانك يظهر في أعلى القائمة لمدة 7 أيام.</CardDescription>
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
                السعر: <Badge>{ad.price} جنيه</Badge>
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-gray-500" />
              <p className="text-sm">
                تاريخ الإنتهاء: {new Date(ad.expires_at).toLocaleDateString()}
              </p>
            </div>
          </div>

          {isBoosted ? (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                إعلانك مُفعل ويظهر في أعلى القائمة حتى: {new Date(ad.boost_expires_at!).toLocaleDateString()}
              </AlertDescription>
            </Alert>
          ) : (
            <>
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  هل أنت متأكد أنك تريد تفعيل البوست؟ سيتم خصم مبلغ من رصيدك وسيظهر إعلانك في أعلى القائمة لمدة 7 أيام.
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
                    جاري تفعيل البوست...
                  </>
                ) : (
                  "تفعيل البوست"
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
