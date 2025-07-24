
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Zap, Crown, Star, Clock, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface AdBoostStatusProps {
  adId: string;
  className?: string;
}

interface BoostInfo {
  boost_plan: string;
  expires_at: string;
  tier_priority: number;
  status: string;
}

const boostIcons = {
  basic: Zap,
  premium: Crown,
  ultimate: Star
};

const boostLabels = {
  basic: "تعزيز سريع",
  premium: "تعزيز مميز", 
  ultimate: "تعزيز احترافي"
};

export function AdBoostStatus({ adId, className }: AdBoostStatusProps) {
  const [boostInfo, setBoostInfo] = useState<BoostInfo | null>(null);
  const [timeLeft, setTimeLeft] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBoostInfo();
    const interval = setInterval(fetchBoostInfo, 60000); // تحديث كل دقيقة
    return () => clearInterval(interval);
  }, [adId]);

  useEffect(() => {
    if (boostInfo?.expires_at) {
      const timer = setInterval(() => {
        const now = new Date();
        const expires = new Date(boostInfo.expires_at);
        const diff = expires.getTime() - now.getTime();

        if (diff > 0) {
          const days = Math.floor(diff / (1000 * 60 * 60 * 24));
          const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          
          if (days > 0) {
            setTimeLeft(`${days} يوم ${hours} ساعة`);
          } else if (hours > 0) {
            setTimeLeft(`${hours} ساعة ${minutes} دقيقة`);
          } else {
            setTimeLeft(`${minutes} دقيقة`);
          }
        } else {
          setTimeLeft("منتهي");
          setBoostInfo(null);
        }
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [boostInfo]);

  const fetchBoostInfo = async () => {
    try {
      setLoading(true);
      
      // تنظيف الإعلانات المنتهية أولاً
      await supabase.rpc('cleanup_expired_top_spots');
      
      const { data, error } = await supabase
        .from('ad_boosts')
        .select('boost_plan, expires_at, tier_priority, status')
        .eq('ad_id', adId)
        .eq('status', 'active')
        .gt('expires_at', new Date().toISOString())
        .order('tier_priority', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching boost info:', error);
        setBoostInfo(null);
        return;
      }

      setBoostInfo(data);
    } catch (error) {
      console.error('Error fetching boost info:', error);
      setBoostInfo(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className={`border-muted bg-muted/20 ${className}`}>
        <CardContent className="p-3">
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
            <span className="text-sm text-muted-foreground">جاري التحقق من حالة التعزيز...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!boostInfo) {
    return (
      <Card className={`border-muted bg-muted/20 ${className}`}>
        <CardContent className="p-3">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">الإعلان غير معزز حالياً</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const Icon = boostIcons[boostInfo.boost_plan as keyof typeof boostIcons] || Zap;
  const label = boostLabels[boostInfo.boost_plan as keyof typeof boostLabels] || "تعزيز";

  return (
    <Card className={`border-primary/20 bg-primary/5 ${className}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon className="w-5 h-5 text-primary" />
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
              <CheckCircle className="w-3 h-3 ml-1" />
              {label}
            </Badge>
          </div>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span className="font-medium">{timeLeft}</span>
          </div>
        </div>
        <div className="mt-2 text-xs text-muted-foreground">
          الإعلان يظهر في المقدمة ويحصل على أولوية أعلى في نتائج البحث
        </div>
      </CardContent>
    </Card>
  );
}
