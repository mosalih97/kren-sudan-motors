
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Zap, Crown, Star, Clock } from "lucide-react";
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
          const hours = Math.floor(diff / (1000 * 60 * 60));
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          setTimeLeft(`${hours}س ${minutes}د`);
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
        return;
      }

      setBoostInfo(data);
    } catch (error) {
      console.error('Error fetching boost info:', error);
    }
  };

  if (!boostInfo) return null;

  const Icon = boostIcons[boostInfo.boost_plan as keyof typeof boostIcons] || Zap;
  const label = boostLabels[boostInfo.boost_plan as keyof typeof boostLabels] || "تعزيز";

  return (
    <Card className={`border-primary/20 bg-primary/5 ${className}`}>
      <CardContent className="p-3">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-primary" />
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
            {label}
          </Badge>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Clock className="w-3 h-3" />
            <span>{timeLeft}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
