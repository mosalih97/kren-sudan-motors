
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useBoostAd } from "@/hooks/useBoostAd";
import { useEffect } from "react";
import { TrendingUp, Star, Crown, Clock } from "lucide-react";

interface BoostAdDialogProps {
  adId: string;
  children: React.ReactNode;
  onBoostComplete?: () => void;
}

export function BoostAdDialog({ adId, children, onBoostComplete }: BoostAdDialogProps) {
  const { loading, boostTypes, fetchBoostTypes, boostAd } = useBoostAd();

  useEffect(() => {
    fetchBoostTypes();
  }, []);

  const handleBoost = async (boostTypeId: string) => {
    const result = await boostAd(adId, boostTypeId);
    if (result.success && onBoostComplete) {
      onBoostComplete();
    }
  };

  const getBoostIcon = (label: string) => {
    switch (label) {
      case 'سريع':
        return <TrendingUp className="h-5 w-5" />;
      case 'مميز':
        return <Star className="h-5 w-5" />;
      case 'احترافي':
        return <Crown className="h-5 w-5" />;
      default:
        return <TrendingUp className="h-5 w-5" />;
    }
  };

  const getBoostColor = (label: string) => {
    switch (label) {
      case 'سريع':
        return 'bg-blue-500';
      case 'مميز':
        return 'bg-purple-500';
      case 'احترافي':
        return 'bg-gold-500';
      default:
        return 'bg-blue-500';
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl">تعزيز الإعلان</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <p className="text-muted-foreground">
            اختر نوع التعزيز المناسب لإعلانك لزيادة المشاهدات والوصول لعدد أكبر من المشترين
          </p>
          
          <div className="grid gap-4">
            {boostTypes.map((boostType) => (
              <Card key={boostType.id} className="border-2 hover:border-primary transition-colors">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${getBoostColor(boostType.label)} text-white`}>
                        {getBoostIcon(boostType.label)}
                      </div>
                      <div>
                        <CardTitle className="text-lg">{boostType.label}</CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {boostType.features.description}
                        </p>
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-lg font-bold">
                      {boostType.points_cost} نقطة
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>
                          {boostType.duration_hours >= 24 
                            ? `${boostType.duration_hours / 24} يوم` 
                            : `${boostType.duration_hours} ساعة`}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <TrendingUp className="h-4 w-4" />
                        <span>زيادة {boostType.features.view_increase}%</span>
                      </div>
                    </div>
                  </div>
                  
                  <Button
                    onClick={() => handleBoost(boostType.id)}
                    disabled={loading}
                    className="w-full"
                    size="lg"
                  >
                    {loading ? 'جاري التعزيز...' : `تعزيز بـ ${boostType.points_cost} نقطة`}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
