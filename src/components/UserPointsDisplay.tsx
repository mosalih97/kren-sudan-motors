
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Coins, Crown, Star } from "lucide-react";
import { useUserPoints } from "@/hooks/useUserPoints";

interface UserPointsDisplayProps {
  variant?: 'sidebar' | 'profile' | 'compact';
}

export function UserPointsDisplay({ variant = 'compact' }: UserPointsDisplayProps) {
  const { pointsData, loading } = useUserPoints();

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-20"></div>
      </div>
    );
  }

  if (!pointsData) return null;

  const { total_points, base_points, premium_credits, membership_type } = pointsData;

  if (variant === 'sidebar') {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Coins className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">إجمالي النقاط: {total_points}</span>
        </div>
        {membership_type === 'premium' && (
          <div className="text-xs text-muted-foreground space-y-1">
            <div className="flex items-center gap-1">
              <Star className="h-3 w-3" />
              <span>نقاط أساسية: {base_points}</span>
            </div>
            <div className="flex items-center gap-1">
              <Crown className="h-3 w-3 text-primary" />
              <span>نقاط مميزة: {premium_credits}</span>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (variant === 'profile') {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Coins className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">رصيد النقاط</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{total_points}</div>
                <div className="text-sm text-muted-foreground">إجمالي النقاط</div>
              </div>
              
              <div className="text-center">
                <div className="text-xl font-semibold">{base_points}</div>
                <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                  <Star className="h-3 w-3" />
                  النقاط الأساسية
                </div>
              </div>
              
              {membership_type === 'premium' && (
                <div className="text-center">
                  <div className="text-xl font-semibold text-primary">{premium_credits}</div>
                  <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                    <Crown className="h-3 w-3 text-primary" />
                    نقاط العضوية المميزة
                  </div>
                </div>
              )}
            </div>
            
            <div className="text-xs text-muted-foreground text-center">
              {membership_type === 'premium' ? 
                'كمستخدم مميز، يمكنك استخدام جميع النقاط للتعزيز' : 
                'تحتاج عضوية مميزة لاستخدام ميزات التعزيز المتقدمة'
              }
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // compact variant
  return (
    <Badge variant="outline" className="gap-1">
      <Coins className="h-3 w-3" />
      {total_points} نقطة
    </Badge>
  );
}
