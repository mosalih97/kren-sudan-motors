
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Zap, Star, Crown, Clock, TrendingUp, Target } from "lucide-react";
import { useBoostAd, useBoostTypes } from "@/hooks/useBoostAd";
import { useUserPoints } from "@/hooks/useUserPoints";
import { useState } from "react";

interface BoostAdDialogProps {
  adId: string;
  children: React.ReactNode;
}

export function BoostAdDialog({ adId, children }: BoostAdDialogProps) {
  const [open, setOpen] = useState(false);
  const { data: boostTypes, isLoading: typesLoading } = useBoostTypes();
  const { data: userPoints } = useUserPoints();
  const { boostAd, isLoading: boosting } = useBoostAd();

  const handleBoost = (boostTypeId: string) => {
    boostAd(
      { ad_id: adId, boost_type_id: boostTypeId },
      {
        onSuccess: () => {
          setOpen(false);
        },
      }
    );
  };

  const getBoostIcon = (label: string) => {
    switch (label) {
      case 'سريع':
        return <Zap className="w-5 h-5" />;
      case 'مميز':
        return <Star className="w-5 h-5" />;
      case 'احترافي':
        return <Crown className="w-5 h-5" />;
      default:
        return <TrendingUp className="w-5 h-5" />;
    }
  };

  const getBoostColor = (label: string) => {
    switch (label) {
      case 'سريع':
        return 'text-blue-500';
      case 'مميز':
        return 'text-purple-500';
      case 'احترافي':
        return 'text-gold-500';
      default:
        return 'text-primary';
    }
  };

  const canAfford = (cost: number) => {
    return userPoints && userPoints.total_points >= cost;
  };

  const isPremium = userPoints?.membership_type === 'premium';

  if (typesLoading) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>{children}</DialogTrigger>
        <DialogContent className="max-w-2xl">
          <div className="text-center py-8">جاري التحميل...</div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            تعزيز الإعلان
          </DialogTitle>
          <DialogDescription>
            اختر نوع التعزيز المناسب لإعلانك لزيادة المشاهدات والوصول
          </DialogDescription>
        </DialogHeader>

        {!isPremium && (
          <div className="p-4 bg-muted rounded-lg border border-orange-200">
            <div className="flex items-center gap-2 mb-2">
              <Crown className="w-5 h-5 text-orange-500" />
              <span className="font-semibold text-orange-700">عضوية مميزة مطلوبة</span>
            </div>
            <p className="text-sm text-orange-600">
              يجب أن تكون عضواً مميزاً لاستخدام خدمة تعزيز الإعلانات
            </p>
          </div>
        )}

        <div className="space-y-4">
          {boostTypes?.map((boostType) => (
            <Card key={boostType.id} className="relative">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <span className={getBoostColor(boostType.label)}>
                      {getBoostIcon(boostType.label)}
                    </span>
                    {boostType.label}
                    {boostType.features.badge && (
                      <Badge variant="secondary" className="text-xs">
                        {boostType.features.badge}
                      </Badge>
                    )}
                  </CardTitle>
                  <div className="text-left">
                    <div className="font-bold text-primary">{boostType.points_cost} نقطة</div>
                    <div className="text-sm text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {boostType.duration_hours < 24 
                        ? `${boostType.duration_hours} ساعة`
                        : `${Math.floor(boostType.duration_hours / 24)} يوم`
                      }
                    </div>
                  </div>
                </div>
                <CardDescription>
                  {boostType.features.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <Target className="w-4 h-4 text-green-500" />
                      <span>+{boostType.features.view_increase}% مشاهدات</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <TrendingUp className="w-4 h-4 text-blue-500" />
                      <span>أولوية {boostType.features.priority}</span>
                    </div>
                  </div>
                  <Button
                    onClick={() => handleBoost(boostType.id)}
                    disabled={!isPremium || !canAfford(boostType.points_cost) || boosting}
                    variant={canAfford(boostType.points_cost) ? "default" : "outline"}
                    size="sm"
                  >
                    {boosting ? "جاري التعزيز..." : "تعزيز الآن"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {userPoints && (
          <div className="mt-4 p-3 bg-muted rounded-lg">
            <div className="text-sm text-muted-foreground">
              رصيدك الحالي: <span className="font-semibold text-primary">{userPoints.total_points} نقطة</span>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
